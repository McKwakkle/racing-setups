import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/RatingButtons.css'

function loadStored(setupId) {
  try {
    const raw = localStorage.getItem(`rating_${setupId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.rowId) return parsed
    localStorage.removeItem(`rating_${setupId}`)
    return null
  } catch {
    localStorage.removeItem(`rating_${setupId}`)
    return null
  }
}

export default function RatingButtons({ setupId }) {
  const [ups, setUps] = useState(0)
  const [downs, setDowns] = useState(0)
  const [myVote, setMyVote] = useState(null)
  const [myRowId, setMyRowId] = useState(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const stored = loadStored(setupId)
    if (stored) {
      setMyVote(stored.value)
      setMyRowId(stored.rowId)
    }

    supabase.from('ratings').select('value').eq('setup_id', setupId).then(({ data }) => {
      const list = data || []
      setUps(list.filter(r => r.value === 1).length)
      setDowns(list.filter(r => r.value === -1).length)
    })
  }, [setupId])

  async function vote(value) {
    if (voting) return
    setVoting(true)

    // Same button clicked again — remove vote
    if (myVote === value) {
      await supabase.from('ratings').delete().eq('id', myRowId)
      localStorage.removeItem(`rating_${setupId}`)
      setMyVote(null)
      setMyRowId(null)
      if (value === 1) setUps(u => u - 1)
      else setDowns(d => d - 1)
      setVoting(false)
      return
    }

    // Switching from an existing vote — delete the old row first
    if (myVote !== null) {
      await supabase.from('ratings').delete().eq('id', myRowId)
      if (myVote === 1) setUps(u => u - 1)
      else setDowns(d => d - 1)
    }

    // Insert new vote
    const { data, error } = await supabase
      .from('ratings')
      .insert({ setup_id: setupId, value })
      .select('id')
      .single()

    if (!error && data) {
      localStorage.setItem(`rating_${setupId}`, JSON.stringify({ value, rowId: data.id }))
      setMyVote(value)
      setMyRowId(data.id)
      if (value === 1) setUps(u => u + 1)
      else setDowns(d => d + 1)
    }

    setVoting(false)
  }

  const total = ups + downs

  return (
    <div className="rating-block">
      <span className="rating-label">Rate this setup</span>
      <div className="rating-buttons">
        <button
          className={`rating-btn rating-btn-up${myVote === 1 ? ' active' : ''}`}
          onClick={() => vote(1)}
          disabled={voting}
          title="Good setup"
        >
          <i className="fa-solid fa-thumbs-up" />
          <span>{ups}</span>
        </button>
        <button
          className={`rating-btn rating-btn-down${myVote === -1 ? ' active' : ''}`}
          onClick={() => vote(-1)}
          disabled={voting}
          title="Needs work"
        >
          <i className="fa-solid fa-thumbs-down" />
          <span>{downs}</span>
        </button>
        {total > 0 && (
          <span className="rating-count">{total} rating{total !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
