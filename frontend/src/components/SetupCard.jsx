import { Link } from 'react-router-dom'
import CategoryBadge from './CategoryBadge'
import '../styles/SetupCard.css'
import '../styles/RatingButtons.css'

export default function SetupCard({ setup }) {
  const date = new Date(setup.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const ratings = setup.ratings || []
  const ups   = ratings.filter(r => r.value === 1).length
  const downs = ratings.filter(r => r.value === -1).length

  return (
    <Link to={`/setup/${setup.id}`} className="setup-card">
      <div className="setup-card-header">
        <div>
          <div className="setup-card-title">{setup.title}</div>
          <div className="setup-card-car">
            <i className="fa-solid fa-car" /> {setup.car_name}
          </div>
        </div>
        <CategoryBadge name={setup.categories?.name} />
      </div>

      <div className="setup-card-meta">
        <span className="setup-card-game">
          <i className="fa-solid fa-gamepad" /> {setup.games?.name}
        </span>
        <span className="setup-card-control">
          <i className={setup.control_type === 'wheel' ? 'fa-solid fa-steering-wheel' : 'fa-solid fa-gamepad'} />
          {setup.control_type === 'wheel' ? 'Steering Wheel' : 'Remote / Controller'}
        </span>
        {setup.track_name && (
          <span><i className="fa-solid fa-map-location-dot" /> {setup.track_name}</span>
        )}
      </div>

      <div className="setup-card-footer">
        <span>{setup.author_name ? `By ${setup.author_name}` : 'Anonymous'}</span>
        <div className="card-rating">
          {(ups > 0 || downs > 0) ? (
            <>
              <span className="card-rating-up"><i className="fa-solid fa-thumbs-up" /> {ups}</span>
              <span className="card-rating-down"><i className="fa-solid fa-thumbs-down" /> {downs}</span>
            </>
          ) : (
            <span style={{ color: 'var(--color-border)' }}>No ratings</span>
          )}
        </div>
        <span>{date}</span>
      </div>
    </Link>
  )
}
