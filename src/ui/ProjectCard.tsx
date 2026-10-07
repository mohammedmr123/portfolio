export type ProjectCardProject = {
  id: string
  title: string
  category: string
  description: string | null
  tags: string[]
  color: string
  image: string
  imageAlt: string
  link: string | null
  source: 'manual' | 'github'
  repositoryUrl?: string | null
  liveDemoUrl?: string | null
  language?: string | null
  isFork?: boolean
  forkLabel?: string | null
  parent?: { full_name: string; html_url: string; owner: string } | null
  license?: string | null
  role?: string
  myContributions?: string[]
}

function isExternalImage(source: string) {
  return /^(https?:|data:image\/)/i.test(source)
}

export function ProjectCard({ project, index, total, onBack }: {
  project: ProjectCardProject
  index: number
  total: number
  onBack: () => void
}) {
  const isGithubProject = project.source === 'github'
  const parent = project.parent
  const language = project.language
  const role = project.role
  const contributions = project.myContributions
  const imageSrc = isExternalImage(project.image)
    ? project.image
    : `${import.meta.env.BASE_URL}${project.image.replace(/^\/+/, '')}`

  return (
    <article className="project-card" aria-live="polite" aria-label={`${project.title} project details`}>
      <header className="project-card-header">
        <span>{isGithubProject ? `GITHUB / ${language || 'REPOSITORY'}` : `SAMPLE DATA / ${project.category}`}</span>
        <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </header>
      <div className="project-card-main">
        <img src={imageSrc} alt={project.imageAlt} />
        <div className="project-card-copy">
          <h2>{project.title}</h2>
          {project.description && <p>{project.description}</p>}
          <ul className="project-tags" aria-label="Project technologies">
            {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          {role && <p className="project-role">{role}</p>}
          {isGithubProject && project.isFork && (
            <div className="project-fork-details">
              <p>{project.forkLabel || `Fork of ${parent?.full_name || 'upstream repository'} by ${parent?.owner || 'upstream owner'}`}</p>
              {parent?.html_url && <a href={parent.html_url} target="_blank" rel="noopener noreferrer">Original repository</a>}
              <p>Licence: {project.license || 'Not specified'}</p>
            </div>
          )}
          {isGithubProject && !project.isFork && project.license && <p className="project-license">Licence: {project.license}</p>}
          {Array.isArray(contributions) && contributions.length > 0 && (
            <p className="project-contributions">My contributions: {contributions.join(', ')}</p>
          )}
        </div>
      </div>
      <footer className="project-card-actions">
        <button type="button" className="project-back-button" onClick={onBack}>Go Back</button>
        {isGithubProject && project.repositoryUrl ? (
          <>
            <a className="project-learn-link" href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">GitHub repo <span aria-hidden="true">↗</span></a>
            {project.liveDemoUrl && <a className="project-learn-link" href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a>}
          </>
        ) : project.link ? (
          <a className="project-learn-link" href={project.link} target="_blank" rel="noopener noreferrer">Learn More <span aria-hidden="true">↗</span></a>
        ) : (
          <button type="button" className="project-coming-soon" disabled>Coming soon</button>
        )}
      </footer>
    </article>
  )
}