export function PortalBackground() {
  return (
    <div className="portal-line-bg" aria-hidden="true">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <line className="portal-line" x1="0" y1="200" x2="1200" y2="350" />
        <line className="portal-line" x1="0" y1="400" x2="1200" y2="500" />
        <line className="portal-line" x1="0" y1="600" x2="1200" y2="650" />
        <line className="portal-line" x1="200" y1="0" x2="400" y2="800" />
        <line className="portal-line" x1="800" y1="0" x2="900" y2="800" />
        <circle
          className="portal-orbit-ring"
          cx="600"
          cy="400"
          r="180"
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="1"
          opacity="0.08"
          style={{ transformOrigin: '600px 400px' }}
        />
      </svg>
    </div>
  )
}
