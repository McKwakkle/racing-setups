import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../styles/SetupForm.css'

const emptyField   = () => ({ id: crypto.randomUUID(), field_name: '', field_value: '' })
const emptySection = () => ({ id: crypto.randomUUID(), name: '', fields: [emptyField()] })

const CSV_TEMPLATE = [
  'Type,Name,Value',
  'META,Game,World of Outlaws: Dirt Racing 24',
  'META,Car,Pro Late Model',
  'META,Title,Bristol Motor Speedway - Race Trim',
  'META,Category,Dirt Oval',
  'META,Control,remote',
  'META,Author,YourGamertag',
  'META,Notes,Optional notes about this setup',
  'META,Track,Bristol Motor Speedway',
  'META,SetupType,track-specific',
  'META,LapTime,1:23.456',
  'META,Conditions,Dry',
  'SECTION,Suspension,',
  'FIELD,Front Spring Rate,800',
  'FIELD,Rear Spring Rate,600',
  'SECTION,Tires,',
  'FIELD,Left Front Pressure,12.5',
  'FIELD,Right Front Pressure,12.5',
  'FIELD,Left Rear Pressure,14',
  'FIELD,Right Rear Pressure,14',
].join('\n')

const AI_PROMPT = `You are helping me format a racing game car setup as a CSV file for a setup tracker website.

Use EXACTLY this format — do not add extra columns, headers, or explanation, just the raw CSV:

Type,Name,Value
META,Game,[full game name]
META,Car,[car name]
META,Title,[a descriptive setup title]
META,Category,[e.g. Dirt Oval, Street, Drift, Rally, Grip, Drag]
META,Control,[wheel OR remote]
META,Author,[gamertag — optional, leave blank if not needed]
META,Notes,[any notes about conditions or usage — optional]
META,Track,[specific track name — required for track-specific, optional for generic]
META,SetupType,[track-specific OR generic]
META,LapTime,[lap time e.g. 1:23.456 — optional, only for track-specific]
META,Conditions,[track conditions e.g. Dry, Wet, Intermediate, Muddy — optional, only for track-specific]
SECTION,[Section Name],
FIELD,[Setting Name],[Value]
FIELD,[Setting Name],[Value]
SECTION,[Another Section],
FIELD,[Setting Name],[Value]

Rules:
- META rows define the setup details
- SECTION rows start a new group of settings — leave the Value column blank
- FIELD rows are always placed under the SECTION above them
- Control must be exactly "wheel" or "remote"
- Values can include units (e.g. 800 lbs/in, -2.5°, 12.5 psi)
- If a value contains a comma, wrap it in double quotes
- Include every setting the game exposes, grouped logically by section

Now generate the CSV for this setup:
[DESCRIBE YOUR SETUP HERE — include the game, car, track, and all the setting names and values]`

function parseCSVRow(row) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export default function SetupForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const preselectedSlug = searchParams.get('game') || ''
  const fileInputRef = useRef(null)

  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    game_id: '', car_name: '', title: '', category_id: '',
    newCategory: '', control_type: 'wheel', author_name: '', notes: '', track_name: '',
    is_track_specific: false, lap_time: '', track_conditions: '', is_public: true,
  })
  const [sections, setSections] = useState([emptySection()])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [csvMessage, setCsvMessage] = useState('')
  const [csvError, setCsvError] = useState('')
  const [promptCopied, setPromptCopied] = useState(false)

  useEffect(() => {
    supabase.from('games').select('*').order('name').then(({ data }) => {
      if (!data) return
      setGames(data)
      if (preselectedSlug) {
        const match = data.find(g => g.slug === preselectedSlug)
        if (match) setForm(f => ({ ...f, game_id: match.id }))
      }
    })
    supabase.from('categories').select('*').order('name').then(({ data }) => data && setCategories(data))
  }, [preselectedSlug])

  const selectedGame = games.find(g => g.id === form.game_id) || null

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

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'setup-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyPrompt() {
    navigator.clipboard.writeText(AI_PROMPT)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2500)
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCsvMessage('')
    setCsvError('')

    const reader = new FileReader()
    reader.onload = evt => {
      try { importCSV(evt.target.result) }
      catch { setCsvError('Could not parse file — make sure it matches the template format.') }
    }
    reader.readAsText(file)
  }

  function importCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('Empty file')

    const rows = lines.slice(1).map(parseCSVRow)
    const newForm = { ...form }
    const newSections = []
    let currentSection = null
    let sectionCount = 0

    for (const cols of rows) {
      const type  = (cols[0] || '').toUpperCase()
      const name  = (cols[1] || '').trim()
      const value = (cols[2] || '').trim()

      if (type === 'META') {
        switch (name.toLowerCase()) {
          case 'game': {
            const match = games.find(g => g.name.toLowerCase() === value.toLowerCase())
            if (match) newForm.game_id = match.id
            break
          }
          case 'car':    newForm.car_name    = value; break
          case 'title':  newForm.title       = value; break
          case 'author': newForm.author_name = value; break
          case 'notes':  newForm.notes       = value; break
          case 'track':     newForm.track_name       = value; break
          case 'setuptype': newForm.is_track_specific = value.toLowerCase().includes('track'); break
          case 'laptime':   newForm.lap_time          = value; break
          case 'conditions': newForm.track_conditions  = value; break
          case 'control':
            newForm.control_type = value.toLowerCase().includes('wheel') ? 'wheel' : 'remote'
            break
          case 'category': {
            const match = categories.find(c => c.name.toLowerCase() === value.toLowerCase())
            if (match) newForm.category_id = match.id
            else newForm.newCategory = value
            break
          }
        }
      } else if (type === 'SECTION' && name) {
        if (currentSection) newSections.push(currentSection)
        currentSection = { id: crypto.randomUUID(), name, fields: [] }
        sectionCount++
      } else if (type === 'FIELD' && name && currentSection) {
        currentSection.fields.push({ id: crypto.randomUUID(), field_name: name, field_value: value })
      }
    }

    if (currentSection) newSections.push(currentSection)

    setForm(newForm)
    setSections(newSections.length > 0 ? newSections : [emptySection()])
    setCsvMessage(`Imported ${sectionCount} section${sectionCount !== 1 ? 's' : ''} — review the fields below then save.`)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    const { data: { session: s } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${s.access_token}`,
      },
      body: JSON.stringify({
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

    const { id } = await res.json()
    navigate(`/setup/${id}`)
  }

  return (
    <div className="setup-form-page">
      <h1>New Setup</h1>
      <form className="setup-form" onSubmit={handleSubmit}>

        {/* CSV Import — only shown once a game is selected */}
        {form.game_id ? (
          <div className="csv-import-card">
            <div className="csv-import-info">
              <i className="fa-solid fa-file-csv csv-import-icon" />
              <div>
                <strong>Import from CSV{selectedGame ? ` — ${selectedGame.name}` : ''}</strong>
                <p>
                  Use the AI prompt to generate a CSV with your AI of choice, then upload it to auto-fill
                  the form below. You can edit any field before saving.
                </p>
              </div>
            </div>
            <div className="csv-import-actions">
              <button type="button" className="btn btn-secondary" onClick={copyPrompt}>
                {promptCopied
                  ? <><i className="fa-solid fa-check" /> Prompt Copied!</>
                  : <><i className="fa-solid fa-robot" /> Copy AI Prompt</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>
                <i className="fa-solid fa-download" /> Download Template
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                <i className="fa-solid fa-file-arrow-up" /> Upload CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleCSVUpload}
              />
            </div>
            {csvMessage && <p className="csv-success"><i className="fa-solid fa-check" /> {csvMessage}</p>}
            {csvError   && <p className="csv-error"><i className="fa-solid fa-triangle-exclamation" /> {csvError}</p>}
          </div>
        ) : (
          <div className="csv-import-card csv-import-locked">
            <i className="fa-solid fa-file-csv csv-import-icon" />
            <p>Select a game below to unlock CSV import.</p>
          </div>
        )}

        {/* Basic info */}
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
        </div>

        {/* Dynamic sections */}
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
              Only you can see private setups. Change to Public any time in Edit Setup.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          {submitError && <p className="pin-error">{submitError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <i className="fa-solid fa-floppy-disk" /> {submitting ? 'Saving…' : 'Save Setup'}
          </button>
        </div>
      </form>
    </div>
  )
}
