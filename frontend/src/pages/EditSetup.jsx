import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../styles/SetupForm.css'

const emptyField   = () => ({ id: crypto.randomUUID(), field_name: '', field_value: '' })
const emptySection = () => ({ id: crypto.randomUUID(), name: '', fields: [emptyField()] })

export default function EditSetup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(null)
  const [sections, setSections] = useState([emptySection()])
  const [loading, setLoading] = useState(true)
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
      if (catList) setCategories(catList)

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
          ? (secs || []).map(sec => ({
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

  function setFormField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addSection() { setSections(s => [...s, emptySection()]) }
  function removeSection(sid) { setSections(s => s.filter(sec => sec.id !== sid)) }
  function updateSectionName(sid, name) {
    setSections(s => s.map(sec => sec.id === sid ? { ...sec, name } : sec))
  }

  function addField(sid) {
    setSections(s => s.map(sec => sec.id === sid ? { ...sec, fields: [...sec.fields, emptyField()] } : sec))
  }
  function removeField(sid, fid) {
    setSections(s => s.map(sec => sec.id === sid
      ? { ...sec, fields: sec.fields.filter(f => f.id !== fid) }
      : sec
    ))
  }
  function updateField(sid, fid, key, val) {
    setSections(s => s.map(sec => sec.id === sid
      ? { ...sec, fields: sec.fields.map(f => f.id === fid ? { ...f, [key]: val } : f) }
      : sec
    ))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        action: 'update_setup',
        setup_id: id,
        setup: {
          game_id:           form.game_id,
          car_name:          form.car_name.trim(),
          title:             form.title.trim(),
          category_id:       form.category_id || null,
          control_type:      form.control_type,
          author_name:       form.author_name.trim() || null,
          notes:             form.notes.trim() || null,
          track_name:        form.is_track_specific ? form.track_name.trim() : (form.track_name.trim() || null),
          is_track_specific: form.is_track_specific,
          lap_time:          form.is_track_specific ? (form.lap_time.trim() || null) : null,
          track_conditions:  form.is_track_specific ? (form.track_conditions.trim() || null) : null,
          is_public:         form.is_public,
          newCategory:       form.newCategory.trim() || null,
        },
        sections: sections
          .filter(sec => sec.name.trim())
          .map(sec => ({
            name: sec.name.trim(),
            fields: sec.fields.filter(f => f.field_name.trim() && f.field_value.trim()),
          })),
      }),
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

        <div className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Game *</label>
              <select value={form.game_id} onChange={e => setFormField('game_id', e.target.value)} required>
                <option value="">Select a game…</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Car *</label>
              <input
                type="text" placeholder="e.g. Nissan GT-R R34"
                value={form.car_name} onChange={e => setFormField('car_name', e.target.value)} required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Setup Title *</label>
            <input
              type="text" placeholder="e.g. Street Build — daily driver tune"
              value={form.title} onChange={e => setFormField('title', e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label>Setup Type *</label>
            <div className="control-type-toggle">
              <button
                type="button"
                className={`control-type-btn${!form.is_track_specific ? ' active' : ''}`}
                onClick={() => setFormField('is_track_specific', false)}
              >
                <i className="fa-solid fa-globe" /> Generic
              </button>
              <button
                type="button"
                className={`control-type-btn${form.is_track_specific ? ' active' : ''}`}
                onClick={() => setFormField('is_track_specific', true)}
              >
                <i className="fa-solid fa-map-location-dot" /> Track Specific
              </button>
            </div>
          </div>

          {form.is_track_specific ? (
            <>
              <div className="form-group">
                <label>Track *</label>
                <input
                  type="text" placeholder="e.g. Nürburgring GP"
                  value={form.track_name} onChange={e => setFormField('track_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lap Time (optional)</label>
                  <input
                    type="text" placeholder="e.g. 1:23.456"
                    value={form.lap_time} onChange={e => setFormField('lap_time', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Track Conditions (optional)</label>
                  <input
                    type="text" placeholder="e.g. Dry"
                    list="track-conditions-list"
                    value={form.track_conditions} onChange={e => setFormField('track_conditions', e.target.value)}
                  />
                  <datalist id="track-conditions-list">
                    <option value="Dry" />
                    <option value="Wet" />
                    <option value="Intermediate" />
                    <option value="Damp" />
                    <option value="Muddy" />
                    <option value="Tacky" />
                    <option value="Gravel" />
                    <option value="Snow" />
                  </datalist>
                </div>
              </div>
              <div className="form-group">
                <label>Your Gamertag (optional)</label>
                <input
                  type="text" placeholder="e.g. SpeedKing99"
                  value={form.author_name} onChange={e => setFormField('author_name', e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Track (optional)</label>
                <input
                  type="text" placeholder="e.g. Nürburgring GP"
                  value={form.track_name} onChange={e => setFormField('track_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Your Gamertag (optional)</label>
                <input
                  type="text" placeholder="e.g. SpeedKing99"
                  value={form.author_name} onChange={e => setFormField('author_name', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={e => setFormField('category_id', e.target.value)}>
                <option value="">Select or type new below…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>New Category (optional)</label>
              <input
                type="text" placeholder="e.g. Endurance"
                value={form.newCategory} onChange={e => setFormField('newCategory', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Control Type *</label>
            <div className="control-type-toggle">
              <button
                type="button"
                className={`control-type-btn${form.control_type === 'wheel' ? ' active' : ''}`}
                onClick={() => setFormField('control_type', 'wheel')}
              >
                <i className="fa-solid fa-steering-wheel" /> Steering Wheel
              </button>
              <button
                type="button"
                className={`control-type-btn${form.control_type === 'remote' ? ' active' : ''}`}
                onClick={() => setFormField('control_type', 'remote')}
              >
                <i className="fa-solid fa-gamepad" /> Remote / Controller
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <input
              type="text" placeholder="e.g. Best on tarmac, tested in wet"
              value={form.notes} onChange={e => setFormField('notes', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <div className="control-type-toggle">
              <button
                type="button"
                className={`control-type-btn${form.is_public ? ' active' : ''}`}
                onClick={() => setFormField('is_public', true)}
              >
                <i className="fa-solid fa-globe" /> Public
              </button>
              <button
                type="button"
                className={`control-type-btn${!form.is_public ? ' active' : ''}`}
                onClick={() => setFormField('is_public', false)}
              >
                <i className="fa-solid fa-lock" /> Private Draft
              </button>
            </div>
            {!form.is_public && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                Only you can see private setups.
              </p>
            )}
          </div>
        </div>

        <div className="form-card">
          <div className="sections-header">
            <h2>Setup Sections</h2>
            <button type="button" className="btn btn-secondary" onClick={addSection}>
              <i className="fa-solid fa-plus" /> Add Section
            </button>
          </div>

          {sections.map(sec => (
            <div key={sec.id} className="section-block">
              <div className="section-block-header">
                <input
                  className="section-name-input"
                  type="text"
                  placeholder="Section name (e.g. Suspension)"
                  value={sec.name}
                  onChange={e => updateSectionName(sec.id, e.target.value)}
                />
                <button type="button" className="btn-icon" onClick={() => removeSection(sec.id)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>

              <div className="section-fields">
                {sec.fields.map(f => (
                  <div key={f.id} className="field-row">
                    <input
                      type="text" placeholder="Setting name"
                      value={f.field_name}
                      onChange={e => updateField(sec.id, f.id, 'field_name', e.target.value)}
                    />
                    <input
                      type="text" placeholder="Value"
                      value={f.field_value}
                      onChange={e => updateField(sec.id, f.id, 'field_value', e.target.value)}
                    />
                    <button type="button" className="btn-icon" onClick={() => removeField(sec.id, f.id)}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost section-add-field" onClick={() => addField(sec.id)}>
                  <i className="fa-solid fa-plus" /> Add Field
                </button>
              </div>
            </div>
          ))}
        </div>

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
