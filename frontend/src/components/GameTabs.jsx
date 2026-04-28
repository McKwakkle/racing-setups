import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/GameTabs.css'

export default function GameTabs() {
  const [games, setGames] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)
  const [deletePin, setDeletePin] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const activeGame = searchParams.get('game') || 'all'

  useEffect(() => {
    supabase.from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data)
    })
  }, [])

  function selectGame(slug) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (slug === 'all') next.delete('game')
      else next.set('game', slug)
      next.delete('car')
      return next
    })
  }

  async function handleAddGame(e) {
    e.preventDefault()
    setError('')
    if (!newGameName.trim()) return

    const slug = newGameName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setSubmitting(true)

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({ pin, action: 'add_game', game: { name: newGameName.trim(), slug } }),
    })

    setSubmitting(false)
    if (res.status === 401) { setError('Incorrect PIN'); return }
    if (!res.ok) { setError('Something went wrong'); return }

    const { data } = await supabase.from('games').select('*').order('name')
    if (data) setGames(data)
    setShowAddModal(false)
    setNewGameName('')
    setPin('')
  }

  function openDeleteGame(e, game) {
    e.stopPropagation()
    setGameToDelete(game)
    setDeletePin('')
    setDeleteError('')
    setShowDeleteModal(true)
  }

  async function handleDeleteGame(e) {
    e.preventDefault()
    setDeleteError('')
    setDeleting(true)

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({ pin: deletePin, action: 'delete_game', game_id: gameToDelete.id }),
    })

    setDeleting(false)
    if (res.status === 401) { setDeleteError('Incorrect PIN'); return }
    if (!res.ok) { setDeleteError('Something went wrong'); return }

    const { data } = await supabase.from('games').select('*').order('name')
    if (data) setGames(data)
    setShowDeleteModal(false)
    setGameToDelete(null)
    selectGame('all')
  }

  return (
    <>
      <div className="game-tabs-wrapper">
        <div className="game-tabs">
          <button className={`game-tab${activeGame === 'all' ? ' active' : ''}`} onClick={() => selectGame('all')}>
            All Games
          </button>
          {games.map(g => (
            <button
              key={g.id}
              className={`game-tab${activeGame === g.slug ? ' active' : ''}`}
              onClick={() => selectGame(g.slug)}
            >
              {g.name}
              {activeGame === g.slug && (
                <span
                  className="game-tab-delete-icon"
                  onClick={e => openDeleteGame(e, g)}
                  title={`Delete ${g.name}`}
                >
                  <i className="fa-solid fa-trash" />
                </span>
              )}
            </button>
          ))}
          <button className="btn btn-ghost game-tab-add" onClick={() => setShowAddModal(true)}>
            <i className="fa-solid fa-plus" /> Add Game
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="add-game-modal-overlay" onClick={() => setShowAddModal(false)}>
          <form className="add-game-modal" onClick={e => e.stopPropagation()} onSubmit={handleAddGame}>
            <h3>Add New Game</h3>
            <input
              type="text"
              placeholder="Game name"
              value={newGameName}
              onChange={e => setNewGameName(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              placeholder="4-digit PIN"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value)}
            />
            {error && <p className="add-game-error">{error}</p>}
            <div className="add-game-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Game'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && gameToDelete && (
        <div className="add-game-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <form className="delete-game-modal" onClick={e => e.stopPropagation()} onSubmit={handleDeleteGame}>
            <h3><i className="fa-solid fa-triangle-exclamation" /> Delete Game</h3>
            <p>
              This will permanently delete <strong>{gameToDelete.name}</strong> and all its setups.
              This cannot be undone.
            </p>
            <input
              type="password"
              placeholder="Enter PIN to confirm"
              maxLength={6}
              value={deletePin}
              onChange={e => setDeletePin(e.target.value)}
              autoFocus
            />
            {deleteError && <p className="add-game-error">{deleteError}</p>}
            <div className="delete-game-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={deleting || deletePin.length < 4}
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                {deleting ? 'Deleting…' : 'Delete Game'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
