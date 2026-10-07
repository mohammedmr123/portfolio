import { Html } from '@react-three/drei'
import type { MarketDestination } from '../scenes/navigation'
import { AboutMonitorPanel } from '../ui/AboutMonitorPanel'

export function AboutMonitor({ isMobile, isActive, onNavigate, onHotspotHover }: {
  isMobile: boolean
  isActive: boolean
  onNavigate: (destination: MarketDestination) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  return (
    <group position={[8.2, 0, -1.65]}>
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.65, 3.5, 0.88]} />
        <meshStandardMaterial color="#262330" metalness={0.52} roughness={0.38} />
      </mesh>
      <mesh position={[0, 2.15, 0.47]}>
        <boxGeometry args={[4.34, 3.06, 0.08]} />
        <meshStandardMaterial color="#0b111a" metalness={0.24} roughness={0.28} emissive="#12333d" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 2.15, 0.53]}>
        <planeGeometry args={[4.13, 2.82]} />
        <meshBasicMaterial color="#09131a" toneMapped={false} />
      </mesh>
      {isActive && (
        <Html position={[0, 2.15, 0.59]} center>
          <AboutMonitorPanel isMobile={isMobile} onNavigate={onNavigate} onHotspotHover={onHotspotHover} />
        </Html>
      )}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[2.35, 0.4, 1.25]} />
        <meshStandardMaterial color="#342f38" metalness={0.58} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.91, -0.08]} castShadow>
        <boxGeometry args={[1.25, 1.18, 0.46]} />
        <meshStandardMaterial color="#312d36" metalness={0.56} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.91, 0.17]}>
        <boxGeometry args={[0.91, 0.72, 0.045]} />
        <meshBasicMaterial color="#171820" />
      </mesh>
      <mesh position={[0, 0.04, 0.2]}>
        <boxGeometry args={[4.9, 0.08, 1.5]} />
        <meshStandardMaterial color="#241e29" metalness={0.46} roughness={0.42} emissive="#7c2a72" emissiveIntensity={0.12} />
      </mesh>
      {[-1.82, -1.56, -1.3, 1.3, 1.56, 1.82].map((x) => (
        <mesh key={x} position={[x, 1.05, 0.49]}>
          <boxGeometry args={[0.08, 0.86, 0.035]} />
          <meshBasicMaterial color="#090b11" />
        </mesh>
      ))}
      <mesh position={[1.93, 0.54, 0.49]}>
        <cylinderGeometry args={[0.13, 0.13, 0.09, 12]} />
        <meshStandardMaterial color="#c068aa" emissive="#a74591" emissiveIntensity={0.35} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[2.05, 1.9, 0.47]}>
        <circleGeometry args={[0.055, 12]} />
        <meshBasicMaterial color="#7ef4db" toneMapped={false} />
      </mesh>
      {!isMobile && <pointLight position={[0, 2.1, 0.8]} color="#53dacc" intensity={0.9} distance={6} />}
      {!isMobile && <pointLight position={[0, 0.45, 0.6]} color="#c84cba" intensity={0.55} distance={4} />}
    </group>
  )
}