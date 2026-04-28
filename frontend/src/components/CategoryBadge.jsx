const COLORS = {
  drift:       '#f97316',
  street:      '#3b82f6',
  rally:       '#22c55e',
  grip:        '#a855f7',
  drag:        '#ef4444',
  'time attack': '#eab308',
  'off-road':  '#84cc16',
}

export default function CategoryBadge({ name }) {
  if (!name) return null
  const color = COLORS[name.toLowerCase()] || '#a0a0b0'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
    }}>
      {name}
    </span>
  )
}
