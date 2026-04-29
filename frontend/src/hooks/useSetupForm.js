import { useState } from 'react'

export const emptyField   = () => ({ id: crypto.randomUUID(), field_name: '', field_value: '' })
export const emptySection = () => ({ id: crypto.randomUUID(), name: '', fields: [emptyField()] })

export const EMPTY_FORM = {
  game_id: '', car_name: '', title: '', category_id: '',
  newCategory: '', control_type: 'wheel', author_name: '', notes: '', track_name: '',
  is_track_specific: false, lap_time: '', track_conditions: '', is_public: true,
}

export function useSetupForm() {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [sections, setSections]   = useState([emptySection()])
  const [games, setGames]         = useState([])
  const [categories, setCategories] = useState([])

  function setFormField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addSection() { setSections(s => [...s, emptySection()]) }
  function removeSection(sid) { setSections(s => s.filter(sec => sec.id !== sid)) }
  function updateSectionName(sid, name) {
    setSections(s => s.map(sec => sec.id === sid ? { ...sec, name } : sec))
  }
  function addField(sid) {
    setSections(s => s.map(sec => sec.id === sid
      ? { ...sec, fields: [...sec.fields, emptyField()] }
      : sec
    ))
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

  function buildPayload() {
    return {
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
    }
  }

  return {
    form, setForm, setFormField,
    sections, setSections,
    games, setGames,
    categories, setCategories,
    addSection, removeSection, updateSectionName,
    addField, removeField, updateField,
    buildPayload,
  }
}
