import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../styles/GameTabs.css'

export default function GameTabs() {
  const [games, setGames] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const isAdmin = profile?.is_admin === true

  const [showAddModal, setShowAddModal]     = useState(false)
  const [newGameName, setNewGameName]       = useState('')
  const [error, setError]                   = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete]       = useState(null)
  const [deleteError, setDeleteError]         = useState('')
  const [deleting, setDeleting]               = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showScrollFade, setShowScrollFade] = useState(false)
  const selectorRef = useRef(null)
  const scrollRef   = useRef(null)

  const activeGame = searchParams.get('game') || 'all'
  const activeGameName = activeGame === 'all'
    ? 'All Games'
    : (games.find(g => g.slug === activeGame)?.name || 'All Games')
  const isHome = pathname === '/'

  useEffect(() => {
    supabase.from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data)
    })
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    function close(e) {
      if (selectorRef.current && !selectorRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [dropdownOpen])

  function checkScrollFade() {
    const el = scrollRef.current
    if (!el) return
    setShowScrollFade(el.scrollTop + el.clientHeight < el.scrollHeight - 2)
  }

  useEffect(() => {
    if (dropdownOpen) setTimeout(checkScrollFade, 30)
  }, [dropdownOpen, games])

  function selectGame(slug) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (slug === 'all') next.delete('game')
      else next.set('game', slug)
      next.delete('car')
      return next
    })
    setDropdownOpen(false)
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
    setDropdownOpen(false)
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

          {/* Home tab */}
          <Link
            to="/"
            className={`game-tabs-home${isHome && activeGame === 'all' ? ' active' : ''}`}
          >
            <i className="fa-solid fa-house" />
            <span>Home</span>
          </Link>

          <span className="game-tabs-divider" aria-hidden="true" />

          {/* Games dropdown */}
          <div className="game-tabs-selector" ref={selectorRef}>
            <button
              className={`game-tabs-trigger${dropdownOpen ? ' open' : ''}${activeGame !== 'all' ? ' has-selection' : ''}`}
              onClick={() => setDropdownOpen(o => !o)}
              aria-expanded={dropdownOpen}
            >
              <span className="game-tabs-label">{activeGameName}</span>
              <i className={`fa-solid fa-chevron-down game-tabs-chevron${dropdownOpen ? ' rotated' : ''}`} />
            </button>

            <div className={`game-tabs-panel${dropdownOpen ? ' open' : ''}`}>
              <div
                className="game-tabs-scroll"
                ref={scrollRef}
                onScroll={checkScrollFade}
              >
                {games.map(g => (
                  <button
                    key={g.id}
                    className={`game-tabs-item${activeGame === g.slug ? ' active' : ''}`}
                    onClick={() => selectGame(g.slug)}
                  >
                    <span>{g.name}</span>
                    {isAdmin && (
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

                {isAdmin && (
                  <button
                    className="game-tabs-item game-tabs-item-add"
                    onClick={() => { setError(''); setShowAddModal(true); setDropdownOpen(false) }}
                  >
                    <i className="fa-solid fa-plus" />
                    <span>Add Game</span>
                  </button>
                )}
              </div>

              {showScrollFade && <div className="game-tabs-scroll-fade" />}
            </div>
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={deleting}
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
              >
                {deleting ? 'Deleting…' : 'Delete Game'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
