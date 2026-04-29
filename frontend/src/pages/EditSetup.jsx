import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useSetupForm, emptySection } from '../hooks/useSetupForm'
import SetupFormFields from '../components/SetupFormFields'
import '../styles/SetupForm.css'

export default function EditSetup() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    form, setForm, setFormField,
    sections, setSections,
    games, setGames,
    categories, setCategories,
    addSection, removeSection, updateSectionName,
    addField, removeField, updateField,
    buildPayload,
  } = useSetupForm()

  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: gameList }, { data: catList }, { data: setup }, { data: secs }] = await Promise.all([
        supabase.from('games').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('setups').select('*, games(name, slug), categories(name)').eq('id', id).single(),
        supabase.from('setup_sections').select('*, setup_fields(*)').eq('setup_id', id).order('sort_order'),
      ])

      if (!setup) { navigate('/'); return }

      if (gameList) setGames(gameList)
      if (catList)  setCategories(catList)

      setForm({
        game_id:           setup.game_id,
        car_name:          setup.car_name,
        title:             setup.title,
        category_id:       setup.category_id || '',
        newCategory:       '',
        control_type:      setup.control_type,
        author_name:       setup.author_name || '',
        notes:             setup.notes || '',
        track_name:        setup.track_name || '',
        is_track_specific: setup.is_track_specific || false,
        lap_time:          setup.lap_time || '',
        track_conditions:  setup.track_conditions || '',
        is_public:         setup.is_public !== false,
      })

      setSections(
        (secs || []).length > 0
          ? secs.map(sec => ({
              id: crypto.randomUUID(),
              name: sec.name,
              fields: (sec.setup_fields || [])
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(f => ({ id: crypto.randomUUID(), field_name: f.field_name, field_value: f.field_value })),
            }))
          : [emptySection()]
      )

      setLoading(false)
    }
    load()
  }, [id, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'update_setup', setup_id: id, ...buildPayload() }),
    })

    setSubmitting(false)
    if (!res.ok) { setSubmitError('Something went wrong. Please try again.'); return }
    navigate(`/setup/${id}`)
  }

  if (loading) {
    return (
      <div className="setup-form-page empty-state">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Loading setup…</p>
      </div>
    )
  }

  return (
    <div className="setup-form-page">
      <h1>Edit Setup</h1>
      <form className="setup-form" onSubmit={handleSubmit}>
        <SetupFormFields
          form={form} setFormField={setFormField}
          sections={sections} games={games} categories={categories}
          addSection={addSection} removeSection={removeSection} updateSectionName={updateSectionName}
          addField={addField} removeField={removeField} updateField={updateField}
        />
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/setup/${id}`)}>Cancel</button>
          {submitError && <p className="pin-error">{submitError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <i className="fa-solid fa-floppy-disk" /> {submitting ? 'Saving…' : 'Update Setup'}
          </button>
        </div>
      </form>
    </div>
  )
}
