import { useSearchParams } from 'react-router-dom'
import '../styles/SearchBars.css'

export default function SearchBars() {
  const [searchParams, setSearchParams] = useSearchParams()

  function update(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  return (
    <div className="search-bars">
      <div className="search-bar-wrap">
        <i className="fa-solid fa-gamepad" />
        <input
          type="text"
          placeholder="Search by game…"
          value={searchParams.get('gameSearch') || ''}
          onChange={e => update('gameSearch', e.target.value)}
        />
      </div>
      <div className="search-bar-wrap">
        <i className="fa-solid fa-car" />
        <input
          type="text"
          placeholder="Search by car…"
          value={searchParams.get('car') || ''}
          onChange={e => update('car', e.target.value)}
        />
      </div>
      <div className="search-bar-wrap">
        <i className="fa-solid fa-map-location-dot" />
        <input
          type="text"
          placeholder="Search by track…"
          value={searchParams.get('track') || ''}
          onChange={e => update('track', e.target.value)}
        />
      </div>
    </div>
  )
}
