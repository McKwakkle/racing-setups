import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../styles/GameTabs.css'

export default function GameTabs() {
  const [games, setGames] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const { session, profile } = useAuth()
  const isAdmin = profile?.is_admin === true

  const [showAddModal, setShowAddModal]     = useState(false)
  const [newGameName, setNewGameName]       = useState('')
  const [error, setError]                   = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete]       = useState(null)
  const [deleteError, setDeleteError]         = useState('')
  const [deleting, setDeleting]               = useState(false)

  const scrollRef = useRef(null)
  const [showFadeLeft, setShowFadeLeft]   = useState(false)
  const [showFadeRight, setShowFadeRight] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function close() { setMenuOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  function checkOverflow() {
    const el = scrollRef.current
    if (!el) return
    setShowFadeLeft(el.scrollLeft > 1)
    setShowFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  function scrollTabs(dir) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  const activeGame = searchParams.get('game') || 'all'

  useEffect(() => {
    supabase.from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data)
    })
  }, [])

  useEffect(() => {
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [games])

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
    if (!slug) { setError('Game name must contain at least one letter or number'); return }
    setSubmitting(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'add_game', game: { name: newGameName.trim(), slug } }),
    })
    setSubmitting(false)
    if (res.status === 401 || res.status === 403) { setError('Not authorised'); return }
    if (!res.ok) { setError('Something went wrong'); return }
    const { data } = await supabase.from('games').select('*').order('name')
    if (data) setGames(data)
    setShowAddModal(false)
    setNewGameName('')
  }

  function openDeleteGame(e, game) {
    e.stopPropagation()
    setGameToDelete(game)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  async function handleDeleteGame(e) {
    e.preventDefault()
    setDeleteError('')
    setDeleting(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'delete_game', game_id: gameToDelete.id }),
    })
    setDeleting(false)
    if (res.status === 401 || res.status === 403) { setDeleteError('Not authorised'); return }
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
        <div className="game-tabs-container">

          {/* Mobile burger menu */}
          <div className="game-tabs-mobile" onClick={e => e.stopPropagation()}>
            <button className="game-tabs-burger" onClick={() => setMenuOpen(o => !o)}>
              <i className="fa-solid fa-bars" />
              <span>{activeGame === 'all' ? 'All Games' : (games.find(g => g.slug === activeGame)?.name || 'All Games')}</span>
              <i className={`fa-solid fa-chevron-${menuOpen ? 'up' : 'down'} game-tabs-burger-chevron`} />
            </button>
            {menuOpen && (
              <div className="game-tabs-dropdown">
                <button className={`game-tabs-dropdown-item${activeGame === 'all' ? ' active' : ''}`} onClick={() => { selectGame('all'); setMenuOpen(false) }}>
                  All Games
                </button>
                {games.map(g => (
                  <button
                    key={g.id}
                    className={`game-tabs-dropdown-item${activeGame === g.slug ? ' active' : ''}`}
                    onClick={() => { selectGame(g.slug); setMenuOpen(false) }}
                  >
                    {g.name}
                    {isAdmin && activeGame === g.slug && (
                      <span className="game-tab-delete-icon" onClick={e => openDeleteGame(e, g)}>
                        <i className="fa-solid fa-trash" />
                      </span>
                    )}
                  </button>
                ))}
                {isAdmin && (
                  <button className="game-tabs-dropdown-item game-tabs-dropdown-add" onClick={() => { setError(''); setShowAddModal(true); setMenuOpen(false) }}>
                    <i className="fa-solid fa-plus" /> Add Game
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop scrollable tabs */}
          <div className="game-tabs-desktop">
            {showFadeLeft && (
              <button className="game-tabs-arrow game-tabs-arrow-left" onClick={() => scrollTabs(-1)} aria-label="Scroll left">
                <i className="fa-solid fa-chevron-left" />
              </button>
            )}
            <div className="game-tabs-scrollable" ref={scrollRef} onScroll={checkOverflow}>
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
                    {isAdmin && activeGame === g.slug && (
                      <span className="game-tab-delete-icon" onClick={e => openDeleteGame(e, g)} title={`Delete ${g.name}`}>
                        <i className="fa-solid fa-trash" />
                      </span>
                    )}
                  </button>
                ))}
                {isAdmin && (
                  <button className="btn btn-ghost game-tab-add" onClick={() => { setError(''); setShowAddModal(true) }}>
                    <i className="fa-solid fa-plus" /> Add Game
                  </button>
                )}
              </div>
            </div>
            {showFadeRight && (
              <button className="game-tabs-arrow game-tabs-arrow-right" onClick={() => scrollTabs(1)} aria-label="Scroll right">
                <i className="fa-solid fa-chevron-right" />
              </button>
            )}
          </div>

        </div>
      </div>

      {isAdmin && showAddModal && (
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
            {error && <p className="add-game-error">{error}</p>}
            <div className="add-game-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !newGameName.trim()}>
                {submitting ? 'Adding…' : 'Add Game'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isAdmin && showDeleteModal && gameToDelete && (
        <div className="add-game-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <form className="delete-game-modal" onClick={e => e.stopPropagation()} onSubmit={handleDeleteGame}>
            <h3><i className="fa-solid fa-triangle-exclamation" /> Delete Game</h3>
            <p>
              This will permanently delete <strong>{gameToDelete.name}</strong> and all its setups.
              This cannot be undone.
            </p>
            {deleteError && <p className="add-game-error">{deleteError}</p>}
            <div className="delete-game-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={deleting}
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
