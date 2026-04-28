import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SetupCard from './SetupCard'
import '../styles/SetupGrid.css'

export default function SetupGrid() {
  const [setups, setSetups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  const gameSlug   = searchParams.get('game') || ''
  const carSearch  = searchParams.get('car') || ''
  const gameSearch = searchParams.get('gameSearch') || ''
  const trackSearch = searchParams.get('track') || ''

  useEffect(() => {
    async function fetchSetups() {
      setLoading(true)
      let query = supabase
        .from('setups')
        .select('*, games(name, slug), categories(name)')
        .order('created_at', { ascending: false })

      if (gameSlug) query = query.eq('games.slug', gameSlug)
      if (carSearch) query = query.ilike('car_name', `%${carSearch}%`)
      if (trackSearch) query = query.ilike('track_name', `%${trackSearch}%`)

      const { data } = await query
      let results = data || []

      if (gameSlug) results = results.filter(s => s.games?.slug === gameSlug)
      if (gameSearch) results = results.filter(s => s.games?.name?.toLowerCase().includes(gameSearch.toLowerCase()))

      setSetups(results)
      setLoading(false)
    }
    fetchSetups()
  }, [gameSlug, carSearch, gameSearch, trackSearch])

  if (loading) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Loading setups…</p>
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

  return (
    <>
      <p className="setup-grid-results">{setups.length} setup{setups.length !== 1 ? 's' : ''} found</p>
      <div className="setup-grid">
        {setups.map(s => <SetupCard key={s.id} setup={s} />)}
      </div>
    </>
  )
}
