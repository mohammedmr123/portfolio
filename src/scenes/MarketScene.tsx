import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { CanvasTexture, CatmullRomCurve3, Color, DoubleSide, PerspectiveCamera, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import type { Mesh, PointLight } from 'three'
import { CAMERA_POSES, type MarketDestination } from './navigation'
import { ProjectsZone } from '../components/ProjectsZone'
import { AboutMonitor } from '../components/AboutMonitor'
import { ContactZone } from '../components/ContactZone'
import { NewspaperBox } from '../components/NewspaperBox'

function CameraDirector({ activeDestination, isMobile, prefersReducedMotion }: {
  activeDestination: MarketDestination
  isMobile: boolean
  prefersReducedMotion: boolean
}) {
  const { camera } = useThree()
  const lookAtTarget = useRef(new Vector3(0, 1.6, 0))
  const isTransitioning = useRef(false)
  const perspectiveCamera = camera as PerspectiveCamera

  useEffect(() => {
    const pose = CAMERA_POSES[activeDestination]
    const cameraPosition = isMobile ? pose.mobilePosition : pose.position
    const cameraTarget = isMobile ? pose.mobileTarget : pose.target
    const duration = prefersReducedMotion ? 0.45 : 1.35
    let idleTween: gsap.core.Tween | undefined
    const updateCameraAim = () => camera.lookAt(lookAtTarget.current)
    const timeline = gsap.timeline({
      onStart: () => { isTransitioning.current = true },
      onComplete: () => {
        isTransitioning.current = false
        if (activeDestination === 'hub' && !prefersReducedMotion) {
          idleTween = gsap.to(camera.position, {
            x: cameraPosition[0] + 0.12,
            y: cameraPosition[1] + 0.035,
            duration: 3.8,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            onUpdate: updateCameraAim,
          })
        }
      },
    })

    timeline.to(camera.position, {
      x: cameraPosition[0],
      y: cameraPosition[1],
      z: cameraPosition[2],
      duration,
      ease: 'power3.inOut',
      onUpdate: updateCameraAim,
    }, 0)
    timeline.to(lookAtTarget.current, {
      x: cameraTarget[0],
      y: cameraTarget[1],
      z: cameraTarget[2],
      duration,
      ease: 'power3.inOut',
      onUpdate: updateCameraAim,
    }, 0)
    timeline.to(perspectiveCamera, {
      fov: isMobile ? pose.mobileFov : pose.fov,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        perspectiveCamera.updateProjectionMatrix()
        updateCameraAim()
      },
    }, 0)

    return () => {
      timeline.kill()
      idleTween?.kill()
      isTransitioning.current = false
    }
  }, [activeDestination, isMobile, prefersReducedMotion, camera, perspectiveCamera])

  return null
}

function LabelTexture({ text, color, position = [0, 1.38, 0.156], size = [1.72, 0.43] }: {
  text: string
  color: string
  position?: [number, number, number]
  size?: [number, number]
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = 'bold 56px monospace'
      context.shadowColor = color
      context.shadowBlur = 20
      context.fillStyle = color
      context.fillText(text, canvas.width / 2, canvas.height / 2)
    }
    const nextTexture = new CanvasTexture(canvas)
    nextTexture.colorSpace = SRGBColorSpace
    return nextTexture
  }, [color, text])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function MarketSign({ destination, label, color, position, rotation = 0, isMobile, hiddenWhenActive = false, onNavigate, onHotspotHover }: {
  destination: MarketDestination
  label: string
  color: string
  position: [number, number, number]
  rotation?: number
  isMobile: boolean
  hiddenWhenActive?: boolean
  onNavigate: (destination: MarketDestination) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const [hovered, setHovered] = useState(false)
  const signLight = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    if (!signLight.current) return
    const time = clock.elapsedTime + position[0] * 0.37
    const flutter = Math.pow(Math.max(0, Math.sin(time * 4.1)), 8)
    const shimmer = Math.sin(time * 8.3) * 0.035 + Math.sin(time * 2.7) * 0.04
    signLight.current.intensity = (hovered ? 1.1 : 0.35) * (0.9 + shimmer + flutter * 0.12)
  })

  const setHoverState = (nextHovered: boolean) => {
    setHovered(nextHovered)
    onHotspotHover(nextHovered)
  }

  return (
    <group position={position} rotation={[0, rotation, 0]} visible={!hiddenWhenActive}>
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 1.55, 6]} />
        <meshStandardMaterial color="#302536" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.38, 0]} scale={hovered ? [1.08, 1.1, 1] : [1, 1, 1]} castShadow>
        <boxGeometry args={[1.86, 0.56, 0.15]} />
        <meshStandardMaterial color="#171520" metalness={0.42} roughness={0.48} emissive={color} emissiveIntensity={hovered ? 0.95 : 0.06} />
      </mesh>
      <mesh position={[0, 1.38, 0.077]}>
        <planeGeometry args={[1.78, 0.49]} />
        <meshBasicMaterial color="#080a12" side={DoubleSide} />
      </mesh>
      <LabelTexture text={label} color={color} />
      {!isMobile && <pointLight ref={signLight} position={[0, 1.35, 0.35]} color={color} intensity={hovered ? 1.1 : 0.35} distance={hovered ? 4 : 2.5} />}
      <mesh
        position={[0, 1, 0.12]}
        onPointerOver={(event) => { event.stopPropagation(); setHoverState(true) }}
        onPointerOut={(event) => { event.stopPropagation(); setHoverState(false) }}
        onClick={(event) => { event.stopPropagation(); onNavigate(destination) }}
      >
        <boxGeometry args={[2.2, 2.05, 0.04]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

function StringLights({ isMobile }: { isMobile: boolean }) {
  const points = Array.from({ length: 13 }, (_, index) => {
    const x = -3.2 + index * 0.53
    const y = 4.25 - Math.sin((index / 12) * Math.PI) * 0.48
    return new Vector3(x, y, 1.48)
  })
  const wire = new CatmullRomCurve3(points)

  return (
    <group>
      <mesh>
        <tubeGeometry args={[wire, 36, 0.018, 5, false]} />
        <meshStandardMaterial color="#3a3241" roughness={0.7} />
      </mesh>
      {points.filter((_, index) => index % 2 === 0).map((point, index) => (
        <group key={index} position={point.toArray()}>
          <mesh position={[0, -0.11, 0]}>
            <sphereGeometry args={[0.078, 8, 6]} />
            <meshStandardMaterial color={index % 2 ? '#ff8d48' : '#79f6e5'} emissive={index % 2 ? '#ff5b25' : '#20d7d1'} emissiveIntensity={2.4} toneMapped={false} />
          </mesh>
          {!isMobile && index % 3 === 0 && <pointLight position={[0, -0.12, 0]} color={index % 2 ? '#ff814e' : '#48e7df'} intensity={0.5} distance={2.5} />}
        </group>
      ))}
    </group>
  )
}

function Lantern({ position, color, isMobile }: { position: [number, number, number]; color: string; isMobile: boolean }) {
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 2.1 + Math.sin(clock.elapsedTime * 2.4 + position[0]) * 0.12
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <octahedronGeometry args={[0.56, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.2} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.39]}>
        <circleGeometry args={[0.25, 6]} />
        <meshBasicMaterial color="#fff4d2" toneMapped={false} />
      </mesh>
      {!isMobile && <pointLight ref={light} color={color} intensity={2.1} distance={7} decay={2} />}
    </group>
  )
}

function Stool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.63, 0]} castShadow>
        <cylinderGeometry args={[0.39, 0.34, 0.16, 8]} />
        <meshStandardMaterial color="#9a4e37" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((leg) => {
        const angle = (leg / 4) * Math.PI * 2
        return (
          <mesh key={leg} position={[Math.cos(angle) * 0.24, 0.31, Math.sin(angle) * 0.24]} rotation={[0, 0, Math.cos(angle) * 0.12]} castShadow>
            <boxGeometry args={[0.075, 0.62, 0.075]} />
            <meshStandardMaterial color="#603d34" roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

function Steam() {
  const wisps = useRef<Mesh[]>([])
  useFrame(({ clock }) => {
    wisps.current.forEach((wisp, index) => {
      if (!wisp) return
      const phase = (clock.elapsedTime * 0.27 + index / 3) % 1
      wisp.position.y = 2.52 + phase * 1.1
      wisp.position.x = 1.1 + Math.sin(clock.elapsedTime * 1.2 + index) * 0.13
      wisp.scale.setScalar(0.55 + phase * 0.65)
      const material = wisp.material
      if (!Array.isArray(material) && 'opacity' in material) material.opacity = (1 - phase) * 0.22
    })
  })

  return (
    <group>
      {[0, 1, 2].map((index) => (
        <mesh key={index} ref={(mesh) => { if (mesh) wisps.current[index] = mesh }} position={[1.1, 2.6, 0.35]}>
          <sphereGeometry args={[0.17, 8, 6]} />
          <meshBasicMaterial color="#b5e7de" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Stall({ isMobile }: { isMobile: boolean }) {
  const marqueeLight = useRef<PointLight>(null)
  const loadedSignTexture = useLoader(TextureLoader, `${import.meta.env.BASE_URL}assets/stall-sign.svg`)
  const signTexture = useMemo(() => {
    const texture = loadedSignTexture.clone()
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [loadedSignTexture])
  useEffect(() => () => signTexture.dispose(), [signTexture])

  useFrame(({ clock }) => {
    if (!marqueeLight.current) return
    const time = clock.elapsedTime
    const flutter = Math.pow(Math.max(0, Math.sin(time * 3.3)), 12)
    marqueeLight.current.intensity = 1.2 + Math.sin(time * 5.5) * 0.08 + flutter * 0.35
  })

  return (
    <group>
      <mesh position={[0, 0.11, 0.15]} receiveShadow>
        <boxGeometry args={[7.8, 0.22, 4.1]} />
        <meshStandardMaterial color="#211c28" roughness={0.82} />
      </mesh>
      {[-3.15, 3.15].map((x) => [-1.2, 1.2].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 1.77, z]} castShadow>
          <boxGeometry args={[0.17, 3.32, 0.17]} />
          <meshStandardMaterial color="#553c3a" roughness={0.75} />
        </mesh>
      )))}
      <mesh position={[0, 3.43, 0.15]} castShadow>
        <boxGeometry args={[7.25, 0.32, 3.15]} />
        <meshStandardMaterial color="#5a233f" roughness={0.55} metalness={0.14} emissive="#a21a68" emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[0, 3.08, 1.57]} castShadow>
        <boxGeometry args={[7.05, 0.74, 0.22]} />
        <meshStandardMaterial color="#3b202f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.08, 1.69]}>
        <planeGeometry args={[6.55, 0.49]} />
        <meshBasicMaterial map={signTexture} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.45, 0.68]} castShadow>
        <boxGeometry args={[6.48, 1.12, 1.15]} />
        <meshStandardMaterial color="#663e32" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.04, 0.68]} castShadow>
        <boxGeometry args={[6.65, 0.13, 1.25]} />
        <meshStandardMaterial color="#9e6741" roughness={0.54} />
      </mesh>
      <mesh position={[-2.26, 2.15, 0.02]}>
        <boxGeometry args={[1.1, 0.026, 1.52]} />
        <meshBasicMaterial color="#72f5df" toneMapped={false} />
      </mesh>
      <mesh position={[2.26, 2.15, 0.02]}>
        <boxGeometry args={[1.1, 0.026, 1.52]} />
        <meshBasicMaterial color="#ff66bc" toneMapped={false} />
      </mesh>
      <Lantern position={[-2.72, 3, 1.38]} color="#ff55b7" isMobile={isMobile} />
      <Lantern position={[2.72, 3, 1.38]} color="#55e9ee" isMobile={isMobile} />
      <StringLights isMobile={isMobile} />
      <Stool position={[-1.65, 0, 2.05]} />
      <Stool position={[0, 0, 2.2]} />
      <Stool position={[1.65, 0, 2.05]} />
      <mesh position={[1.1, 2.38, 0.35]}>
        <cylinderGeometry args={[0.23, 0.3, 0.3, 8]} />
        <meshStandardMaterial color="#322b35" metalness={0.4} roughness={0.5} />
      </mesh>
      <Steam />
      {!isMobile && <pointLight position={[0, 2.8, 0]} color="#ff5bb9" intensity={1.4} distance={8} />}
      {!isMobile && <pointLight ref={marqueeLight} position={[0, 3.1, 2.2]} color="#ff62bb" intensity={1.2} distance={5.5} />}
    </group>
  )
}

function WetGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#080c14" roughness={0.24} metalness={0.78} />
      </mesh>
      <gridHelper args={[42, 42, '#173b49', '#15212f']} position={[0, 0, 0]} />
      {[
        { x: -3.8, z: 2.2, sx: 1.8, sz: 0.52, color: '#b92c81' },
        { x: 3.25, z: 2.4, sx: 1.5, sz: 0.42, color: '#168eaa' },
        { x: -1.8, z: -2.8, sx: 2.5, sz: 0.3, color: '#3b3b95' },
        { x: 4.5, z: -0.3, sx: 0.72, sz: 0.28, color: '#a63083' },
      ].map((puddle, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[puddle.x, 0.012 + index * 0.001, puddle.z]} scale={[puddle.sx, puddle.sz, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color={puddle.color} transparent opacity={0.25} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export function MarketScene({ activeDestination, isMobile, prefersReducedMotion, selectedProjectId, contactSuccessCount, onOpenContactForm, onOpenArticle, onNavigate, onProjectSelect, onProjectBack, onHotspotHover }: {
  activeDestination: MarketDestination
  isMobile: boolean
  prefersReducedMotion: boolean
  selectedProjectId: string | null
  contactSuccessCount: number
  onOpenContactForm: (trigger: HTMLButtonElement) => void
  onOpenArticle: (articleId: string, trigger: HTMLButtonElement) => void
  onNavigate: (destination: MarketDestination) => void
  onProjectSelect: (projectId: string) => void
  onProjectBack: () => void
  onHotspotHover: (hovered: boolean) => void
}) {
  return (
    <>
      <CameraDirector activeDestination={activeDestination} isMobile={isMobile} prefersReducedMotion={prefersReducedMotion} />
      <ambientLight intensity={0.62} color="#8b9bc4" />
      <directionalLight position={[-4, 8, 6]} intensity={1.15} color="#c0c9ff" castShadow={!isMobile} shadow-mapSize={[1024, 1024]} />
      {!isMobile && <pointLight position={[-6, 3, -1]} color="#9a42f2" intensity={2.2} distance={14} />}
      {!isMobile && <pointLight position={[6, 2.5, 1]} color="#1f9eae" intensity={1.7} distance={13} />}
      <WetGround />
      <Stall isMobile={isMobile} />
      <ProjectsZone
        selectedProjectId={selectedProjectId}
        isMobile={isMobile}
        isActive={activeDestination === 'projects'}
        onProjectSelect={onProjectSelect}
        onProjectBack={onProjectBack}
        onHotspotHover={onHotspotHover}
      />
      <AboutMonitor
        isMobile={isMobile}
        isActive={activeDestination === 'about'}
        onNavigate={onNavigate}
        onHotspotHover={onHotspotHover}
      />
      <ContactZone
        isActive={activeDestination === 'contact'}
        isMobile={isMobile}
        prefersReducedMotion={prefersReducedMotion}
        successCount={contactSuccessCount}
        onOpenForm={onOpenContactForm}
        onNavigate={onNavigate}
        onHotspotHover={onHotspotHover}
      />
      <NewspaperBox
        isActive={activeDestination === 'articles'}
        isMobile={isMobile}
        prefersReducedMotion={prefersReducedMotion}
        onOpenArticle={onOpenArticle}
        onNavigate={onNavigate}
        onHotspotHover={onHotspotHover}
      />
      <MarketSign destination="projects" label="PROJECTS" color="#7df4df" position={[-5.3, 0, 0.4]} rotation={0.08} isMobile={isMobile} onNavigate={onNavigate} onHotspotHover={onHotspotHover} />
      <MarketSign destination="about" label="ABOUT ME" color="#ff75c5" position={[5.2, 0, -0.15]} rotation={-0.08} isMobile={isMobile} onNavigate={onNavigate} onHotspotHover={onHotspotHover} />
      <MarketSign destination="articles" label="ARTICLES" color="#bd88ff" position={[-5.2, 0, -3.5]} rotation={0.12} isMobile={isMobile} hiddenWhenActive={activeDestination === 'articles'} onNavigate={onNavigate} onHotspotHover={onHotspotHover} />
      <MarketSign destination="contact" label="CONTACT" color="#ffbd60" position={[5.3, 0, -3.15]} rotation={-0.12} isMobile={isMobile} hiddenWhenActive={activeDestination === 'contact'} onNavigate={onNavigate} onHotspotHover={onHotspotHover} />
      <mesh position={[0, 0.25, -5.5]}>
        <boxGeometry args={[22, 0.5, 0.6]} />
        <meshStandardMaterial color="#151320" roughness={0.9} />
      </mesh>
      <color attach="background" args={[new Color('#080a12')]} />
    </>
  )
}