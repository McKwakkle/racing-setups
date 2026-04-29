import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/Auth.css'

function getStrength(password) {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9\s]/.test(password),
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady]       = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Supabase exchanges the token automatically and fires SIGNED_IN with RECOVERY type
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checks = getStrength(password)
  const score  = Object.values(checks).filter(Boolean).length

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (score < 4) { setError('Password does not meet all requirements'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    navigate('/', { replace: true })
  }

  if (!ready) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <i className="fa-solid fa-spinner fa-spin auth-icon" />
            <h1>Verifying link…</h1>
            <p>Please wait while we verify your reset link.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-lock auth-icon" />
          <h1>Set a new password</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value.replace(/\s/g, ''))}
              required autoFocus autoComplete="new-password"
            />
            {password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`strength-bar${score >= n ? ` filled-${score}` : ''}`} />
                  ))}
                </div>
                <div className="strength-rules">
                  {[
                    [checks.length, 'At least 8 characters'],
                    [checks.uppercase, 'At least one uppercase letter'],
                    [checks.number, 'At least one number'],
                    [checks.special, 'At least one special character'],
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
            <label>Confirm New Password</label>
            <input
              type="password" value={confirm}
              onChange={e => setConfirm(e.target.value.replace(/\s/g, ''))}
              required autoComplete="new-password"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
