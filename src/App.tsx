import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { useReducedMotion } from './hooks/useReducedMotion'
import { ArticleReader } from './ui/ArticleReader'
import { MARKET_DESTINATIONS, type MarketDestination } from './scenes/navigation'
import { MarketScene } from './scenes/MarketScene'
import { ContactOrderForm } from './ui/ContactOrderForm'
import { DestinationNav } from './ui/DestinationNav'
import { LoadingScreen } from './ui/LoadingScreen'
import { PortfolioHUD } from './ui/PortfolioHUD'
import './App.css'

function App() {
  const [sceneReady, setSceneReady] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)
  const [activeDestination, setActiveDestination] = useState<MarketDestination>('hub')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [hotspotHovered, setHotspotHovered] = useState(false)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [contactSuccessCount, setContactSuccessCount] = useState(0)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const contactTriggerRef = useRef<HTMLButtonElement | null>(null)
  const articleTriggerRef = useRef<HTMLButtonElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const ambientAudio = useAmbientAudio()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px)')
    const updateDeviceMode = () => setIsMobile(mediaQuery.matches)
    updateDeviceMode()
    mediaQuery.addEventListener('change', updateDeviceMode)
    return () => mediaQuery.removeEventListener('change', updateDeviceMode)
  }, [])

  const navigateTo = (destination: MarketDestination) => {
    setActiveDestination(destination)
    if (destination !== 'projects') setSelectedProjectId(null)
    if (destination !== 'contact') setContactFormOpen(false)
    if (destination !== 'articles') setSelectedArticleId(null)
  }

  const openContactForm = (trigger: HTMLButtonElement) => {
    contactTriggerRef.current = trigger
    setContactFormOpen(true)
  }

  const closeContactForm = useCallback(() => {
    setContactFormOpen(false)
    window.requestAnimationFrame(() => contactTriggerRef.current?.focus())
  }, [])

  const handleContactOrderSent = () => {
    setContactSuccessCount((count) => count + 1)
    if (!prefersReducedMotion) void ambientAudio.playBell()
  }

  const openArticle = (articleId: string, trigger: HTMLButtonElement) => {
    articleTriggerRef.current = trigger
    setSelectedArticleId(articleId)
  }

  const closeArticle = useCallback(() => {
    setSelectedArticleId(null)
  }, [])

  return (
    <main className="portfolio-shell">
      <Canvas
        camera={{ position: isMobile ? [0, 5.2, 13] : [0, 5.2, 12], fov: isMobile ? 74 : 39 }}
        dpr={isMobile ? 1 : [1, 1.6]}
        shadows={isMobile ? false : 'basic'}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
        style={{ cursor: hotspotHovered ? 'pointer' : 'auto' }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = ACESFilmicToneMapping
          camera.lookAt(0, 1.6, 0)
          setSceneReady(true)
        }}
      >
        <color attach="background" args={['#080a12']} />
        <fog attach="fog" args={['#080a12', 13, 34]} />
        <MarketScene
          activeDestination={activeDestination}
          isMobile={isMobile}
          prefersReducedMotion={prefersReducedMotion}
          selectedProjectId={selectedProjectId}
          contactSuccessCount={contactSuccessCount}
          onOpenContactForm={openContactForm}
          onOpenArticle={openArticle}
          onNavigate={navigateTo}
          onProjectSelect={setSelectedProjectId}
          onProjectBack={() => setSelectedProjectId(null)}
          onHotspotHover={setHotspotHovered}
        />
        {!isMobile && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur luminanceThreshold={0.76} luminanceSmoothing={0.22} intensity={1.15} />
            <Vignette eskil={false} offset={0.16} darkness={0.58} />
          </EffectComposer>
        )}
      </Canvas>

      <header className="brand-lockup" aria-label="Mohammed Marzaq portfolio">
        <span className="brand-mark" aria-hidden="true">M</span>
        <span className="brand-name">MOHAMMED MARZAQ</span>
        <span className="brand-role">UNITY DEVELOPER <i /> FULL STACK</span>
      </header>

      <div className="scene-caption" aria-hidden="true">
        <span className="caption-dot" /> NIGHT MARKET / DISTRICT 01
      </div>

      <div className="phase-indicator" aria-hidden="true">
        <span>{String(MARKET_DESTINATIONS.findIndex(({ id }) => id === activeDestination) + 1).padStart(2, '0')}</span>
        <span className="phase-rule" />
        <span>{MARKET_DESTINATIONS.find(({ id }) => id === activeDestination)?.label}</span>
      </div>

      <DestinationNav activeDestination={activeDestination} onNavigate={navigateTo} />
      <PortfolioHUD
        audioEnabled={ambientAudio.enabled}
        audioSupported={ambientAudio.supported}
        onToggleAudio={ambientAudio.toggle}
      />
      <LoadingScreen sceneReady={sceneReady} />
      {contactFormOpen && activeDestination === 'contact' && (
        <ContactOrderForm onClose={closeContactForm} onOrderSent={handleContactOrderSent} />
      )}
      {selectedArticleId && activeDestination === 'articles' && (
        <ArticleReader articleId={selectedArticleId} onClose={closeArticle} onSelectArticle={setSelectedArticleId} />
      )}
    </main>
  )
}

export default App
