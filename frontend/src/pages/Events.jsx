import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { parseICS, validateRecurring, validateOneOff, formatRRule } from '../lib/parseICS'
import EventCard from '../components/EventCard'
import '../styles/Events.css'

export default function Events() {
  const { type } = useParams()           // 'recurring' | 'oneoff'
  const isRecurring = type === 'recurring'
  const { session } = useAuth()

  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [parsed, setParsed]     = useState(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileRef = useRef(null)

  async function fetchEvents() {
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from('events')
      .select('*, profiles(username)')
      .eq('is_recurring', isRecurring)
      .order('start_time', { ascending: true })
    if (fetchErr) { setError('Could not load events.'); setLoading(false); return }
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
    setParsed(null)
    setFileError('')
    setSubmitSuccess(false)
  }, [type])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileError('')
    setParsed(null)
    setSubmitSuccess(false)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = parseICS(ev.target.result)
      if (!result) { setFileError('Could not read this ICS file. Make sure it contains a valid event.'); return }

      const validationError = isRecurring
        ? validateRecurring(result)
        : validateOneOff(result)
      if (validationError) { setFileError(validationError); return }

      setParsed(result)
    }
    reader.readAsText(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!parsed) return
    setSubmitting(true)
    setFileError('')

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'add_event', event: parsed }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setFileError(body.error || 'Something went wrong. Please try again.')
      return
    }

    setParsed(null)
    setSubmitSuccess(true)
    if (fileRef.current) fileRef.current.value = ''
    await fetchEvents()
  }

  async function handleDelete(id) {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'delete_event', event_id: id }),
    })
    if (res.ok) await fetchEvents()
  }

  const title      = isRecurring ? 'Recurring Events' : 'One-off Events'
  const emptyLabel = isRecurring
    ? 'No recurring events scheduled.'
    : 'No upcoming one-off events.'
  const uploadHint = isRecurring
    ? 'Upload an ICS file for a recurring event (must repeat at least twice).'
    : 'Upload an ICS file for a single upcoming event.'

  return (
    <div className="events-page container">

      {/* Header + tab switcher */}
      <div className="events-header">
        <div>
          <h1>{title}</h1>
          <p className="events-subtitle">
            {isRecurring
              ? 'Regular race nights that repeat on a schedule.'
              : 'One-time events — automatically removed once the date passes.'}
          </p>
        </div>
        <div className="events-type-toggle">
          <Link
            to="/events/recurring"
            className={`events-type-btn${isRecurring ? ' active' : ''}`}
          >
            <i className="fa-solid fa-rotate" /> Recurring
          </Link>
          <Link
            to="/events/oneoff"
            className={`events-type-btn${!isRecurring ? ' active' : ''}`}
          >
            <i className="fa-solid fa-calendar-check" /> One-off
          </Link>
        </div>
      </div>

      {/* Upload section — authenticated users only */}
      {session && (
        <div className="events-upload-card">
          <div className="events-upload-icon">
            <i className="fa-solid fa-calendar-plus" />
          </div>
          <div className="events-upload-body">
            <strong>Add an event</strong>
            <p>{uploadHint}</p>
          </div>
          <form className="events-upload-form" onSubmit={handleSubmit}>
            <input
              ref={fileRef}
              type="file"
              accept=".ics"
              onChange={handleFileChange}
              className="events-file-input"
              id="ics-upload"
            />
            <label htmlFor="ics-upload" className="btn btn-secondary">
              <i className="fa-solid fa-file-arrow-up" /> Choose ICS file
            </label>
            {parsed && (
              <div className="events-preview">
                <i className="fa-solid fa-circle-check events-preview-icon" />
                <span>
                  <strong>{parsed.title}</strong>
                  {parsed.rrule && <> · {formatRRule(parsed.rrule)}</>}
                </span>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            )}
            {fileError    && <p className="events-file-error"><i className="fa-solid fa-triangle-exclamation" /> {fileError}</p>}
            {submitSuccess && <p className="events-file-success"><i className="fa-solid fa-circle-check" /> Event added successfully!</p>}
          </form>
        </div>
      )}

      {!session && (
        <p className="events-login-hint">
          <Link to="/login">Sign in</Link> to upload events.
        </p>
      )}

      {/* Event list */}
      {loading ? (
        <div className="empty-state">
          <i className="fa-solid fa-spinner fa-spin" />
          <p>Loading events…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <i className="fa-solid fa-triangle-exclamation" />
          <p>{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-calendar-xmark" />
          <p>{emptyLabel}</p>
          {session && <p className="text-small">Use the upload above to add one.</p>}
        </div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onDelete={session ? handleDelete : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
