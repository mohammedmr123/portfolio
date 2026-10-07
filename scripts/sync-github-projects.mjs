import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const configPath = path.join(scriptDirectory, 'projects.config.json')
const generatedPath = path.join(projectRoot, 'src', 'data', 'github-projects.generated.json')
const temporaryPath = `${generatedPath}.tmp`
const apiRoot = 'https://api.github.com'
const config = JSON.parse(await readFile(configPath, 'utf8'))
const username = (process.env.GITHUB_USERNAME || config.username || '').trim()
const featuredList = Array.isArray(config.FEATURED) ? config.FEATURED : []

if (!username) {
  throw new Error('Set username in scripts/projects.config.json or GITHUB_USERNAME in the environment.')
}

function normalizeRepoKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '')
}

function matchesRepoList(repo, list) {
  const keys = new Set([normalizeRepoKey(repo.name), normalizeRepoKey(repo.full_name)])
  return list.some((entry) => keys.has(normalizeRepoKey(entry)))
}

async function githubJson(url) {
  const token = process.env.GITHUB_TOKEN
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-build-project-sync',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
  if (!response.ok) {
    const requestPath = new URL(url).pathname
    throw new Error(`GitHub API returned HTTP ${response.status} for ${requestPath}`)
  }
  return response.json()
}

async function checkHomepage(homepage) {
  if (!homepage) return { liveDemoUrl: null, status: 'not-set' }
  try {
    const url = new URL(homepage)
    if (!['http:', 'https:'].includes(url.protocol)) return { liveDemoUrl: null, status: 'invalid-url' }
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    return response.ok
      ? { liveDemoUrl: url.href, status: 'reachable' }
      : { liveDemoUrl: null, status: `http-${response.status}` }
  } catch {
    return { liveDemoUrl: null, status: 'unreachable' }
  }
}

async function checkReadme(fullName) {
  const repoPath = fullName.split('/').map(encodeURIComponent).join('/')
  try {
    await githubJson(new URL(`/repos/${repoPath}/readme`, apiRoot))
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP 404')) return false
    throw error
  }
}

async function fetchAllRepositories() {
  const repositories = []
  let page = 1

  while (true) {
    const url = new URL(`/users/${encodeURIComponent(username)}/repos`, apiRoot)
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(page))
    const result = await githubJson(url)
    if (!Array.isArray(result)) throw new Error('GitHub API returned an unexpected repository list.')
    repositories.push(...result)
    if (result.length < 100) return repositories
    page += 1
  }
}

function repoMatchesPortfolio(repo) {
  const portfolioRepo = normalizeRepoKey(config.portfolioRepo || `${username}/portfolio`)
  return normalizeRepoKey(repo.full_name) === portfolioRepo
}

async function mapRepository(repo) {
  let parent = null
  if (repo.fork) {
    const parentUrl = repo.parent?.full_name
      ? new URL(`/repos/${repo.parent.full_name.split('/').map(encodeURIComponent).join('/')}`, apiRoot)
      : null
    if (parentUrl) {
      const parentRepo = await githubJson(parentUrl)
      if (parentRepo?.full_name && parentRepo?.html_url && parentRepo?.owner?.login) {
        parent = {
          full_name: parentRepo.full_name,
          html_url: parentRepo.html_url,
          owner: parentRepo.owner.login,
        }
      }
    }
  }

  const overrides = config.OVERRIDES?.[repo.full_name] ?? config.OVERRIDES?.[repo.name] ?? {}
  const hasOverride = (key) => Object.hasOwn(overrides, key)
  const topics = Array.isArray(repo.topics) ? repo.topics : []
  const description = hasOverride('description') ? overrides.description : repo.description
  const title = hasOverride('title') ? overrides.title : repo.name
  const image = hasOverride('image') ? overrides.image : null
  const homepage = repo.homepage || null
  const [homepageCheck, hasReadme] = await Promise.all([
    checkHomepage(homepage),
    checkReadme(repo.full_name),
  ])
  const featuredIndex = featuredList.findIndex((entry) => matchesRepoList(repo, [entry]))
  const mapped = {
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    title,
    description,
    language: repo.language,
    topics,
    tags: hasOverride('tags') ? overrides.tags : topics,
    homepage,
    live_demo_url: homepageCheck.liveDemoUrl,
    homepage_check: homepageCheck.status,
    stargazers_count: repo.stargazers_count,
    size_kb: repo.size,
    empty: repo.size === 0,
    has_readme: hasReadme,
    updated_at: repo.updated_at,
    fork: Boolean(repo.fork),
    parent,
    fork_label: repo.fork && parent ? `Fork of ${parent.full_name} by ${parent.owner}` : null,
    license: repo.license?.spdx_id ?? null,
    featured: featuredIndex >= 0,
    featured_order: featuredIndex >= 0 ? featuredIndex : null,
    image,
    hidden: Boolean(overrides.hidden),
    display_mode: description ? 'description' : 'name-language-only',
    needs_description: !description,
    needs_image: !image,
  }
  if (hasOverride('role')) mapped.role = overrides.role
  if (Array.isArray(overrides.myContributions) && overrides.myContributions.length > 0) {
    mapped.myContributions = overrides.myContributions
  }
  return mapped
}

try {
  const repositories = await fetchAllRepositories()
  const excluded = { archived: 0, portfolio: 0, config: 0, includeOnly: 0 }
  const includeOnly = Array.isArray(config.INCLUDE_ONLY) ? config.INCLUDE_ONLY : []
  const excludeList = Array.isArray(config.EXCLUDE) ? config.EXCLUDE : []
  const eligible = repositories.filter((repo) => {
    if (repo.archived) {
      excluded.archived += 1
      return false
    }
    if (repoMatchesPortfolio(repo)) {
      excluded.portfolio += 1
      return false
    }
    if (matchesRepoList(repo, excludeList)) {
      excluded.config += 1
      return false
    }
    if (includeOnly.length > 0 && !matchesRepoList(repo, includeOnly)) {
      excluded.includeOnly += 1
      return false
    }
    return true
  })

  const mapped = []
  for (const repo of eligible) mapped.push(await mapRepository(repo))
  mapped.sort((first, second) => {
    if (first.featured !== second.featured) return first.featured ? -1 : 1
    if (first.featured && second.featured) return first.featured_order - second.featured_order
    return Date.parse(second.updated_at) - Date.parse(first.updated_at)
  })

  const output = {
    username,
    generated_at: new Date().toISOString(),
    excluded,
    repositories: mapped,
  }
  await mkdir(path.dirname(generatedPath), { recursive: true })
  await writeFile(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, generatedPath)

  console.log(`Synced ${mapped.length} public repositories for ${username}.`)
  console.log(`Excluded: ${excluded.archived} archived, ${excluded.portfolio} portfolio, ${excluded.config} configured, ${excluded.includeOnly} outside INCLUDE_ONLY.`)
  console.log(`Featured first: ${mapped.filter((repo) => repo.featured).map((repo) => repo.name).join(', ') || 'none'}.`)
  console.log(`Repositories needing descriptions: ${mapped.filter((repo) => repo.needs_description).map((repo) => repo.full_name).join(', ') || 'none'}.`)
} catch (error) {
  try {
    await import('node:fs/promises').then(({ rm }) => rm(temporaryPath, { force: true }))
  } catch {
    // Leave any existing generated file untouched if temporary-file cleanup fails.
  }
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`Warning: GitHub project sync failed; keeping the last generated file. ${message}`)
}
