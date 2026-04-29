import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/Auth.css'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <i className="fa-solid fa-envelope auth-icon" />
            <h1>Check your email</h1>
            <p>
              A password reset link has been sent to <strong>{email}</strong>.
              The link expires in 15 minutes and can only be used once.
            </p>
          </div>
          <Link to="/login" className="btn btn-secondary auth-submit" style={{ textAlign: 'center', justifyContent: 'center' }}>
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
          <i className="fa-solid fa-key auth-icon" />
          <h1>Reset your password</h1>
          <p>Enter your email and we'll send you a reset link.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoFocus
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  )
}
