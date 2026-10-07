import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

export function LoadingScreen({ sceneReady }: { sceneReady: boolean }) {
  const { progress, total, loaded, errors } = useProgress()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const settled = total > 0 && loaded + errors.length >= total
  const percentage = Math.round(progress)

  useEffect(() => {
    if (!sceneReady || !settled) return
    const fadeTimer = window.setTimeout(() => setFading(true), 450)
    const hideTimer = window.setTimeout(() => setVisible(false), 1250)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [sceneReady, settled])

  if (!visible) return null

  return (
    <div className={`loading-screen${fading ? ' is-fading' : ''}`} role="status" aria-live="polite" aria-label={`Cooking your noodles, ${percentage}%`}>
      <div className="loading-stamp" aria-hidden="true">
        <span className="stamp-steam stamp-steam-one" />
        <span className="stamp-steam stamp-steam-two" />
        <span className="stamp-bowl">〰</span>
        <span className="stamp-chopstick stamp-chopstick-one" />
        <span className="stamp-chopstick stamp-chopstick-two" />
      </div>
      <p className="loading-kicker">MARZAQ NIGHT MARKET</p>
      <h1>Cooking your<br /><span>noodles...</span></h1>
      <div className="loading-progress" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="loading-percent"><span>ASSET LOAD</span><strong>{String(percentage).padStart(2, '0')}%</strong></p>
    </div>
  )
}