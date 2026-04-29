export default function SetupFormFields({
  form, setFormField,
  sections, games, categories,
  addSection, removeSection, updateSectionName,
  addField, removeField, updateField,
}) {
  return (
    <>
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
            <button type="button" className={`control-type-btn${!form.is_track_specific ? ' active' : ''}`}
              onClick={() => setFormField('is_track_specific', false)}>
              <i className="fa-solid fa-globe" /> Generic
            </button>
            <button type="button" className={`control-type-btn${form.is_track_specific ? ' active' : ''}`}
              onClick={() => setFormField('is_track_specific', true)}>
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
                  <option value="Dry" /><option value="Wet" /><option value="Intermediate" />
                  <option value="Damp" /><option value="Muddy" /><option value="Tacky" />
                  <option value="Gravel" /><option value="Snow" />
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
            <button type="button" className={`control-type-btn${form.control_type === 'wheel' ? ' active' : ''}`}
              onClick={() => setFormField('control_type', 'wheel')}>
              <i className="fa-solid fa-steering-wheel" /> Steering Wheel
            </button>
            <button type="button" className={`control-type-btn${form.control_type === 'remote' ? ' active' : ''}`}
              onClick={() => setFormField('control_type', 'remote')}>
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
            <button type="button" className={`control-type-btn${form.is_public ? ' active' : ''}`}
              onClick={() => setFormField('is_public', true)}>
              <i className="fa-solid fa-globe" /> Public
            </button>
            <button type="button" className={`control-type-btn${!form.is_public ? ' active' : ''}`}
              onClick={() => setFormField('is_public', false)}>
              <i className="fa-solid fa-lock" /> Private Draft
            </button>
          </div>
          {!form.is_public && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Only you can see private setups. Change to Public any time in Edit Setup.
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
    </>
  )
}
