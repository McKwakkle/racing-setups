import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SetupCard from '../components/SetupCard'
import '../styles/Dashboard.css'
import '../styles/SetupCard.css'
import '../styles/RatingButtons.css'

const TABS = ['My Setups', 'Followed Games', 'Bookmarks', 'Settings']

export default function Dashboard() {
  const { session, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('My Setups')

  const [mySetups, setMySetups] = useState([])
  const [games, setGames] = useState([])
  const [follows, setFollows] = useState(new Set())
  const [bookmarks, setBookmarks] = useState([])
  const [topAuthors, setTopAuthors] = useState({})
  const [loadingSetups, setLoadingSetups] = useState(true)

  // Settings state
  const [username, setUsername] = useState('')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [usernameErr, setUsernameErr] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [notify, setNotify] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState('')

  useEffect(() => {
    if (!session) { navigate('/login'); return }
  }, [session, navigate])

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username || '')
    setNotify(profile.notify_on_upvote || false)
  }, [profile])

  useEffect(() => {
    if (!session) return
    loadMySetups()
    loadGamesAndFollows()
    loadBookmarks()
    supabase.from('game_top_authors').select('game_id, author_name').then(({ data }) => {
      setTopAuthors(Object.fromEntries((data || []).map(r => [r.game_id, r.author_name])))
    })
  }, [session])

  async function loadMySetups() {
    setLoadingSetups(true)
    const { data } = await supabase
      .from('setups')
      .select('*, games(name, slug), categories(name), ratings(value)')
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false })
    setMySetups(data || [])
    setLoadingSetups(false)
  }

  async function loadGamesAndFollows() {
    const [{ data: gamesData }, { data: followData }] = await Promise.all([
      supabase.from('games').select('*').order('name'),
      supabase.from('user_game_follows').select('game_id').eq('user_id', session.user.id),
    ])
    setGames(gamesData || [])
    setFollows(new Set((followData || []).map(f => f.game_id)))
  }

  async function loadBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select('setup_id, setups(*, games(name, slug), categories(name), ratings(value))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setBookmarks((data || []).map(b => b.setups).filter(Boolean))
  }

  async function toggleFollow(gameId) {
    if (follows.has(gameId)) {
      await supabase.from('user_game_follows').delete()
        .eq('user_id', session.user.id).eq('game_id', gameId)
      setFollows(f => { const s = new Set(f); s.delete(gameId); return s })
    } else {
      await supabase.from('user_game_follows').insert({ user_id: session.user.id, game_id: gameId })
      setFollows(f => new Set([...f, gameId]))
    }
  }

  async function deleteSetup(setupId) {
    if (!confirm('Delete this setup? This cannot be undone.')) return
    const { data: { session: s } } = await supabase.auth.getSession()
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${s.access_token}`,
      },
      body: JSON.stringify({ action: 'delete_setup', setup_id: setupId }),
    })
    setMySetups(prev => prev.filter(s => s.id !== setupId))
  }

  async function saveUsername(e) {
    e.preventDefault()
    setUsernameErr('')
    setUsernameMsg('')
    if (username.length < 3 || username.length > 30) {
      setUsernameErr('Username must be between 3 and 30 characters')
      return
    }
    if (/\s/.test(username)) {
      setUsernameErr('Username cannot contain spaces')
      return
    }
    setSavingUsername(true)
    const { error } = await supabase.from('profiles').update({ username }).eq('id', session.user.id)
    setSavingUsername(false)
    if (error) { setUsernameErr(error.message); return }
    setUsernameMsg('Username updated!')
    await refreshProfile()
    setTimeout(() => setUsernameMsg(''), 3000)
  }

  async function savePassword(e) {
    e.preventDefault()
    setPasswordErr('')
    setPasswordMsg('')
    if (newPassword !== confirmPassword) { setPasswordErr('Passwords do not match'); return }
    if (newPassword.length < 8) { setPasswordErr('Password must be at least 8 characters'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) { setPasswordErr(error.message); return }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMsg('Password updated!')
    setTimeout(() => setPasswordMsg(''), 3000)
  }

  async function toggleNotify(checked) {
    setNotify(checked)
    await supabase.from('profiles').update({ notify_on_upvote: checked }).eq('id', session.user.id)
    setNotifyMsg(checked ? 'Notifications on' : 'Notifications off')
    setTimeout(() => setNotifyMsg(''), 2000)
  }

  if (!session || !profile) return null

  return (
    <div className="container">
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Hey, {profile.username} 👋</h1>
          <p>Manage your setups, follow games, and control your preferences.</p>
        </div>

        <div className="dashboard-tabs">
          {TABS.map(t => (
            <button key={t} className={`dashboard-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'My Setups'     && <i className="fa-solid fa-wrench" />}
              {t === 'Followed Games'&& <i className="fa-solid fa-gamepad" />}
              {t === 'Bookmarks'     && <i className="fa-solid fa-bookmark" />}
              {t === 'Settings'      && <i className="fa-solid fa-gear" />}
              {t}
            </button>
          ))}
        </div>

        {/* My Setups */}
        {tab === 'My Setups' && (
          <div className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/new" className="btn btn-primary">
                <i className="fa-solid fa-plus" /> New Setup
              </Link>
            </div>
            {loadingSetups ? (
              <div className="empty-state"><i className="fa-solid fa-spinner fa-spin" /><p>Loading…</p></div>
            ) : mySetups.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-wrench" />
                <p>No setups yet.</p>
                <p className="text-small">Create your first one!</p>
              </div>
            ) : (
              <div className="my-setups-list">
                {mySetups.map(s => (
                  <div key={s.id} className="my-setup-row">
                    <div className="my-setup-row-info">
                      <div className="my-setup-title">
                        {!s.is_public && <span className="private-badge"><i className="fa-solid fa-lock" /> Private</span>}{' '}
                        {s.title}
                      </div>
                      <div className="my-setup-meta">
                        {s.games?.name} · {s.car_name}
                        {s.track_name && ` · ${s.track_name}`}
                      </div>
                    </div>
                    <div className="my-setup-row-actions">
                      <Link to={`/setup/${s.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                        <i className="fa-solid fa-eye" />
                      </Link>
                      <Link to={`/edit/${s.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                        <i className="fa-solid fa-pen" />
                      </Link>
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={() => deleteSetup(s.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Followed Games */}
        {tab === 'Followed Games' && (
          <div className="dashboard-section">
            <p className="text-small text-muted" style={{ color: 'var(--color-text-muted)' }}>
              Follow games to quickly filter for setups you care about.
            </p>
            <div className="follow-game-grid">
              {games.map(g => (
                <div key={g.id} className={`follow-game-card${follows.has(g.id) ? ' followed' : ''}`}>
                  <span><i className="fa-solid fa-gamepad" style={{ marginRight: 6, color: 'var(--color-primary)' }} />{g.name}</span>
                  <button className={`follow-btn${follows.has(g.id) ? ' following' : ''}`} onClick={() => toggleFollow(g.id)}>
                    {follows.has(g.id) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarks */}
        {tab === 'Bookmarks' && (
          <div className="dashboard-section">
            {bookmarks.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-bookmark" />
                <p>No bookmarks yet.</p>
                <p className="text-small">Bookmark setups on their detail page to save them here.</p>
              </div>
            ) : (
              <div className="setup-grid">
                {bookmarks.map(s => <SetupCard key={s.id} setup={s} topAuthors={topAuthors} />)}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'Settings' && (
          <div className="dashboard-section">

            <div className="settings-card">
              <h3><i className="fa-solid fa-user" style={{ marginRight: 6 }} />Username</h3>
              <form className="settings-inline-form" onSubmit={saveUsername}>
                <div className="form-group">
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="username"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingUsername}>
                  {savingUsername ? 'Saving…' : 'Save'}
                </button>
              </form>
              {usernameErr && <p className="auth-error">{usernameErr}</p>}
              {usernameMsg && <p className="settings-save-msg"><i className="fa-solid fa-check" /> {usernameMsg}</p>}
            </div>

            <div className="settings-card">
              <h3><i className="fa-solid fa-lock" style={{ marginRight: 6 }} />Change Password</h3>
              <form className="auth-form" onSubmit={savePassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                </div>
                {passwordErr && <p className="auth-error">{passwordErr}</p>}
                {passwordMsg && <p className="settings-save-msg"><i className="fa-solid fa-check" /> {passwordMsg}</p>}
                <button type="submit" className="btn btn-primary" disabled={savingPassword || !newPassword}>
                  {savingPassword ? 'Saving…' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="settings-card">
              <h3><i className="fa-solid fa-bell" style={{ marginRight: 6 }} />Notifications</h3>
              <div className="settings-row">
                <div className="settings-row-info">
                  <strong>Email me when someone upvotes my setup</strong>
                  <span>You'll receive an email notification for each upvote received.</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notify} onChange={e => toggleNotify(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              {notifyMsg && <p className="settings-save-msg"><i className="fa-solid fa-check" /> {notifyMsg}</p>}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
