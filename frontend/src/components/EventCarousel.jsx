import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRRule } from '../lib/parseICS'
import '../styles/EventCarousel.css'

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

function EventCarouselCard({ event }) {
  const schedule = event.is_recurring ? formatRRule(event.rrule) : null
  const date = event.is_recurring
    ? null
    : new Date(event.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = new Date(event.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

  return (
    <div className={`ev-card${event.is_recurring ? ' ev-card-recurring' : ' ev-card-oneoff'}`}>
      <span className={`ev-badge${event.is_recurring ? ' ev-badge-recurring' : ' ev-badge-oneoff'}`}>
        {event.is_recurring
          ? <><i className="fa-solid fa-rotate" /> Recurring</>
          : <><i className="fa-solid fa-calendar-check" /> One-off</>}
      </span>
      <h3 className="ev-card-title">{event.title}</h3>
      <div className="ev-card-schedule">
        <i className={`fa-solid ${event.is_recurring ? 'fa-rotate' : 'fa-calendar-days'}`} />
        <span>{event.is_recurring ? `${schedule} · ${time}` : `${date} · ${time}`}</span>
      </div>
      {event.description && (
        <p className="ev-card-desc">{event.description}</p>
      )}
      {event.location && (
        <div className="ev-card-location">
          <i className="fa-brands fa-discord" />
          <span>{event.location}</span>
        </div>
      )}
      <div className="ev-card-actions">
        {event.discord_invite && (
          <a href={event.discord_invite} target="_blank" rel="noopener noreferrer" className="ev-card-action-btn">
            <i className="fa-brands fa-discord" /> Join
          </a>
        )}
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="ev-card-action-btn">
          <i className="fa-brands fa-google" /> Calendar
        </a>
      </div>

      {event.profiles?.username && (
        <div className="ev-card-creator">
          <i className="fa-solid fa-circle-user" />
          <span>{event.profiles.username}</span>
        </div>
      )}
    </div>
  )
}

export default function EventCarousel({ isRecurring }) {
  const [events, setEvents] = useState([])
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select('*, profiles(username)')
      .eq('is_recurring', isRecurring)
      .order('start_time', { ascending: true })
      .then(({ data }) => { setEvents(data || []); setLoaded(true) })
  }, [isRecurring])

  if (!loaded || events.length === 0) return null

  const duration = `${Math.max(events.length * 5, 20)}s`
  const title = isRecurring ? 'Recurring Race Nights' : 'Upcoming One-off Events'
  const link  = isRecurring ? '/events/recurring' : '/events/oneoff'

  return (
    <div className="ev-carousel-section">
      <div className="ev-carousel-header">
        <h2 className="ev-carousel-title">{title}</h2>
        <Link to={link} className="ev-carousel-viewall">
          View all <i className="fa-solid fa-arrow-right" />
        </Link>
      </div>
      <div className="ev-carousel-wrapper">
        <div className="ev-carousel-fade ev-carousel-fade-left" />
        <div className="ev-carousel-fade ev-carousel-fade-right" />
        <div className="ev-carousel-track" style={{ '--ev-dur': duration }}>
          {events.map(ev => (
            <div key={ev.id} className="ev-carousel-item">
              <EventCarouselCard event={ev} />
            </div>
          ))}
          {events.map(ev => (
            <div key={`dup-${ev.id}`} className="ev-carousel-item" aria-hidden="true">
              <EventCarouselCard event={ev} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
