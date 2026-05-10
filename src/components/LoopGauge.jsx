export default function LoopGauge({ value, min, max, label, unit, size = 76 }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--dim)' }}>{label}</div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="4" fill="none" />
          <circle cx={cx} cy={cy} r={r} stroke="var(--gold)" strokeWidth="4" fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 17, color: 'var(--bright)', lineHeight: 1 }}>{value.toFixed(2)}</div>
          <div style={{ fontSize: 8, color: 'var(--dim)' }}>{unit}</div>
        </div>
      </div>
    </div>
  )
}
