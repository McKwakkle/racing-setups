import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CategoryBadge from './CategoryBadge'
import RatingButtons from './RatingButtons'
import '../styles/SetupDetail.css'
import '../styles/RatingButtons.css'

export default function SetupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [setup, setSetup] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const { session, profile } = useAuth()
  const isAdmin = profile?.is_admin === true
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  const [topAuthor, setTopAuthor] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePin, setDeletePin] = useState('')
  const [deletePinError, setDeletePinError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [showDupModal, setShowDupModal] = useState(false)
  const [dupPin, setDupPin] = useState('')
  const [dupPinError, setDupPinError] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: s } = await supabase
        .from('setups')
        .select('*, games(name, slug), categories(name)')
        .eq('id', id)
        .single()

      if (!s) { navigate('/'); return }
      setSetup(s)

      const { data: sibs } = await supabase
        .from('setups')
        .select('id, title, categories(name)')
        .eq('game_id', s.game_id)
        .ilike('car_name', s.car_name)
        .order('created_at')

      setSiblings(sibs || [])

      const { data: secs } = await supabase
        .from('setup_sections')
        .select('*, setup_fields(*)')
        .eq('setup_id', id)
        .order('sort_order')

      setSections(
        (secs || []).map(sec => ({
          ...sec,
          setup_fields: (sec.setup_fields || []).sort((a, b) => a.sort_order - b.sort_order),
        }))
      )

      const { data: topData } = await supabase
        .from('game_top_authors')
        .select('author_name')
        .eq('game_id', s.game_id)
        .maybeSingle()
      setTopAuthor(topData?.author_name || null)

      if (session) {
        const { data: bm } = await supabase.from('bookmarks')
          .select('setup_id').eq('user_id', session.user.id).eq('setup_id', id).maybeSingle()
        setBookmarked(!!bm)
      }

      setLoading(false)
    }
    load()
  }, [id, navigate, session])

  function copyToClipboard() {
    if (!setup) return
    const lines = [
      `=== ${setup.title} ===`,
      `Game: ${setup.games?.name}`,
      `Car: ${setup.car_name}`,
      `Category: ${setup.categories?.name || 'N/A'}`,
      setup.track_name ? `Track: ${setup.track_name}` : null,
      setup.lap_time ? `Lap Time: ${setup.lap_time}` : null,
      setup.track_conditions ? `Conditions: ${setup.track_conditions}` : null,
      `Control: ${setup.control_type === 'wheel' ? 'Steering Wheel' : 'Remote / Controller'}`,
      setup.author_name ? `Author: ${setup.author_name}` : null,
      setup.notes ? `\nNotes: ${setup.notes}` : null,
      '',
      ...sections.flatMap(sec => [
        `--- ${sec.name} ---`,
        ...sec.setup_fields.map(f => `${f.field_name}: ${f.field_value}`),
        '',
      ]),
    ].filter(l => l !== null)

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function toggleBookmark() {
    if (!session) return
    setBookmarking(true)
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', session.user.id).eq('setup_id', id)
      setBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: session.user.id, setup_id: id })
      setBookmarked(true)
    }
    setBookmarking(false)
  }

  async function handleDelete(e) {
    e.preventDefault()
    setDeletePinError('')
    setDeleting(true)

    const { data: { session: s } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ action: 'delete_setup', setup_id: id }),
    })

    setDeleting(false)
    if (res.status === 401) { setDeletePinError('Incorrect PIN'); return }
    if (!res.ok) { setDeletePinError('Something went wrong'); return }

    navigate('/')
  }

  async function handleDuplicate(e) {
    e.preventDefault()
    setDupPinError('')
    setDuplicating(true)

    const { data: { session: s } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ action: 'duplicate_setup', setup_id: id }),
    })

    setDuplicating(false)
    if (res.status === 401) { setDupPinError('Incorrect PIN'); return }
    if (!res.ok) { setDupPinError('Something went wrong'); return }

    const { id: newId } = await res.json()
    navigate(`/edit/${newId}`)
  }

  if (loading) {
    return (
      <div className="setup-detail empty-state">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Loading setup…</p>
      </div>
    )
  }

  const date = new Date(setup.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="setup-detail">
      <Link to="/" className="setup-detail-back">
        <i className="fa-solid fa-arrow-left" /> Back to setups
      </Link>

      {siblings.length > 1 && (
        <div className="car-tabs-bar">
          {siblings.map(sib => (
            <button
              key={sib.id}
              className={`car-tab${sib.id === id ? ' active' : ''}`}
              onClick={() => navigate(`/setup/${sib.id}`)}
            >
              {sib.title}
              {sib.categories?.name && <> · {sib.categories.name}</>}
            </button>
          ))}
        </div>
      )}

      <div className="setup-detail-header">
        <div>
          <h1 className="setup-detail-title">{setup.title}</h1>
          <div className="setup-detail-car">
            <i className="fa-solid fa-car" /> {setup.car_name}
          </div>
          <div className="setup-detail-meta">
            <span><i className="fa-solid fa-gamepad" /> {setup.games?.name}</span>
            <CategoryBadge name={setup.categories?.name} />
            <span>
              <i className={setup.control_type === 'wheel' ? 'fa-solid fa-steering-wheel' : 'fa-solid fa-gamepad'} />
              {' '}{setup.control_type === 'wheel' ? 'Steering Wheel' : 'Remote / Controller'}
            </span>
            {setup.track_name && <span><i className="fa-solid fa-map-location-dot" /> {setup.track_name}</span>}
            {setup.lap_time && <span><i className="fa-solid fa-stopwatch" /> {setup.lap_time}</span>}
            {setup.track_conditions && <span><i className="fa-solid fa-cloud-sun" /> {setup.track_conditions}</span>}
            {setup.author_name && (
              <span>
                {topAuthor?.toLowerCase() === setup.author_name.toLowerCase() && (
                  <i className="fa-solid fa-star top-author-star" title="Top rated creator for this game" />
                )}
                By {setup.author_name}
              </span>
            )}
            <span>{date}</span>
          </div>
        </div>

        <div className="setup-detail-actions">
          <button className="btn btn-secondary" onClick={copyToClipboard}>
            {copied
              ? <span className="copy-success"><i className="fa-solid fa-check" /> Copied!</span>
              : <><i className="fa-solid fa-copy" /> Copy Setup</>}
          </button>
          <button className="btn btn-secondary" onClick={copyLink}>
            {linkCopied
              ? <span className="copy-success"><i className="fa-solid fa-check" /> Copied!</span>
              : <><i className="fa-solid fa-link" /> Copy Link</>}
          </button>
          {session && (
            <button className={`btn btn-secondary${bookmarked ? ' setup-bookmarked-btn' : ''}`} onClick={toggleBookmark} disabled={bookmarking}>
              <i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          )}
          {session && (
            <button className="btn btn-secondary" onClick={() => { setDupPinError(''); setShowDupModal(true) }}>
              <i className="fa-solid fa-copy" /> Duplicate
            </button>
          )}
          {session && setup.creator_id === session.user.id && (
            <button className="btn btn-secondary" onClick={() => navigate(`/edit/${id}`)}>
              <i className="fa-solid fa-pen" /> Edit
            </button>
          )}
          {session && (setup.creator_id === session.user.id || isAdmin) && (
            <button className="btn btn-secondary setup-delete-btn" onClick={() => { setDeletePin(''); setDeletePinError(''); setShowDeleteModal(true) }}>
              <i className="fa-solid fa-trash" /> Delete
            </button>
          )}
        </div>
      </div>

      {setup.notes && (
        <div className="setup-detail-notes">
          <i className="fa-solid fa-note-sticky" /> {setup.notes}
        </div>
      )}

      <RatingButtons setupId={id} creatorId={setup.creator_id} />

      {session ? (
        sections.map(sec => (
          <div key={sec.id} className="setup-section">
            <div className="setup-section-title">{sec.name}</div>
            <table className="setup-section-table">
              <tbody>
                {sec.setup_fields.map(f => (
                  <tr key={f.id}>
                    <td>{f.field_name}</td>
                    <td>{f.field_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <div className="setup-auth-gate">
          <i className="fa-solid fa-lock" />
          <h3>Sign in to view the full setup</h3>
          <p>Create a free account to access all setup settings, upvote, and bookmark setups.</p>
          <div className="setup-auth-gate-actions">
            <Link to="/login" className="btn btn-primary"><i className="fa-solid fa-right-to-bracket" /> Sign In</Link>
            <Link to="/register" className="btn btn-secondary"><i className="fa-solid fa-user-plus" /> Create Account</Link>
          </div>
        </div>
      )}

      {showDupModal && (
        <div className="pin-modal-overlay" onClick={() => setShowDupModal(false)}>
          <form className="pin-modal" onClick={e => e.stopPropagation()} onSubmit={handleDuplicate}>
            <h3><i className="fa-solid fa-copy" /> Duplicate Setup</h3>
            <p>
              Creates a copy of <strong>{setup.title}</strong> with the same sections and field names,
              but all values left blank. Opens in edit mode as a private draft.
            </p>
            {dupPinError && <p className="pin-error">{dupPinError}</p>}
            <div className="pin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDupModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={duplicating}>
                {duplicating ? 'Duplicating…' : 'Duplicate & Edit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="pin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <form className="pin-modal" onClick={e => e.stopPropagation()} onSubmit={handleDelete}>
            <h3><i className="fa-solid fa-triangle-exclamation" /> Delete Setup</h3>
            <p>This will permanently delete <strong>{setup.title}</strong>. This cannot be undone.</p>
            {deletePinError && <p className="pin-error">{deletePinError}</p>}
            <div className="pin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={deleting}
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                {deleting ? 'Deleting…' : 'Delete Setup'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
