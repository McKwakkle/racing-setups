import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatRRule } from '../lib/parseICS'
import { authHeaders } from '../lib/supabase'
import '../styles/EventCard.css'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

function googleCalendarUrl(event) {
  const fmt = iso => new Date(iso).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const start = fmt(event.start_time)
  const end   = event.end_time ? fmt(event.end_time) : start
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   event.title,
    dates:  `${start}/${end}`,
    details: event.description || '',
    location: event.location || '',
  })
  if (event.rrule) params.set('recur', `RRULE:${event.rrule}`)
  return `https://calendar.google.com/calendar/render?${params}`
}

export default function EventCard({ event, onDelete, onUpdate }) {
  const { session, profile } = useAuth()
  const canEdit = session && (
    event.created_by === session.user?.id || profile?.is_admin
  )

  const [editOpen, setEditOpen]     = useState(false)
  const [editTitle, setEditTitle]   = useState(event.title)
  const [editDesc, setEditDesc]     = useState(event.description || '')
  const [editInvite, setEditInvite] = useState(event.discord_invite || '')
  const [saving, setSaving]         = useState(false)
  const [editError, setEditError]   = useState('')

  function openEdit() {
    setEditTitle(event.title)
    setEditDesc(event.description || '')
    setEditInvite(event.discord_invite || '')
    setEditError('')
    setEditOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!editTitle.trim()) { setEditError('Title is required'); return }
    setSaving(true)
    setEditError('')
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        action: 'update_event',
        event_id: event.id,
        updates: {
          title:          editTitle.trim(),
          description:    editDesc.trim() || null,
          discord_invite: editInvite.trim() || null,
        },
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setEditError(body.error || 'Something went wrong.')
      return
    }
    setEditOpen(false)
    onUpdate?.()
  }

  const schedule = event.is_recurring ? formatRRule(event.rrule) : null

  return (
    <>
      <div className={`event-card${event.is_recurring ? ' event-card-recurring' : ' event-card-oneoff'}`}>
        <div className="event-card-header">
          <span className={`event-badge${event.is_recurring ? ' event-badge-recurring' : ' event-badge-oneoff'}`}>
            {event.is_recurring
              ? <><i className="fa-solid fa-rotate" /> Recurring</>
              : <><i className="fa-solid fa-calendar-check" /> One-off</>}
          </span>
          <div className="event-card-controls">
            {canEdit && onUpdate && (
              <button className="event-card-icon-btn" onClick={openEdit} title="Edit event">
                <i className="fa-solid fa-pen" />
              </button>
            )}
            {canEdit && onDelete && (
              <button className="event-card-icon-btn event-card-delete" onClick={() => onDelete(event.id)} title="Delete event">
                <i className="fa-solid fa-trash" />
              </button>
            )}
          </div>
        </div>

        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-schedule">
          {event.is_recurring && schedule ? (
            <>
              <i className="fa-solid fa-rotate" />
              <span>{schedule}</span>
              <span className="event-card-time">· {new Date(event.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-calendar-days" />
              <span>{formatDate(event.start_time)}</span>
            </>
          )}
        </div>

        {event.description && (
          <p className="event-card-description">{event.description}</p>
        )}

        {event.location && (
          <div className="event-card-location">
            <i className="fa-brands fa-discord" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="event-card-actions">
          {event.discord_invite && (
            <a href={event.discord_invite} target="_blank" rel="noopener noreferrer" className="btn btn-secondary event-card-btn">
              <i className="fa-brands fa-discord" /> Join Server
            </a>
          )}
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary event-card-btn">
            <i className="fa-brands fa-google" /> Add to Calendar
          </a>
        </div>

        {event.profiles?.username && (
          <div className="event-card-footer">
            <i className="fa-solid fa-circle-user" />
            <span>{event.profiles.username}</span>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="event-modal-overlay" onClick={() => setEditOpen(false)}>
          <form className="event-modal" onClick={e => e.stopPropagation()} onSubmit={handleSave}>
            <h3><i className="fa-solid fa-pen" /> Edit Event</h3>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <div className="form-group">
              <label><i className="fa-brands fa-discord" style={{ color: '#5865f2' }} /> Discord invite link</label>
              <input
                type="url"
                value={editInvite}
                onChange={e => setEditInvite(e.target.value)}
                placeholder="https://discord.gg/..."
              />
            </div>

            {editError && <p className="add-game-error">{editError}</p>}

            <div className="event-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
