import { Html } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight } from 'three'
import articleContent from '../data/articles.json'
import type { MarketDestination } from '../scenes/navigation'

export type PortfolioArticle = (typeof articleContent.items)[number]

export function NewspaperBox({ isActive, isMobile, prefersReducedMotion, onOpenArticle, onNavigate, onHotspotHover }: {
  isActive: boolean
  isMobile: boolean
  prefersReducedMotion: boolean
  onOpenArticle: (articleId: string, trigger: HTMLButtonElement) => void
  onNavigate: (destination: MarketDestination) => void
  onHotspotHover: (hovered: boolean) => void
}) {
  const mastheadLight = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    if (!mastheadLight.current || prefersReducedMotion) return
    const flicker = Math.pow(Math.max(0, Math.sin(clock.elapsedTime * 7.3)), 14)
    mastheadLight.current.intensity = 1.05 + Math.sin(clock.elapsedTime * 4.7) * 0.08 + flicker * 0.34
  })

  return (
    <group position={[-5.2, 0, -3.5]}>
      <mesh position={[0, 1.62, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 3.12, 0.82]} />
        <meshStandardMaterial color="#292b35" metalness={0.58} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.62, 0.51]}>
        <boxGeometry args={[3.87, 2.82, 0.09]} />
        <meshStandardMaterial color="#0c1720" metalness={0.25} roughness={0.3} emissive="#143040" emissiveIntensity={0.38} />
      </mesh>
      <mesh position={[0, 0.18, 0.02]} castShadow>
        <boxGeometry args={[4.65, 0.34, 1.25]} />
        <meshStandardMaterial color="#20222c" metalness={0.58} roughness={0.36} />
      </mesh>
      <mesh position={[-1.73, 3.34, 0.25]} castShadow>
        <boxGeometry args={[0.2, 0.52, 0.2]} />
        <meshStandardMaterial color="#512a52" emissive="#d34ac7" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.73, 3.34, 0.25]} castShadow>
        <boxGeometry args={[0.2, 0.52, 0.2]} />
        <meshStandardMaterial color="#512a52" emissive="#d34ac7" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 3.34, 0.24]} castShadow>
        <boxGeometry args={[3.56, 0.72, 0.24]} />
        <meshStandardMaterial color="#211724" metalness={0.4} roughness={0.38} emissive="#8b2f88" emissiveIntensity={0.25} />
      </mesh>
      {isActive && (
        <Html position={[0, 3.34, 0.4]} center>
          <div className="newspaper-masthead">{articleContent.masthead}</div>
        </Html>
      )}
      {(isMobile ? [-0.82, -0.27, 0.27, 0.82] : [-1.33, -0.44, 0.44, 1.33]).map((x, index) => {
        const article = articleContent.items[index]
        return (
          <group key={article.id} position={[x, 1.72, 0.57]}>
            <mesh position={[0, 0, -0.09]} castShadow>
              <boxGeometry args={[0.76, 1.16, 0.07]} />
              <meshStandardMaterial color="#e4d6b9" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.46, -0.045]}>
              <boxGeometry args={[0.68, 0.045, 0.018]} />
              <meshBasicMaterial color={index === 0 ? '#d44c9a' : '#52c8c1'} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.43, -0.045]}>
              <boxGeometry args={[0.52, 0.025, 0.018]} />
              <meshBasicMaterial color="#60584b" />
            </mesh>
            {isActive && (
              <Html position={[0, 0, 0.035]} center>
                <button
                  className={`newspaper-cover${article.status === 'published' ? ' is-published' : ' is-coming-soon'}`}
                  type="button"
                  aria-label={article.status === 'published' ? `Read satire: ${article.title}` : `Newspaper ${index + 1}: coming soon`}
                  onClick={(event) => onOpenArticle(article.id, event.currentTarget)}
                  onFocus={() => onHotspotHover(true)}
                  onBlur={() => onHotspotHover(false)}
                  onPointerEnter={() => onHotspotHover(true)}
                  onPointerLeave={() => onHotspotHover(false)}
                >
                  <small>ISSUE 0{index + 1}</small>
                  {article.status === 'published' ? (
                    <>
                      <strong>{article.title}</strong>
                      <span className="newspaper-cover-badge">{article.badge}</span>
                    </>
                  ) : (
                    <>
                      <strong>THE NEXT EDITION</strong>
                      <span className="newspaper-cover-stamp">COMING SOON</span>
                    </>
                  )}
                </button>
              </Html>
            )}
          </group>
        )
      })}
      {isActive && (
        <Html position={[0, 0.68, 0.88]} center>
          <div className="newspaper-box-controls">
            <span>{articleContent.boxPrompt}</span>
            <button type="button" onClick={() => onNavigate('hub')}>&larr; {articleContent.backToHub}</button>
          </div>
        </Html>
      )}
      {!isMobile && (
        <pointLight ref={mastheadLight} position={[0, 3.34, 0.95]} color="#e24ac8" intensity={1.1} distance={7} />
      )}
      {!isMobile && <pointLight position={[0, 1.7, 0.9]} color="#3bd8da" intensity={0.6} distance={4} />}
    </group>
  )
}
