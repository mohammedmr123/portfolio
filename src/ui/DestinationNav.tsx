import { MARKET_DESTINATIONS, type MarketDestination } from '../scenes/navigation'

export function DestinationNav({ activeDestination, onNavigate }: {
  activeDestination: MarketDestination
  onNavigate: (destination: MarketDestination) => void
}) {
  return (
    <nav className="destination-nav" aria-label="Night market destinations">
      {MARKET_DESTINATIONS.map(({ id, label }, index) => (
        <button
          key={id}
          type="button"
          aria-pressed={activeDestination === id}
          onClick={() => onNavigate(id)}
        >
          <span className="destination-index">0{index + 1}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}