import { createHash } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const manualPath = path.join(projectRoot, 'src', 'data', 'projects.json')
const githubPath = path.join(projectRoot, 'src', 'data', 'github-projects.generated.json')
const catalogPath = path.join(projectRoot, 'src', 'data', 'projects.catalog.generated.json')
const simplePath = path.join(projectRoot, 'public', 'simple.html')
const publicProjectsPath = path.join(projectRoot, 'public', 'projects')
const generatedImagesPath = path.join(publicProjectsPath, 'generated-github')
const syncScriptPath = path.join(scriptDirectory, 'sync-github-projects.mjs')
const projectListMarkers = /<!-- PORTFOLIO_PROJECTS:START -->[\s\S]*?<!-- PORTFOLIO_PROJECTS:END -->/
const palette = ['#51d4cb', '#f184bd', '#f0bb6f', '#84c4f4', '#b39ae8', '#83d391']

function readJsonOrFallback(filePath, fallback) {
  return readFile(filePath, 'utf8')
    .then((contents) => JSON.parse(contents))
    .catch((error) => {
      if (error.code === 'ENOENT') return fallback
      throw error
    })
}

function normalizeGithubUrl(value) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== 'github.com') return null
    return url.pathname.replace(/\.git$/i, '').replace(/\/+$/, '').toLowerCase()
  } catch {
    return null
  }
}

function safeStem(value) {
  const readable = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'repo'
  const suffix = createHash('sha1').update(String(value)).digest('hex').slice(0, 7)
  return `${readable}-${suffix}`
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character])
}

function colorFor(value) {
  const hash = createHash('sha1').update(value).digest()
  return palette[hash[0] % palette.length]
}

function createPlaceholderSvg(name, language, accent) {
  const safeName = escapeXml(name)
  const safeLanguage = escapeXml(language || 'Repository')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" role="img" aria-labelledby="title desc"><title id="title">${safeName} project placeholder</title><desc id="desc">Neutral generated portfolio artwork showing the repository name and language, not a project screenshot.</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#111722"/><stop offset="1" stop-color="#1d2634"/></linearGradient></defs><rect width="600" height="360" fill="url(#bg)"/><path d="M0 278h600M64 0v360M536 0v360" stroke="${accent}" stroke-opacity=".22"/><rect x="72" y="65" width="456" height="190" rx="4" fill="#101720" stroke="${accent}" stroke-opacity=".72"/><path d="M96 91h78M96 107h46M96 223h168" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="458" cy="158" r="38" fill="none" stroke="${accent}" stroke-width="3" opacity=".8"/><circle cx="458" cy="158" r="7" fill="${accent}"/><text x="96" y="157" fill="#f1f4f8" font-family="monospace" font-size="25" font-weight="700">${safeName}</text><text x="96" y="196" fill="#9ba9b9" font-family="monospace" font-size="16">${safeLanguage}</text><text x="72" y="315" fill="#82909f" font-family="monospace" font-size="13" letter-spacing="2">GENERATED PROJECT LABEL / NOT A SCREENSHOT</text></svg>`
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveImage(repo) {
  if (repo.image) {
    return {
      image: repo.image,
      imageAlt: repo.imageAlt || `Repository-provided project image for ${repo.name}.`,
      imageSource: 'override',
    }
  }

  const providedPng = path.join(publicProjectsPath, `${repo.name}.png`)
  if (await fileExists(providedPng)) {
    return {
      image: `projects/${repo.name}.png`,
      imageAlt: `Provided project image for ${repo.name}.`,
      imageSource: 'provided-png',
    }
  }

  const imageName = `${safeStem(repo.full_name)}.svg`
  const imagePath = path.join(generatedImagesPath, imageName)
  await mkdir(generatedImagesPath, { recursive: true })
  await writeFile(imagePath, createPlaceholderSvg(repo.name, repo.language, colorFor(repo.full_name)), 'utf8')
  return {
    image: `projects/generated-github/${imageName}`,
    imageAlt: `Generated neutral placeholder for ${repo.name}${repo.language ? ` (${repo.language})` : ''}; not a screenshot.`,
    imageSource: 'generated-placeholder',
  }
}

function manualProject(project) {
  return {
    ...project,
    source: 'manual',
    repositoryUrl: normalizeGithubUrl(project.repo_url) || normalizeGithubUrl(project.html_url) || normalizeGithubUrl(project.link),
    liveDemoUrl: null,
    isFork: false,
    forkLabel: null,
    parent: null,
    license: null,
    featured: false,
    displayMode: project.description ? 'description' : 'name-language-only',
    needsDescription: !project.description,
    imageSource: 'existing-manual-asset',
  }
}

async function githubProject(repo) {
  const missingDescription = Boolean(repo.needs_description || !repo.description)
  const tags = missingDescription
    ? (repo.language ? [repo.language] : [])
    : [...new Set([repo.language, ...(repo.tags || repo.topics || [])].filter(Boolean))]
  const resolvedImage = await resolveImage(repo)
  const project = {
    id: `github-${safeStem(repo.full_name)}`,
    title: repo.title || repo.name,
    category: 'GitHub repository',
    description: repo.description,
    tags,
    color: colorFor(repo.full_name),
    ...resolvedImage,
    link: null,
    source: 'github',
    repositoryUrl: repo.html_url,
    liveDemoUrl: repo.live_demo_url || null,
    homepage: repo.homepage || null,
    language: repo.language,
    topics: repo.topics || [],
    isFork: Boolean(repo.fork),
    forkLabel: repo.fork_label || null,
    parent: repo.parent || null,
    license: repo.license || null,
    featured: Boolean(repo.featured),
    featuredOrder: repo.featured_order,
    displayMode: missingDescription ? 'name-language-only' : 'description',
    needsDescription: missingDescription,
    needsImage: resolvedImage.imageSource === 'generated-placeholder',
    homepageCheck: repo.homepage_check || 'not-set',
  }
  if (repo.role) project.role = repo.role
  if (Array.isArray(repo.myContributions) && repo.myContributions.length > 0) {
    project.myContributions = repo.myContributions
  }
  return project
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function imageUrl(image) {
  if (/^(https?:|data:image\/)/i.test(image)) return image
  return `./${String(image).replace(/^\/+/, '')}`
}

function externalLink(url, label, className = '') {
  if (!url) return ''
  return `<a${className ? ` class="${className}"` : ''} href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
}

function projectMarkup(project) {
  const tags = project.displayMode === 'name-language-only'
    ? (project.language ? [project.language] : [])
    : (project.tags || [])
  const description = project.description
    ? `<p>${escapeHtml(project.description)}</p>`
    : ''
  const tagsMarkup = tags.length > 0
    ? `<p class="project-tags">${tags.map(escapeHtml).join(' · ')}</p>`
    : ''
  const roleMarkup = project.role ? `<p class="project-role">${escapeHtml(project.role)}</p>` : ''
  const forkMarkup = project.isFork && project.parent
    ? `<p class="project-fork">${externalLink(project.parent.html_url, project.forkLabel || `Fork of ${project.parent.full_name} by ${project.parent.owner}`)}${project.license ? ` · Licence: ${escapeHtml(project.license)}` : ''}</p>`
    : ''
  const contributionsMarkup = Array.isArray(project.myContributions) && project.myContributions.length > 0
    ? `<p class="project-contributions">My contributions: ${project.myContributions.map(escapeHtml).join(', ')}</p>`
    : ''
  const repositoryLink = project.source === 'github'
    ? externalLink(project.repositoryUrl, 'GitHub repository')
    : externalLink(project.link, 'Learn more')
  const liveLink = project.source === 'github' ? externalLink(project.liveDemoUrl, 'Live demo') : ''
  const conceptStatus = project.source === 'manual' && !project.link
    ? '<span class="coming-soon">Sample concept · Coming soon</span>'
    : ''
  return `<article class="project"><img src="${escapeHtml(imageUrl(project.image))}" alt="${escapeHtml(project.imageAlt)}" /><div><h3>${escapeHtml(project.title)}</h3>${description}${tagsMarkup}${roleMarkup}${forkMarkup}${contributionsMarkup}<p class="project-links">${repositoryLink}${liveLink}</p>${conceptStatus}</div></article>`
}

function staticProjectsMarkup(projects) {
  return projects.map(projectMarkup).join('\n          ')
}

const sync = spawnSync(process.execPath, [syncScriptPath], { cwd: projectRoot, stdio: 'inherit' })
if (sync.error) throw sync.error
if (sync.status !== 0) throw new Error(`GitHub sync exited with status ${sync.status}.`)

const [manualData, githubData] = await Promise.all([
  readJsonOrFallback(manualPath, { items: [] }),
  readJsonOrFallback(githubPath, { repositories: [] }),
])
const manualItems = Array.isArray(manualData.items) ? manualData.items.map(manualProject) : []
const manualRepoUrls = new Set(manualItems.map((project) => project.repositoryUrl).filter(Boolean))
const seenGeneratedUrls = new Set()
const githubItems = []

for (const repo of githubData.repositories || []) {
  const repoUrl = normalizeGithubUrl(repo.html_url)
  if (repo.hidden || !repoUrl || manualRepoUrls.has(repoUrl) || seenGeneratedUrls.has(repoUrl)) continue
  seenGeneratedUrls.add(repoUrl)
  githubItems.push(await githubProject(repo))
}

const featuredProjects = githubItems.filter((project) => project.featured)
  .sort((first, second) => (first.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (second.featuredOrder ?? Number.MAX_SAFE_INTEGER))
const regularGithubProjects = githubItems.filter((project) => !project.featured)
const projects = [...featuredProjects, ...manualItems, ...regularGithubProjects]
const catalog = { pageSize: 8, items: projects }
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

const simpleHtml = await readFile(simplePath, 'utf8')
if (!projectListMarkers.test(simpleHtml)) {
  throw new Error('simple.html is missing the PORTFOLIO_PROJECTS markers; refusing to replace unmarked content.')
}
const generatedList = `<!-- PORTFOLIO_PROJECTS:START -->\n          ${staticProjectsMarkup(projects)}\n          <!-- PORTFOLIO_PROJECTS:END -->`
await writeFile(simplePath, simpleHtml.replace(projectListMarkers, generatedList), 'utf8')

console.log(`Prepared a ${projects.length}-project catalog (${featuredProjects.length} featured repositories, ${manualItems.length} manual entries, ${regularGithubProjects.length} other repositories).`)
console.log(`Repository URLs already represented by manual projects were kept as manual entries.`)
console.log(`Repos missing descriptions: ${githubItems.filter((project) => project.needsDescription).map((project) => project.repositoryUrl).join(', ') || 'none'}.`)
console.log(`Generated placeholder images: ${githubItems.filter((project) => project.needsImage).map((project) => project.title).join(', ') || 'none'}.`)
