import SetupCard from './SetupCard'
import '../styles/SetupCarousel.css'

export default function SetupCarousel({ setups, topAuthors }) {
  if (!setups.length) return null

  // 4 seconds per card keeps a comfortable reading pace
  const duration = `${Math.max(setups.length * 4, 20)}s`

  return (
    <div className="carousel-wrapper">
      <div className="carousel-fade carousel-fade-left" />
      <div className="carousel-fade carousel-fade-right" />
      <div className="carousel-track" style={{ '--carousel-duration': duration }}>
        {setups.map(s => (
          <div key={s.id} className="carousel-item">
            <SetupCard setup={s} topAuthors={topAuthors} />
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {setups.map(s => (
          <div key={`dup-${s.id}`} className="carousel-item" aria-hidden="true">
            <SetupCard setup={s} topAuthors={topAuthors} />
          </div>
        ))}
      </div>
    </div>
  )
}
