export default function ArcGauge({ value, min, max, color, size = 72 }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const cx = size / 2, cy = size * 0.55, r = size * 0.36
  const startAng = -210, endAng = 30
  const fillEnd = startAng + (endAng - startAng) * pct

  function pt(ang) {
    const a = ang * Math.PI / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  function arc(a1, a2) {
    const [x1, y1] = pt(a1), [x2, y2] = pt(a2)
    const large = a2 - a1 > 180 ? 1 : 0
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`
  }
  const h = Math.round(size * 0.68)
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ display: 'block' }}>
      <path d={arc(startAng, endAng)} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {pct > 0 && <path d={arc(startAng, fillEnd)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />}
    </svg>
  )
}
