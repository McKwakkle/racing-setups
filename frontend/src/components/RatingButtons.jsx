import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/RatingButtons.css'

export default function RatingButtons({ setupId }) {
  const [ups, setUps] = useState(0)
  const [downs, setDowns] = useState(0)
  const [myVote, setMyVote] = useState(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`rating_${setupId}`)
    if (stored) setMyVote(Number(stored))

    supabase.from('ratings').select('value').eq('setup_id', setupId).then(({ data }) => {
      const list = data || []
      setUps(list.filter(r => r.value === 1).length)
      setDowns(list.filter(r => r.value === -1).length)
    })
  }, [setupId])

  async function vote(value) {
    if (myVote !== null || voting) return
    setVoting(true)
    const { error } = await supabase.from('ratings').insert({ setup_id: setupId, value })
    setVoting(false)
    if (error) return
    localStorage.setItem(`rating_${setupId}`, String(value))
    setMyVote(value)
    if (value === 1) setUps(u => u + 1)
    else setDowns(d => d + 1)
  }

  const total = ups + downs
  const voted = myVote !== null

  return (
    <div className="rating-block">
      <span className="rating-label">Rate this setup</span>
      <div className="rating-buttons">
        <button
          className={`rating-btn rating-btn-up${myVote === 1 ? ' active' : ''}`}
          onClick={() => vote(1)}
          disabled={voted}
          title={voted ? 'Already rated' : 'Good setup'}
        >
          <i className="fa-solid fa-thumbs-up" />
          <span>{ups}</span>
        </button>
        <button
          className={`rating-btn rating-btn-down${myVote === -1 ? ' active' : ''}`}
          onClick={() => vote(-1)}
          disabled={voted}
          title={voted ? 'Already rated' : 'Needs work'}
        >
          <i className="fa-solid fa-thumbs-down" />
          <span>{downs}</span>
        </button>
        {voted && (
          <span className="rating-thanks">
            {myVote === 1 ? 'Glad it helped!' : 'Thanks for the feedback.'}
          </span>
        )}
        {!voted && total > 0 && (
          <span className="rating-count">{total} rating{total !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
