export function PortfolioHUD({ audioEnabled, audioSupported, onToggleAudio }: {
  audioEnabled: boolean
  audioSupported: boolean
  onToggleAudio: () => void
}) {
  return (
    <nav className="portfolio-hud" aria-label="Portfolio controls">
      <button
        type="button"
        className={`hud-audio-button${audioEnabled ? ' is-enabled' : ''}`}
        aria-pressed={audioEnabled}
        aria-label={audioSupported ? `${audioEnabled ? 'Mute' : 'Unmute'} ambient audio` : 'Ambient audio is unavailable'}
        title={audioSupported ? `${audioEnabled ? 'Mute' : 'Unmute'} ambient audio` : 'Ambient audio is unavailable'}
        disabled={!audioSupported}
        onClick={onToggleAudio}
      >
        <span className={`hud-speaker${audioEnabled ? ' is-playing' : ''}`} aria-hidden="true"><i /></span>
        <span>{audioEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
      </button>
      <a className="hud-simple-link" href={`${import.meta.env.BASE_URL}simple.html`} aria-label="Open simple CV and projects page">
        <span className="hud-cv-mark" aria-hidden="true">CV</span>
        <span>Simple version</span>
      </a>
    </nav>
  )
}