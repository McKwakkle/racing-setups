import { Link } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-flag-checkered" />
          Racing Setups
        </Link>
        <div className="navbar-actions">
          <Link to="/new" className="btn btn-primary">
            <i className="fa-solid fa-plus" />
            New Setup
          </Link>
        </div>
      </div>
    </nav>
  )
}
