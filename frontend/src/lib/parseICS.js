// Parse an ICS file text and return event fields.
// Returns null if no VEVENT is found.
export function parseICS(text) {
  // Unfold ICS line continuations (newline + space/tab = continuation)
  const unfolded = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')

  const lines = unfolded.split('\n')
  let inEvent = false
  const result = {
    title: '',
    description: '',
    location: '',
    startTime: null,
    endTime: null,
    rrule: null,
    isRecurring: false,
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') { inEvent = true; continue }
    if (line === 'END:VEVENT')   { break }
    if (!inEvent) continue

    // Strip property params (e.g. DTSTART;TZID=Europe/London:...)
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key   = line.slice(0, colonIdx).split(';')[0].toUpperCase()
    const value = line.slice(colonIdx + 1)

    switch (key) {
      case 'SUMMARY':     result.title       = value.trim(); break
      case 'DESCRIPTION': result.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim(); break
      case 'LOCATION':    result.location    = value.replace(/\\,/g, ',').trim(); break
      case 'DTSTART':     result.startTime   = parseICSDate(value); break
      case 'DTEND':       result.endTime     = parseICSDate(value); break
      case 'RRULE':
        result.rrule       = value.trim()
        result.isRecurring = true
        break
    }
  }

  if (!result.title || !result.startTime) return null
  return result
}

function parseICSDate(str) {
  const m = str.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, utc] = m
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${utc ? 'Z' : ''}`)
}

// Returns human-readable schedule text from an RRULE string.
export function formatRRule(rrule) {
  if (!rrule) return null
  const parts = Object.fromEntries(
    rrule.split(';').map(p => { const [k, v] = p.split('='); return [k, v] })
  )
  const dayNames = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday' }
  const interval = parts.INTERVAL ? parseInt(parts.INTERVAL) : 1
  const byDay = parts.BYDAY
    ? parts.BYDAY.split(',').map(d => dayNames[d] || d).join(', ')
    : null

  if (parts.FREQ === 'WEEKLY') {
    if (interval === 1 && byDay) return `Every ${byDay}`
    if (interval > 1 && byDay)  return `Every ${interval} weeks on ${byDay}`
    return interval > 1 ? `Every ${interval} weeks` : 'Weekly'
  }
  if (parts.FREQ === 'DAILY')   return interval > 1 ? `Every ${interval} days` : 'Daily'
  if (parts.FREQ === 'MONTHLY') return interval > 1 ? `Every ${interval} months` : 'Monthly'
  return 'Recurring'
}

// Validate recurring: must have RRULE, and if COUNT is set it must be >= 2.
export function validateRecurring(parsed) {
  if (!parsed?.rrule) return 'This ICS file has no recurrence rule — upload it as a one-off event instead.'
  const countMatch = parsed.rrule.match(/COUNT=(\d+)/)
  if (countMatch && parseInt(countMatch[1]) < 2)
    return 'Recurring events must occur at least twice (COUNT must be 2 or more).'
  return null
}

// Validate one-off: must NOT have RRULE.
export function validateOneOff(parsed) {
  if (parsed?.rrule) return 'This ICS file is a recurring event — upload it under Recurring Events instead.'
  return null
}
