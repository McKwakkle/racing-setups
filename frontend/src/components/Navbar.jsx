import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

function EventsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
  const isActive = pathname.startsWith('/events')

  useEffect(() => {
    if (!open) return
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="nav-events-menu" ref={ref}>
      <button
        className={`nav-events-btn${open ? ' open' : ''}${isActive ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <i className="fa-solid fa-calendar-days" />
        <span>Events</span>
        <i className={`fa-solid fa-chevron-down nav-chevron${open ? ' rotated' : ''}`} />
      </button>
      {open && (
        <div className="nav-events-dropdown">
          <Link to="/events/recurring" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            <i className="fa-solid fa-rotate" /> Recurring Events
          </Link>
          <Link to="/events/oneoff" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            <i className="fa-solid fa-calendar-check" /> One-off Events
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();
  const gameSlug = new URLSearchParams(search).get('game') || '';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-flag-checkered" />
          <div className="navbar-logo-text">
            <span className="navbar-logo-title">Obelix Motorsport</span>
            <span className="navbar-logo-subtitle">Performance Setups &amp; Race Engineering</span>
          </div>
        </Link>

        <div className="navbar-actions">
          <EventsMenu />
          {session ? (
            <>
              <Link
                to={gameSlug ? `/new?game=${gameSlug}` : '/new'}
                className="btn btn-primary"
              >
                <i className="fa-solid fa-plus" /> New Setup
              </Link>

              <div className="nav-user-menu" ref={menuRef}>
                <button
                  className="nav-user-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                >
                  <i className="fa-solid fa-circle-user" />
                  <span className="nav-username">
                    {profile?.username || '…'}
                  </span>
                  <i
                    className={`fa-solid fa-chevron-${menuOpen ? 'up' : 'down'} nav-chevron`}
                  />
                </button>

                {menuOpen && (
                  <div className="nav-dropdown">
                    <Link
                      to="/dashboard"
                      className="nav-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-solid fa-gauge" /> Dashboard
                    </Link>
                    <button
                      className="nav-dropdown-item nav-dropdown-signout"
                      onClick={handleSignOut}
                    >
                      <i className="fa-solid fa-right-from-bracket" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
