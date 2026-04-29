import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
  'SECTION,Suspension,',
  'FIELD,Front Spring Rate,800',
  'FIELD,Rear Spring Rate,600',
  'SECTION,Tires,',
  'FIELD,Left Front Pressure,12.5',
  'FIELD,Right Front Pressure,12.5',
  'FIELD,Left Rear Pressure,14',
  'FIELD,Right Rear Pressure,14',
].join('\n')

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
  const fileInputRef = useRef(null)
  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    game_id: '', car_name: '', title: '', category_id: '',
    newCategory: '', control_type: 'wheel', author_name: '', notes: '', track_name: '',
  })
  const [sections, setSections] = useState([emptySection()])
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
  const [csvError, setCsvError] = useState('')

  useEffect(() => {
    supabase.from('games').select('*').order('name').then(({ data }) => data && setGames(data))
    supabase.from('categories').select('*').order('name').then(({ data }) => data && setCategories(data))
  }, [])

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

  function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCsvMessage('')
    setCsvError('')

    const reader = new FileReader()
    reader.onload = evt => {
      try {
        importCSV(evt.target.result)
      } catch (err) {
        setCsvError('Could not parse file — make sure it matches the template format.')
      }
    }
    reader.readAsText(file)
  }

  function importCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('Empty file')

    const rows = lines.slice(1).map(parseCSVRow)
    const newForm = {
      game_id: '', car_name: '', title: '', category_id: '',
      newCategory: '', control_type: 'wheel', author_name: '', notes: '', track_name: '',
    }
    const newSections = []
    let currentSection = null
    let sectionCount = 0

    for (const cols of rows) {
      const type = (cols[0] || '').toUpperCase()
      const name = (cols[1] || '').trim()
      const value = (cols[2] || '').trim()

      if (type === 'META') {
        switch (name.toLowerCase()) {
          case 'game': {
            const match = games.find(g => g.name.toLowerCase() === value.toLowerCase())
            if (match) newForm.game_id = match.id
            break
          }
          case 'car':      newForm.car_name     = value; break
          case 'title':    newForm.title        = value; break
          case 'author':   newForm.author_name  = value; break
          case 'notes':    newForm.notes        = value; break
          case 'track':    newForm.track_name   = value; break
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

  function handleSubmitClick(e) {
    e.preventDefault()
    setShowPin(true)
  }

  async function handlePinSubmit(e) {
    e.preventDefault()
    setPinError('')
    setSubmitting(true)

    const payload = {
      pin,
      setup: {
        game_id:      form.game_id,
        car_name:     form.car_name.trim(),
        title:        form.title.trim(),
        category_id:  form.category_id || null,
        control_type: form.control_type,
        author_name:  form.author_name.trim() || null,
        notes:        form.notes.trim() || null,
        track_name:   form.track_name.trim() || null,
        newCategory:  form.newCategory.trim() || null,
      },
      sections: sections
        .filter(sec => sec.name.trim())
        .map(sec => ({
          name: sec.name.trim(),
          fields: sec.fields.filter(f => f.field_name.trim() && f.field_value.trim()),
        })),
    }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    })

    setSubmitting(false)

    if (res.status === 401) { setPinError('Incorrect PIN — try again'); return }
    if (!res.ok) { setPinError('Something went wrong. Please try again.'); return }

    const { id } = await res.json()
    navigate(`/setup/${id}`)
  }

  return (
    <div className="setup-form-page">
      <h1>New Setup</h1>
      <form className="setup-form" onSubmit={handleSubmitClick}>

        {/* CSV Import */}
        <div className="csv-import-card">
          <div className="csv-import-info">
            <i className="fa-solid fa-file-csv csv-import-icon" />
            <div>
              <strong>Import from CSV</strong>
              <p>Download the template, fill it in, then upload to auto-fill the form.</p>
            </div>
          </div>
          <div className="csv-import-actions">
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

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            <i className="fa-solid fa-floppy-disk" /> Save Setup
          </button>
        </div>
      </form>

      {/* PIN Modal */}
      {showPin && (
        <div className="pin-modal-overlay" onClick={() => { setShowPin(false); setPin(''); setPinError('') }}>
          <form className="pin-modal" onClick={e => e.stopPropagation()} onSubmit={handlePinSubmit}>
            <h3><i className="fa-solid fa-lock" /> Enter PIN</h3>
            <p>Enter the group PIN to submit your setup.</p>
            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="······"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {pinError && <p className="pin-error">{pinError}</p>}
            <div className="pin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowPin(false); setPin(''); setPinError('') }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || pin.length < 4}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
