import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import profile from '../data/profile.json'
import skillData from '../data/skills.json'
import type { MarketDestination } from '../scenes/navigation'

const tabs = ['about', 'skills', 'experience', 'diplomas'] as const
type ProfileTab = (typeof tabs)[number]
type DiplomaEntry = { title: string; institution: string; year: string }

const tabLabels: Record<ProfileTab, string> = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  diplomas: 'Diplomas',
}

function AboutContent() {
  return (
    <div className="profile-about-content">
      <span className="monitor-section-label">PLAYER PROFILE / 01</span>
      <h1>Mohammed Marzaq</h1>
      <p className="monitor-profile-role">Unity Developer <i /> Full Stack Developer &amp; Data Analyst</p>
      <p className="monitor-bio">{profile.bio}</p>
      <div className="monitor-status"><span /> FOCUS / INTERACTIVE + FULL STACK + DATA</div>
    </div>
  )
}

function SkillsContent() {
  return (
    <div className="profile-skills-content">
      <span className="monitor-section-label">SKILL MATRIX / 02</span>
      <div className="skills-cloud" aria-label="Skills sized by draft relative proficiency">
        {skillData.items.map((skill) => (
          <span
            key={skill.name}
            style={{ '--skill-strength': skill.strength, '--skill-color': skill.color } as React.CSSProperties}
          >
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function ExperienceContent() {
  return (
    <div className="profile-experience-content">
      <span className="monitor-section-label">WORK HISTORY / 03</span>
      <ol className="experience-list">
        {profile.experience.map((role, index) => (
          <li key={role.company}>
            <span className="experience-index">0{index + 1}</span>
            <div>
              <h2>{role.company}</h2>
              <p>{role.role}</p>
            </div>
            <time>{role.period}</time>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DiplomasContent() {
  const diplomas = profile.diplomas as DiplomaEntry[]

  return (
    <div className="profile-experience-content">
      <span className="monitor-section-label">DIPLOMAS / 04</span>
      {diplomas.length > 0 ? (
        <ol className="experience-list diploma-list">
          {diplomas.map((diploma, index) => (
            <li key={`${diploma.institution}-${diploma.title}`}>
              <span className="experience-index">0{index + 1}</span>
              <div>
                <h2>{diploma.title}</h2>
                <p>{diploma.institution}</p>
              </div>
              <time>{diploma.year}</time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="diploma-empty-state">No diplomas added yet.</p>
      )}
    </div>
  )
}

function ProfileTabPanel({ tab }: { tab: ProfileTab }) {
  if (tab === 'skills') return <SkillsContent />
  if (tab === 'experience') return <ExperienceContent />
  if (tab === 'diplomas') return <DiplomasContent />
  return <AboutContent />
}

export function AboutMonitorPanel({ isMobile, onNavigate, onHotspotHover }: {
  isMobile: boolean
  onNavigate: (destination: MarketDestination) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const id = useId()
  const [activeTab, setActiveTab] = useState<ProfileTab>('about')

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === currentIndex) return
    event.preventDefault()
    setActiveTab(tabs[nextIndex])
    document.getElementById(`${id}-tab-${tabs[nextIndex]}`)?.focus()
  }

  return (
    <div className={`about-monitor-ui${isMobile ? ' is-mobile' : ''}`}>
      <div className="monitor-ui-topline">
        <span>MM / SYSTEM PROFILE</span>
        <span className="monitor-online"><i /> ONLINE</span>
      </div>
      <div className="monitor-ui-main">
        <div className="monitor-tab-list" role="tablist" aria-label="Profile sections" aria-orientation="vertical">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              id={`${id}-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${id}-panel`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span>0{index + 1}</span>{tabLabels[tab]}
            </button>
          ))}
        </div>
        <section id={`${id}-panel`} className="monitor-tab-panel" role="tabpanel" aria-labelledby={`${id}-tab-${activeTab}`} tabIndex={0}>
          <ProfileTabPanel tab={activeTab} />
        </section>
      </div>
      <footer className="monitor-ui-footer">
        <div className="monitor-socials" aria-label="Social links">
          {profile.socials.map((social) => (
            <button
              key={social.id}
              type="button"
              disabled={!social.url}
              aria-label={`${social.label}${social.url ? '' : ' link not configured'}`}
              title={social.label}
              onMouseEnter={() => onHotspotHover(Boolean(social.url))}
              onMouseLeave={() => onHotspotHover(false)}
              onClick={() => {
                if (!social.url) return
                const target = social.url.startsWith('http') || social.url.startsWith('mailto:')
                  ? social.url
                  : `${window.location.origin}${social.url}`
                window.open(target, '_blank', 'noopener,noreferrer')
              }}
            >
              {social.mark}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="monitor-back-button"
          aria-label="Back to night market hub"
          title="Back to hub"
          onClick={() => onNavigate('hub')}
          onMouseEnter={() => onHotspotHover(true)}
          onMouseLeave={() => onHotspotHover(false)}
        >
          <span aria-hidden="true">←</span><span>BACK TO HUB</span>
        </button>
      </footer>
      <div className="monitor-bezel-caption" aria-hidden="true">MARZAQ / CRT-08 / 2400 BAUD</div>
    </div>
  )
}