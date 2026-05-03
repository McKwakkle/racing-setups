import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

function getInitialTheme() {
  return localStorage.getItem('theme') || 'dark'
}

export default function Footer() {
  const [theme, setTheme] = useState(getInitialTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-credit">Created by Kellan 'Obelix' Mc Naughton</p>
        <div className="footer-right">
          <Link to="/how-to" className="footer-howto">
            <i className="fa-solid fa-circle-question" /> How to Use
          </Link>
          <div className="footer-divider" />
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <i className="fa-solid fa-moon" />
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
            <i className="fa-solid fa-sun" />
          </button>
          <div className="footer-divider" />
          <div className="footer-links">
            <a
              href="https://mckwakkle.github.io/portfolio/"
              target="_blank" rel="noopener noreferrer"
              className="footer-link" title="Portfolio"
            >
              <i className="fa-solid fa-briefcase" />
            </a>
            <a
              href="https://www.linkedin.com/in/kellan-mc-naughton-906653120/"
              target="_blank" rel="noopener noreferrer"
              className="footer-link" title="LinkedIn"
            >
              <i className="fa-brands fa-linkedin" />
            </a>
            <a
              href="https://github.com/McKwakkle"
              target="_blank" rel="noopener noreferrer"
              className="footer-link" title="GitHub"
            >
              <i className="fa-brands fa-github" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
