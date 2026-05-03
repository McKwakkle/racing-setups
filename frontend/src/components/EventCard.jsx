import { useAuth } from '../contexts/AuthContext'
import { formatRRule } from '../lib/parseICS'
import '../styles/EventCard.css'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

export default function EventCard({ event, onDelete }) {
  const { session, profile } = useAuth()
  const canDelete = session && (
    event.created_by === session.user?.id || profile?.is_admin
  )

  const schedule = event.is_recurring
    ? formatRRule(event.rrule)
    : null

  return (
    <div className={`event-card${event.is_recurring ? ' event-card-recurring' : ' event-card-oneoff'}`}>
      <div className="event-card-header">
        <span className={`event-badge${event.is_recurring ? ' event-badge-recurring' : ' event-badge-oneoff'}`}>
          {event.is_recurring
            ? <><i className="fa-solid fa-rotate" /> Recurring</>
            : <><i className="fa-solid fa-calendar-check" /> One-off</>}
        </span>
        {canDelete && onDelete && (
          <button
            className="event-card-delete"
            onClick={() => onDelete(event.id)}
            title="Delete event"
          >
            <i className="fa-solid fa-trash" />
          </button>
        )}
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

      {event.profiles?.username && (
        <div className="event-card-footer">
          <i className="fa-solid fa-circle-user" />
          <span>{event.profiles.username}</span>
        </div>
      )}
    </div>
  )
}
