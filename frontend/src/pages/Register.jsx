import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter } from 'bad-words'
import { supabase } from '../lib/supabase'
import '../styles/Auth.css'

const profanityFilter = new Filter()

function getStrength(password) {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9\s]/.test(password),
  }
}

function strengthScore(checks) {
  return Object.values(checks).filter(Boolean).length
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function Register() {
  const navigate = useNavigate()

  const [username, setUsername]           = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirm, setConfirm]             = useState('')
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState(false)
  const [loading, setLoading]             = useState(false)
  const [showStrength, setShowStrength]   = useState(false)

  const checks = getStrength(password)
  const score  = strengthScore(checks)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim()) { setError('Username is required'); return }
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters')
      return
    }
    if (/\s/.test(username)) {
      setError('Username cannot contain spaces')
      return
    }
    if (profanityFilter.isProfane(username)) {
      setError('Username contains inappropriate language')
      return
    }
    if (score < 4) { setError('Password does not meet all requirements'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const { data: taken } = await supabase.from('profiles').select('id').ilike('username', username.trim()).maybeSingle()
    if (taken) { setLoading(false); setError('That username is already taken'); return }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    })
    setLoading(false)

    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  async function signUpWith(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <i className="fa-solid fa-envelope-circle-check auth-icon" />
            <h1>Check your email</h1>
            <p>We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.</p>
          </div>
          <Link to="/login" className="btn btn-primary auth-submit" style={{ textAlign: 'center', justifyContent: 'center' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-flag-checkered auth-icon" />
          <h1>Create an account</h1>
          <p>Join the crew and share your setups</p>
        </div>

        <div className="oauth-buttons">
          {/* <button className="btn-oauth" onClick={() => signUpWith('google')}>
            <i className="fa-brands fa-google" /> Sign up with Google
          </button> */}
          <button className="btn-oauth" onClick={() => signUpWith('discord')}>
            <i className="fa-brands fa-discord" /> Sign up with Discord
          </button>
        </div>
        <div className="auth-divider"><span>or</span></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="e.g. SpeedKing_99"
              required autoFocus autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" value={password}
              onChange={e => { setPassword(e.target.value.replace(/\s/g, '')); setShowStrength(true) }}
              required autoComplete="new-password"
            />
            {showStrength && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`strength-bar${score >= n ? ` filled-${score}` : ''}`} />
                  ))}
                </div>
                <span className="strength-label">{score > 0 ? STRENGTH_LABELS[score] : ''}</span>
                <div className="strength-rules">
                  {[
                    [checks.length,    'At least 8 characters'],
                    [checks.uppercase, 'At least one uppercase letter'],
                    [checks.number,    'At least one number'],
                    [checks.special,   'At least one special character'],
                  ].map(([met, label]) => (
                    <span key={label} className={`strength-rule${met ? ' met' : ''}`}>
                      <i className={`fa-solid ${met ? 'fa-check' : 'fa-xmark'}`} /> {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password" value={confirm}
              onChange={e => setConfirm(e.target.value.replace(/\s/g, ''))}
              required autoComplete="new-password"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <span>Already have an account? <Link to="/login">Sign in</Link></span>
        </div>
      </div>
    </div>
  )
}
