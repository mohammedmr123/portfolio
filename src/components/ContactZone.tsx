import { Html } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, PointLight } from 'three'
import contactContent from '../data/contact.json'
import profile from '../data/profile.json'
import type { MarketDestination } from '../scenes/navigation'

type MenuLink = { id: string; label: string; value: string; url: string }

function getSocialLink(id: string, label: string): MenuLink | null {
  const social = profile.socials.find((entry) => entry.id === id)
  if (!social) return null
  const value = social.url.startsWith('mailto:') ? social.url.slice(7) : social.url.replace(/^https?:\/\//, '')
  return { id, label, value, url: social.url }
}

const menuLinks = [
  getSocialLink('email', 'EMAIL'),
  { id: 'phone', label: 'PHONE', value: contactContent.phone.display, url: contactContent.phone.url },
  getSocialLink('linkedin', 'LINKEDIN'),
  getSocialLink('github', 'GITHUB'),
].filter((entry): entry is MenuLink => entry !== null)

export function ContactZone({ isActive, isMobile, prefersReducedMotion, successCount, onOpenForm, onNavigate, onHotspotHover }: {
  isActive: boolean
  isMobile: boolean
  prefersReducedMotion: boolean
  successCount: number
  onOpenForm: (trigger: HTMLButtonElement) => void
  onNavigate: (destination: MarketDestination) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const signLight = useRef<PointLight>(null)
  const bell = useRef<Group>(null)
  const receipt = useRef<Mesh>(null)
  const printedReceipt = useRef(false)
  const animationStartedAt = useRef(-1)
  const lastSuccessCount = useRef(successCount)

  useFrame(({ clock }) => {
    if (successCount !== lastSuccessCount.current) {
      lastSuccessCount.current = successCount
      printedReceipt.current = true
      animationStartedAt.current = clock.elapsedTime
    }

    if (signLight.current) {
      signLight.current.intensity = prefersReducedMotion
        ? 1.15
        : 1.1 + Math.sin(clock.elapsedTime * 7.1) * 0.08
    }

    if (bell.current) {
      const elapsed = animationStartedAt.current < 0 ? -1 : clock.elapsedTime - animationStartedAt.current
      bell.current.rotation.z = !prefersReducedMotion && elapsed >= 0 && elapsed < 0.8
        ? Math.sin(elapsed * 42) * Math.exp(-elapsed * 4.2) * 0.26
        : 0
    }

    if (receipt.current) {
      const elapsed = animationStartedAt.current < 0 ? -1 : clock.elapsedTime - animationStartedAt.current
      const progress = prefersReducedMotion ? 1 : Math.max(0, Math.min(1, elapsed / 0.75))
      receipt.current.visible = printedReceipt.current
      receipt.current.scale.y = Math.max(0.015, progress)
      receipt.current.position.y = 2.18 + progress * 0.3
    }
  })

  return (
    <group position={[5.3, 0, -4.1]}>
      <mesh position={[0, 0.92, 0.18]} castShadow receiveShadow>
        <boxGeometry args={[5.25, 1.45, 1.4]} />
        <meshStandardMaterial color="#3b2830" roughness={0.74} />
      </mesh>
      <mesh position={[0, 1.68, 0.2]} castShadow>
        <boxGeometry args={[5.55, 0.16, 1.62]} />
        <meshStandardMaterial color="#926043" metalness={0.22} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.72, 1.015]}>
        <boxGeometry args={[5.25, 0.045, 0.035]} />
        <meshBasicMaterial color="#ffad65" toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.03, 0.58]} castShadow>
        <boxGeometry args={[2.68, 0.72, 0.2]} />
        <meshStandardMaterial color="#211925" metalness={0.38} roughness={0.43} emissive="#a52d76" emissiveIntensity={0.24} />
      </mesh>
      {isActive && (
        <Html position={[0, 3.04, 0.705]} center>
          <div className="order-up-sign" aria-label={contactContent.sign}>{contactContent.sign}</div>
        </Html>
      )}

      <mesh position={isMobile ? [-0.4, 2.15, 0.53] : [-0.4, 2.1, 0.53]} castShadow>
        <boxGeometry args={[2.22, 2.08, 0.18]} />
        <meshStandardMaterial color="#181b25" metalness={0.44} roughness={0.39} emissive="#142c39" emissiveIntensity={0.32} />
      </mesh>
      {isActive && (
        <Html position={isMobile ? [-0.4, 2.15, 0.66] : [-0.4, 2.1, 0.66]} center>
          <nav className="contact-menu-board" aria-label="Contact links">
            <strong>{contactContent.menuTitle}</strong>
            {menuLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span>{link.label}</span><span>{link.value}</span>
              </a>
            ))}
            <small>{contactContent.menuNote}</small>
          </nav>
        </Html>
      )}

      <group ref={bell} position={[-1.76, 1.88, 0.88]}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.08, 8]} />
          <meshStandardMaterial color="#c8a05d" metalness={0.82} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.22, 0.2, 8]} />
          <meshStandardMaterial color="#ddb767" metalness={0.78} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.065, 8, 6]} />
          <meshStandardMaterial color="#efd18b" metalness={0.72} roughness={0.2} />
        </mesh>
      </group>
      <mesh position={[1.58, 1.94, 0.82]} castShadow>
        <boxGeometry args={[0.78, 0.5, 0.64]} />
        <meshStandardMaterial color="#2a3037" metalness={0.62} roughness={0.34} />
      </mesh>
      <mesh position={[1.58, 2.205, 0.82]}>
        <boxGeometry args={[0.55, 0.04, 0.35]} />
        <meshStandardMaterial color="#121820" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh ref={receipt} position={[1.58, 2.18, 0.82]} visible={false}>
        <boxGeometry args={[0.5, 0.62, 0.025]} />
        <meshStandardMaterial color="#f2e8cb" roughness={0.92} />
      </mesh>
      {successCount > 0 && (
        <Html position={[1.58, 2.58, 0.86]} center>
          <span className="printer-receipt-text" aria-label={contactContent.ticket.success}>ORDER RECEIVED</span>
        </Html>
      )}

      {isActive && (
        <Html position={[-0.4, 1.25, 1.08]} center>
          <div className="contact-counter-controls">
            <span className="contact-zone-eyebrow">{contactContent.eyebrow}</span>
            <button
              className="contact-open-order"
              type="button"
              onClick={(event) => onOpenForm(event.currentTarget)}
              onFocus={() => onHotspotHover(true)}
              onBlur={() => onHotspotHover(false)}
              onMouseEnter={() => onHotspotHover(true)}
              onMouseLeave={() => onHotspotHover(false)}
            >
              {contactContent.openForm}
            </button>
            <button className="contact-back-hub" type="button" onClick={() => onNavigate('hub')}>
              &larr; {contactContent.backToHub}
            </button>
          </div>
        </Html>
      )}
      {!isMobile && (
        <pointLight ref={signLight} position={[0, 3, 1.05]} color="#ff54bd" intensity={1.15} distance={7} />
      )}
      {!isMobile && <pointLight position={[2.65, 2.4, 1]} color="#56e9ed" intensity={0.9} distance={5} />}
    </group>
  )
}