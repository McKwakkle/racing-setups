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
  const [myVote, setMyVote] = useState(null)
  const [myRowId, setMyRowId] = useState(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const stored = loadStored(setupId)
    if (stored) {
      setMyVote(stored.value)
      setMyRowId(stored.rowId)
    }

    supabase.from('ratings').select('value').eq('setup_id', setupId).eq('value', 1).then(({ data }) => {
      setUps((data || []).length)
    })
  }, [setupId])

  async function vote() {
    if (voting) return
    setVoting(true)

    if (myVote !== null) {
      // Already voted — remove it
      await supabase.from('ratings').delete().eq('id', myRowId)
      localStorage.removeItem(`rating_${setupId}`)
      setMyVote(null)
      setMyRowId(null)
      setUps(u => u - 1)
    } else {
      // Cast upvote
      const { data, error } = await supabase
        .from('ratings')
        .insert({ setup_id: setupId, value: 1 })
        .select('id')
        .single()

      if (!error && data) {
        localStorage.setItem(`rating_${setupId}`, JSON.stringify({ value: 1, rowId: data.id }))
        setMyVote(1)
        setMyRowId(data.id)
        setUps(u => u + 1)
      }
    }

    setVoting(false)
  }

  return (
    <div className="rating-block">
      <span className="rating-label">Rate this setup</span>
      <div className="rating-buttons">
        <button
          className={`rating-btn rating-btn-up${myVote !== null ? ' active' : ''}`}
          onClick={vote}
          disabled={voting}
          title={myVote !== null ? 'Remove your upvote' : 'Upvote this setup'}
        >
          <i className="fa-solid fa-thumbs-up" />
          <span>{ups}</span>
        </button>
        {ups > 0 && (
          <span className="rating-count">{ups} upvote{ups !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
