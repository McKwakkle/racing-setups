import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, authHeaders } from '../lib/supabase'
import { useSetupForm, emptySection } from '../hooks/useSetupForm'
import SetupFormFields from './SetupFormFields'
import '../styles/SetupForm.css'

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
  const preselectedSlug = searchParams.get('game') || ''
  const fileInputRef  = useRef(null)
  const jsonInputRef  = useRef(null)

  const {
    form, setForm, setFormField,
    sections, setSections,
    games, setGames,
    categories, setCategories,
    addSection, removeSection, updateSectionName,
    addField, removeField, updateField,
    buildPayload,
  } = useSetupForm()

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [csvLoading, setCsvLoading]   = useState(false)
  const [csvMessage, setCsvMessage]   = useState('')
  const [csvError, setCsvError]       = useState('')
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

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'setup-template.csv'; a.click()
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
    setCsvLoading(true)
    const reader = new FileReader()
    reader.onload = evt => {
      try { importCSV(evt.target.result) }
      catch { setCsvError('Could not parse file — make sure it matches the template format.') }
      finally { setCsvLoading(false) }
    }
    reader.readAsText(file)
  }

  function handleJSONUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCsvMessage('')
    setCsvError('')
    setCsvLoading(true)
    const reader = new FileReader()
    reader.onload = evt => {
      try { importJSON(evt.target.result) }
      catch { setCsvError('Could not parse file — make sure it is a valid ACC setup JSON.') }
      finally { setCsvLoading(false) }
    }
    reader.readAsText(file)
  }

  function importJSON(text) {
    const json = JSON.parse(text)
    const newForm = { ...form }
    const newSections = []

    if (json.carName) newForm.car_name = json.carName

    function camelToWords(str) {
      return str
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/^./, s => s.toUpperCase())
        .trim()
    }

    function buildFields(obj) {
      return Object.entries(obj).map(([k, v]) => {
        let val
        if (Array.isArray(v))
          val = v.every(item => typeof item !== 'object') ? v.join(', ') : JSON.stringify(v)
        else if (typeof v === 'object' && v !== null)
          val = JSON.stringify(v)
        else
          val = String(v)
        return { id: crypto.randomUUID(), field_name: camelToWords(k), field_value: val }
      })
    }

    for (const [key, val] of Object.entries(json)) {
      if (key === 'carName' || key === 'trackBopType') continue
      if (typeof val !== 'object' || Array.isArray(val) || val === null) continue

      const hasNestedObjects = Object.values(val).some(v => typeof v === 'object' && !Array.isArray(v))
      if (hasNestedObjects) {
        for (const [subKey, subVal] of Object.entries(val)) {
          if (typeof subVal === 'object' && !Array.isArray(subVal) && subVal !== null) {
            const fields = buildFields(subVal)
            if (fields.length) newSections.push({ id: crypto.randomUUID(), name: camelToWords(subKey), fields })
          }
        }
      } else {
        const fields = buildFields(val)
        if (fields.length) newSections.push({ id: crypto.randomUUID(), name: camelToWords(key), fields })
      }
    }

    setForm(newForm)
    setSections(newSections.length > 0 ? newSections : [emptySection()])
    const count = newSections.length
    setCsvMessage(`Imported ${count} section${count !== 1 ? 's' : ''} from JSON — select a game and fill in the title below then save.`)
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
          case 'car':       newForm.car_name         = value; break
          case 'title':     newForm.title             = value; break
          case 'author':    newForm.author_name       = value; break
          case 'notes':     newForm.notes             = value; break
          case 'track':     newForm.track_name        = value; break
          case 'setuptype': newForm.is_track_specific = value.toLowerCase().includes('track'); break
          case 'laptime':   newForm.lap_time          = value; break
          case 'conditions': newForm.track_conditions = value; break
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

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(buildPayload()),
    })

    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSubmitError(`Something went wrong (${res.status}): ${body.error ?? 'unknown error'}`)
      return
    }
    const { id } = await res.json()
    navigate(`/setup/${id}`)
  }

  return (
    <div className="setup-form-page">
      <h1>New Setup</h1>
      <form className="setup-form" onSubmit={handleSubmit}>

        {/* JSON import — always available */}
        <div className="csv-import-card">
          <div className="csv-import-info">
            <i className="fa-solid fa-file-code csv-import-icon" />
            <div>
              <strong>Import from JSON <span className="acc-badge">Optimised for ACC</span></strong>
              <p>Upload a setup JSON file to auto-fill the sections below. Select a game first, then upload your file.</p>
            </div>
          </div>
          <div className="csv-import-actions">
            <button type="button" className="btn btn-secondary" onClick={() => jsonInputRef.current.click()} disabled={csvLoading || !form.game_id} title={!form.game_id ? 'Select a game first' : undefined}>
              {csvLoading
                ? <><i className="fa-solid fa-spinner fa-spin" /> Importing…</>
                : <><i className="fa-solid fa-file-arrow-up" /> Upload JSON</>}
            </button>
            <input ref={jsonInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleJSONUpload} />
          </div>
          {csvMessage && <p className="csv-success"><i className="fa-solid fa-check" /> {csvMessage}</p>}
          {csvError   && <p className="csv-error"><i className="fa-solid fa-triangle-exclamation" /> {csvError}</p>}
        </div>

        {/* CSV import — unlocks after game selection */}
        {form.game_id ? (
          <div className="csv-import-card">
            <div className="csv-import-info">
              <i className="fa-solid fa-file-csv csv-import-icon" />
              <div>
                <strong>Import from CSV{selectedGame ? ` — ${selectedGame.name}` : ''}</strong>
                <p>Use the AI prompt to generate a CSV with your AI of choice, then upload it to auto-fill the form below. You can edit any field before saving.</p>
              </div>
            </div>
            <div className="csv-import-actions">
              <button type="button" className="btn btn-secondary" onClick={copyPrompt}>
                {promptCopied ? <><i className="fa-solid fa-check" /> Prompt Copied!</> : <><i className="fa-solid fa-robot" /> Copy AI Prompt</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>
                <i className="fa-solid fa-download" /> Download Template
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()} disabled={csvLoading}>
                {csvLoading
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Importing…</>
                  : <><i className="fa-solid fa-file-arrow-up" /> Upload CSV</>}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
            </div>
          </div>
        ) : (
          <div className="csv-import-card csv-import-locked">
            <i className="fa-solid fa-file-csv csv-import-icon" />
            <p>Select a game below to unlock CSV import.</p>
          </div>
        )}

        <SetupFormFields
          form={form} setFormField={setFormField}
          sections={sections} games={games} categories={categories}
          addSection={addSection} removeSection={removeSection} updateSectionName={updateSectionName}
          addField={addField} removeField={removeField} updateField={updateField}
        />

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
