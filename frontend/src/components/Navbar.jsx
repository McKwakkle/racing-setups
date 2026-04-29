import { Link, useLocation } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {
  const { search } = useLocation()
  const gameSlug = new URLSearchParams(search).get('game') || ''

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-flag-checkered" />
          Racing Setups
        </Link>
        <div className="navbar-actions">
          <Link to={gameSlug ? `/new?game=${gameSlug}` : '/new'} className="btn btn-primary">
            <i className="fa-solid fa-plus" />
            New Setup
          </Link>
        </div>
      </div>
    </nav>
  )
}
