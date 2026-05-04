import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SetupCard from './SetupCard'
import SetupCarousel from './SetupCarousel'
import '../styles/SetupGrid.css'

const PAGE_SIZE = 10

export default function SetupGrid() {
  const [setups, setSetups] = useState([])
  const [topAuthors, setTopAuthors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [searchParams] = useSearchParams()

  const gameSlug     = searchParams.get('game')       || ''
  const carSearch    = searchParams.get('car')        || ''
  const gameSearch   = searchParams.get('gameSearch') || ''
  const trackSearch  = searchParams.get('track')      || ''
  const authorSearch = searchParams.get('author')     || ''

  const isHomeView = !gameSlug && !carSearch && !gameSearch && !trackSearch && !authorSearch

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [gameSlug, carSearch, gameSearch, trackSearch, authorSearch])

  useEffect(() => {
    supabase.from('game_top_authors').select('game_id, author_name').then(({ data }) => {
      setTopAuthors(Object.fromEntries((data || []).map(r => [r.game_id, r.author_name])))
    })
  }, [])

  useEffect(() => {
    async function fetchSetups() {
      setLoading(true)
      setError(false)

      let query = supabase
        .from('setups')
        .select('*, games(name, slug), categories(name), ratings(value)')
        .order('created_at', { ascending: false })

      if (isHomeView) {
        query = query.limit(12)
      } else {
        if (gameSlug)     query = query.eq('games.slug', gameSlug)
        if (carSearch)    query = query.ilike('car_name', `%${carSearch}%`)
        if (trackSearch)  query = query.ilike('track_name', `%${trackSearch}%`)
        if (authorSearch) query = query.ilike('author_name', `%${authorSearch}%`)
      }

      const { data, error: fetchError } = await query
      if (fetchError) { setError(true); setLoading(false); return }
      let results = data || []

      if (!isHomeView) {
        if (gameSlug)   results = results.filter(s => s.games?.slug === gameSlug)
        if (gameSearch) results = results.filter(s =>
          s.games?.name?.toLowerCase().includes(gameSearch.toLowerCase())
        )
      }

      // When viewing a specific game, sort by upvotes desc then newest first
      if (gameSlug) {
        results.sort((a, b) => {
          const aUps = (a.ratings || []).filter(r => r.value === 1).length
          const bUps = (b.ratings || []).filter(r => r.value === 1).length
          if (bUps !== aUps) return bUps - aUps
          return new Date(b.created_at) - new Date(a.created_at)
        })
      }

      setSetups(results)
      setLoading(false)
    }
    fetchSetups()
  }, [gameSlug, carSearch, gameSearch, trackSearch, authorSearch, isHomeView])

  if (loading) {
    if (isHomeView) return <div className="carousel-home-skeleton" />
    return (
      <div className="empty-state">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Loading setups…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Could not load setups.</p>
        <p className="text-small">Check your connection and refresh the page.</p>
      </div>
    )
  }

  if (setups.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-flag-checkered" />
        <p>No setups found.</p>
        <p className="text-small">Try a different search or be the first to add one!</p>
      </div>
    )
  }

  if (isHomeView) {
    return (
      <>
        <p className="setup-grid-results">Latest setups</p>
        <SetupCarousel setups={setups} topAuthors={topAuthors} />
      </>
    )
  }

  const visibleSetups = setups.slice(0, displayCount)
  const remaining = setups.length - displayCount

  return (
    <>
      <p className="setup-grid-results">
        {`${setups.length} setup${setups.length !== 1 ? 's' : ''} found${gameSlug ? ' — sorted by top rated' : ''}`}
      </p>
      <div className="setup-grid">
        {visibleSetups.map(s => <SetupCard key={s.id} setup={s} topAuthors={topAuthors} />)}
      </div>
      {remaining > 0 && (
        <div className="load-more">
          <button className="btn btn-secondary" onClick={() => setDisplayCount(n => n + PAGE_SIZE)}>
            <i className="fa-solid fa-chevron-down" /> Load More
            <span className="load-more-count">({remaining} remaining)</span>
          </button>
        </div>
      )}
    </>
  )
}
