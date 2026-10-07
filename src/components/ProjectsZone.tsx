import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import generatedProjectContent from '../data/projects.catalog.generated.json'
import { ProjectCard, type ProjectCardProject } from '../ui/ProjectCard'

const projectContent = generatedProjectContent as unknown as { pageSize: number; items: ProjectCardProject[] }
type Project = ProjectCardProject

function ProjectBottle({ project, index, position, isMobile, isActive, onSelect, onHotspotHover }: {
  project: Project
  index: number
  position: [number, number, number]
  isMobile: boolean
  isActive: boolean
  onSelect: (projectId: string) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const [hovered, setHovered] = useState(false)
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(project.id)
  }
  const handleHover = (event: ThreeEvent<PointerEvent>, nextHovered: boolean) => {
    event.stopPropagation()
    setHovered(nextHovered)
    onHotspotHover(nextHovered)
  }

  return (
    <group
      position={position}
      onClick={isActive ? handleClick : undefined}
      onPointerOver={isActive ? (event) => handleHover(event, true) : undefined}
      onPointerOut={isActive ? (event) => handleHover(event, false) : undefined}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.82, 0.84, 0.08]} />
        <meshStandardMaterial color="#111722" emissive={project.color} emissiveIntensity={hovered ? 0.6 : 0.08} metalness={0.45} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.17, 0.14]} castShadow>
        <cylinderGeometry args={[0.22, 0.27, 0.43, 8]} />
        <meshStandardMaterial color={project.color} emissive={project.color} emissiveIntensity={0.55} roughness={0.24} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.46, 0.14]}>
        <cylinderGeometry args={[0.12, 0.16, 0.17, 8]} />
        <meshStandardMaterial color={project.color} emissive={project.color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.58, 0.14]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 8]} />
        <meshStandardMaterial color="#e7e9f2" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.16, 0.279]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshBasicMaterial color="#091018" toneMapped={false} />
      </mesh>
      {isActive && (
        <>
          <Html position={[0, 0.16, 0.286]} center distanceFactor={8}>
            <span className="bottle-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </Html>
          <Html position={[0, 0.16, 0.34]} center>
            <button
              type="button"
              className="bottle-action"
              aria-label={`View ${project.title}`}
              onClick={() => onSelect(project.id)}
              onFocus={() => onHotspotHover(true)}
              onBlur={() => onHotspotHover(false)}
              onPointerEnter={() => { setHovered(true); onHotspotHover(true) }}
              onPointerLeave={() => { setHovered(false); onHotspotHover(false) }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
            </button>
          </Html>
        </>
      )}
      {!isMobile && <pointLight position={[0, 0.2, 0.2]} color={project.color} intensity={0.18} distance={1.3} />}
    </group>
  )
}

function ArcadeCabinet({ isMobile, isActive, arcadeStarted, onArcadeStart }: {
  isMobile: boolean
  isActive: boolean
  arcadeStarted: boolean
  onArcadeStart: () => void
}) {
  return (
    <group position={[-12.45, 0, 0.1]} rotation={[0, -0.035, 0]}>
      <mesh position={[0, 1.74, 0]} castShadow>
        <boxGeometry args={[2.15, 3.48, 0.95]} />
        <meshStandardMaterial color="#241c32" metalness={0.48} roughness={0.38} />
      </mesh>
      <mesh position={[0, 3.56, 0.02]} castShadow>
        <boxGeometry args={[2.18, 0.34, 0.99]} />
        <meshStandardMaterial color="#321c3d" emissive="#a131c6" emissiveIntensity={0.38} />
      </mesh>
      <mesh position={[0, 2.55, 0.5]}>
        <boxGeometry args={[1.84, 1.38, 0.08]} />
        <meshStandardMaterial color="#050710" metalness={0.32} roughness={0.32} emissive="#3c1e74" emissiveIntensity={0.16} />
      </mesh>
      <mesh position={[-0.48, 1.62, 0.54]} rotation={[-0.14, 0, 0]}>
        <boxGeometry args={[1.2, 0.14, 0.55]} />
        <meshStandardMaterial color="#171320" metalness={0.36} roughness={0.4} />
      </mesh>
      <mesh position={[-0.67, 1.77, 0.72]}>
        <cylinderGeometry args={[0.055, 0.055, 0.25, 8]} />
        <meshStandardMaterial color="#f344a4" emissive="#f344a4" emissiveIntensity={0.8} />
      </mesh>
      {[-0.22, 0.08, 0.38].map((x, index) => (
        <mesh key={x} position={[x, 1.78, 0.77]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 10]} />
          <meshStandardMaterial color={index === 1 ? '#72efda' : '#ffb655'} emissive={index === 1 ? '#72efda' : '#ffb655'} emissiveIntensity={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[2.35, 0.38, 1.12]} />
        <meshStandardMaterial color="#15141f" metalness={0.5} roughness={0.42} />
      </mesh>
      {isActive && !isMobile && (
        <Html position={[0, 2.55, 0.56]} center>
          <button
            type="button"
            className={`arcade-screen${arcadeStarted ? ' is-started' : ''}`}
            onClick={onArcadeStart}
            aria-label={arcadeStarted ? 'Arcade ready' : 'Start the arcade'}
          >
            <span>{arcadeStarted ? 'PLAYER 1 READY' : 'CREDITS'}</span>
            <strong>{arcadeStarted ? 'CHOOSE A PROJECT' : 'CLICK TO START'}</strong>
          </button>
        </Html>
      )}
      {!isMobile && <pointLight position={[0, 2.55, 0.6]} color="#a94eff" intensity={0.34} distance={3.8} />}
    </group>
  )
}

function ProjectVendingMachine({ selectedProjectId, isMobile, isActive, arcadeStarted, currentPage, pageCount, visibleProjects, onPageChange, onArcadeStart, onProjectSelect, onProjectBack, onHotspotHover }: {
  selectedProjectId: string | null
  isMobile: boolean
  isActive: boolean
  arcadeStarted: boolean
  currentPage: number
  pageCount: number
  visibleProjects: Project[]
  onPageChange: (page: number) => void
  onArcadeStart: () => void
  onProjectSelect: (projectId: string) => void
  onProjectBack: () => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const selectedProject = visibleProjects.find(({ id }) => id === selectedProjectId) ?? null
  const selectedProjectIndex = projectContent.items.findIndex(({ id }) => id === selectedProject?.id)
  const columns = [-1.02, 0, 1.02]
  const rows = [2.68, 1.7, 0.72]

  return (
    <group position={[-8.95, 0, 0.1]}>
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[3.75, 5.6, 1.02]} />
        <meshStandardMaterial color="#202432" metalness={0.62} roughness={0.32} />
      </mesh>
      <mesh position={[0, 2.8, 0.53]}>
        <boxGeometry args={[3.48, 5.32, 0.08]} />
        <meshStandardMaterial color="#10141f" metalness={0.38} roughness={0.45} />
      </mesh>
      <mesh position={[0, 5.29, 0.59]}>
        <boxGeometry args={[3.32, 0.07, 0.04]} />
        <meshBasicMaterial color="#70f1dc" toneMapped={false} />
      </mesh>
      {isActive && (
        <Html position={[0, 5.43, 0.59]} center>
          <span className="project-machine-brand">PROJECTS / DIGITAL BUILDS</span>
        </Html>
      )}
      <mesh position={[0, 4.04, 0.59]}>
        <boxGeometry args={[3.26, 1.85, 0.06]} />
        <meshStandardMaterial color="#080c15" metalness={0.22} roughness={0.4} emissive="#152235" emissiveIntensity={0.3} />
      </mesh>
      {isActive && (
        <Html position={[0, 4.04, 0.64]} center>
          {selectedProject ? (
            <ProjectCard project={selectedProject} index={selectedProjectIndex} total={projectContent.items.length} onBack={onProjectBack} />
          ) : (
            <div className="project-screen-idle" aria-live="polite">
              <span className="screen-overline">MARZAQ / PROJECT ARCHIVE</span>
              <strong>CHOOSE A BOTTLE</strong>
              <span>{projectContent.items.length} PROJECTS · {projectContent.pageSize} PER PAGE</span>
              {pageCount > 1 && (
                <div className="project-page-controls" role="group" aria-label="Project pages">
                  <button type="button" aria-label="Previous project page" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>&larr;</button>
                  <span aria-live="polite">PAGE {currentPage + 1} / {pageCount}</span>
                  <button type="button" aria-label="Next project page" disabled={currentPage >= pageCount - 1} onClick={() => onPageChange(currentPage + 1)}>&rarr;</button>
                </div>
              )}
              {isMobile && (
                <button type="button" className="mobile-arcade-start" onClick={onArcadeStart}>
                  {arcadeStarted ? 'ARCADE READY' : 'START ARCADE'}
                </button>
              )}
            </div>
          )}
        </Html>
      )}
      <mesh position={[0, 1.72, 0.56]}>
        <boxGeometry args={[3.31, 2.98, 0.08]} />
        <meshStandardMaterial color="#080b13" metalness={0.2} roughness={0.46} />
      </mesh>
      {visibleProjects.map((project, index) => {
        const column = index % 3
        const row = Math.floor(index / 3)
        return (
          <ProjectBottle
            key={project.id}
            project={project}
            index={index}
            position={[columns[column], rows[row], 0.68]}
            isMobile={isMobile}
            isActive={isActive}
            onSelect={onProjectSelect}
            onHotspotHover={onHotspotHover}
          />
        )
      })}
      <mesh position={[1.02, 0.72, 0.68]}>
        <boxGeometry args={[0.82, 0.84, 0.08]} />
        <meshStandardMaterial color="#10141b" metalness={0.34} roughness={0.62} />
      </mesh>
      <Html position={[1.02, 0.72, 0.74]} center>
        <span className="reserved-slot">NEXT DROP</span>
      </Html>
      <mesh position={[0, 0.23, 0]} castShadow>
        <boxGeometry args={[3.9, 0.42, 1.18]} />
        <meshStandardMaterial color="#131722" metalness={0.58} roughness={0.37} />
      </mesh>
      <mesh position={[1.24, 0.72, 0.59]}>
        <boxGeometry args={[0.55, 0.3, 0.06]} />
        <meshStandardMaterial color="#070a10" metalness={0.44} roughness={0.28} />
      </mesh>
      <mesh position={[1.24, 1.06, 0.66]}>
        <boxGeometry args={[0.12, 0.12, 0.1]} />
        <meshStandardMaterial color="#76f4df" emissive="#76f4df" emissiveIntensity={1.3} />
      </mesh>
      {!isMobile && <pointLight position={[0, 2.1, 1.2]} color="#47dcca" intensity={0.6} distance={5} />}
    </group>
  )
}

export function ProjectsZone({ selectedProjectId, isMobile, isActive, onProjectSelect, onProjectBack, onHotspotHover }: {
  selectedProjectId: string | null
  isMobile: boolean
  isActive: boolean
  onProjectSelect: (projectId: string) => void
  onProjectBack: () => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const [arcadeStarted, setArcadeStarted] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(projectContent.items.length / projectContent.pageSize))
  const visibleProjects = projectContent.items.slice(currentPage * projectContent.pageSize, (currentPage + 1) * projectContent.pageSize)

  const onPageChange = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(pageCount - 1, page)))
    onProjectBack()
  }

  return (
    <group>
      <ProjectVendingMachine
        selectedProjectId={selectedProjectId}
        isMobile={isMobile}
        isActive={isActive}
        arcadeStarted={arcadeStarted}
        currentPage={currentPage}
        pageCount={pageCount}
        visibleProjects={visibleProjects}
        onPageChange={onPageChange}
        onArcadeStart={() => setArcadeStarted(true)}
        onProjectSelect={onProjectSelect}
        onProjectBack={onProjectBack}
        onHotspotHover={onHotspotHover}
      />
      <ArcadeCabinet isMobile={isMobile} isActive={isActive} arcadeStarted={arcadeStarted} onArcadeStart={() => setArcadeStarted(true)} />
      <mesh position={[-10.7, 0.035, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.6, 3.8]} />
        <meshBasicMaterial color="#15353f" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  )
}