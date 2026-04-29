import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../styles/RatingButtons.css'

export default function RatingButtons({ setupId, creatorId }) {
  const { session } = useAuth()
  const [ups, setUps]         = useState(0)
  const [myRowId, setMyRowId] = useState(null)
  const [voting, setVoting]   = useState(false)

  const isOwner = session && creatorId && session.user.id === creatorId
  const voted = myRowId !== null

  useEffect(() => {
    supabase.from('ratings').select('value').eq('setup_id', setupId).eq('value', 1).then(({ data }) => {
      setUps((data || []).length)
    })

    if (session) {
      supabase.from('ratings')
        .select('id')
        .eq('setup_id', setupId)
        .eq('user_id', session.user.id)
        .maybeSingle()
        .then(({ data }) => setMyRowId(data?.id ?? null))
    }
  }, [setupId, session])

  async function vote() {
    if (!session || voting) return
    setVoting(true)

    if (voted) {
      await supabase.from('ratings').delete().eq('id', myRowId)
      setMyRowId(null)
      setUps(u => u - 1)
    } else {
      const { data, error } = await supabase
        .from('ratings')
        .insert({ setup_id: setupId, value: 1, user_id: session.user.id })
        .select('id')
        .single()

      if (!error && data) {
        setMyRowId(data.id)
        setUps(u => u + 1)

        // Notify creator (best-effort)
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (!s) return
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${s.access_token}`,
            },
            body: JSON.stringify({ setup_id: setupId, type: 'upvote' }),
          }).catch(() => {})
        })
      }
    }

    setVoting(false)
  }

  if (!session) {
    return (
      <div className="rating-block">
        <span className="rating-label">Rate this setup</span>
        <div className="rating-buttons">
          <span className="rating-btn rating-btn-up">
            <i className="fa-solid fa-thumbs-up" />
            <span>{ups}</span>
          </span>
          <span className="rating-count" style={{ fontSize: '0.8rem' }}>
            <Link to="/login">Sign in</Link> to rate
          </span>
        </div>
      </div>
    )
  }

  if (isOwner) {
    return (
      <div className="rating-block">
        <span className="rating-label">Rate this setup</span>
        <div className="rating-buttons">
          <span className="rating-btn rating-btn-up" style={{ opacity: 0.5, cursor: 'default' }}>
            <i className="fa-solid fa-thumbs-up" />
            <span>{ups}</span>
          </span>
          <span className="rating-count" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            You can't upvote your own setup
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rating-block">
      <span className="rating-label">Rate this setup</span>
      <div className="rating-buttons">
        <button
          className={`rating-btn rating-btn-up${voted ? ' active' : ''}`}
          onClick={vote}
          disabled={voting}
          title={voted ? 'Remove your upvote' : 'Upvote this setup'}
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
