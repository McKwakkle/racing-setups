import { Link } from 'react-router-dom'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-credit">Created by Kellan 'Obelix' Mc Naughton</p>
        <div className="footer-right">
          <Link to="/how-to" className="footer-howto">
            <i className="fa-solid fa-circle-question" /> How to Use
          </Link>
          <div className="footer-divider" />
          <div className="footer-links">
            <a href="mailto:kellanmcn@gmail.com" className="footer-link" title="Email">
              <i className="fa-solid fa-envelope" />
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
