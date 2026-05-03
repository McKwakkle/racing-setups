import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const body = await req.json()
    const { action } = body

    // Verify JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')

    // Service role client for all DB writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // Helper: silently truncate strings to a max length
    function trunc(val: string | null | undefined, max: number): string | null {
      if (!val) return null
      return val.length > max ? val.substring(0, max) : val
    }

    // Helper: check admin role
    async function isAdmin(): Promise<boolean> {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      return data?.is_admin === true
    }

    // Helper: resolve or create category
    async function resolveCategory(setup: { category_id?: string; newCategory?: string }): Promise<string | null> {
      if (setup.newCategory) {
        const name = setup.newCategory.trim()
        const { data: existing } = await supabase.from('categories').select('id').ilike('name', name).maybeSingle()
        if (existing) return existing.id
        const { data: created, error } = await supabase.from('categories').insert({ name }).select('id').single()
        if (error) throw error
        return created.id
      }
      return setup.category_id || null
    }

    // Helper: insert sections and fields
    async function insertSections(setupId: string, sections: Array<{ name: string; fields: Array<{ field_name: string; field_value: string }> }>) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx]
        const { data: newSection, error: sErr } = await supabase
          .from('setup_sections')
          .insert({ setup_id: setupId, name: section.name, sort_order: sIdx })
          .select('id').single()
        if (sErr) throw sErr

        const fields = (section.fields ?? []).map((f, fIdx) => ({
          section_id: newSection.id,
          field_name:  trunc(f.field_name,  100) ?? '',
          field_value: trunc(f.field_value, 500) ?? '',
          sort_order: fIdx,
        }))
        if (fields.length > 0) {
          const { error: fErr } = await supabase.from('setup_fields').insert(fields)
          if (fErr) throw fErr
        }
      }
    }

    // ── Add event (any authenticated user) ────────────────────────────────
    if (action === 'add_event') {
      const { event } = body
      const { error } = await supabase.from('events').insert({
        title:        trunc(event.title, 200),
        description:  trunc(event.description, 2000),
        location:     trunc(event.location, 300),
        start_time:   event.startTime,
        end_time:     event.endTime ?? null,
        is_recurring: event.isRecurring ?? false,
        rrule:        event.rrule ?? null,
        created_by:   user.id,
      })
      if (error) throw error
      return json({ ok: true })
    }

    // ── Delete event (creator or admin) ────────────────────────────────────
    if (action === 'delete_event') {
      const { data: ev } = await supabase.from('events').select('created_by').eq('id', body.event_id).single()
      if (!ev) return json({ error: 'Not found' }, 404)
      if (ev.created_by !== user.id && !await isAdmin()) return json({ error: 'Forbidden' }, 403)
      const { error } = await supabase.from('events').delete().eq('id', body.event_id)
      if (error) throw error
      return json({ ok: true })
    }

    // ── Add game (admin only) ──────────────────────────────────────────────
    if (action === 'add_game') {
      if (!await isAdmin()) return json({ error: 'Forbidden' }, 403)
      const { game } = body
      const { data, error } = await supabase.from('games').insert({ name: game.name, slug: game.slug }).select('id').single()
      if (error) throw error
      return json({ id: data.id })
    }

    // ── Delete game (admin only) ───────────────────────────────────────────
    if (action === 'delete_game') {
      if (!await isAdmin()) return json({ error: 'Forbidden' }, 403)
      await supabase.from('setups').delete().eq('game_id', body.game_id)
      const { error } = await supabase.from('games').delete().eq('id', body.game_id)
      if (error) throw error
      return json({ ok: true })
    }

    // ── Delete setup (owner or admin) ──────────────────────────────────────
    if (action === 'delete_setup') {
      const { data: existing } = await supabase.from('setups').select('creator_id').eq('id', body.setup_id).single()
      if (existing?.creator_id !== user.id && !await isAdmin()) return json({ error: 'Forbidden' }, 403)
      const { error } = await supabase.from('setups').delete().eq('id', body.setup_id)
      if (error) throw error
      return json({ ok: true })
    }

    // ── Update setup (owner or admin) ──────────────────────────────────────
    if (action === 'update_setup') {
      const { setup_id, setup, sections } = body
      const { data: existing } = await supabase.from('setups').select('creator_id').eq('id', setup_id).single()
      if (existing?.creator_id !== user.id && !await isAdmin()) return json({ error: 'Forbidden' }, 403)

      const categoryId = await resolveCategory(setup)

      const { error: setupErr } = await supabase.from('setups').update({
        game_id:           setup.game_id,
        car_name:          trunc(setup.car_name, 100),
        title:             trunc(setup.title, 200),
        category_id:       categoryId,
        control_type:      setup.control_type,
        author_name:       trunc(setup.author_name, 50),
        notes:             trunc(setup.notes, 1000),
        track_name:        trunc(setup.track_name, 150),
        is_track_specific: setup.is_track_specific ?? false,
        lap_time:          trunc(setup.lap_time, 20),
        track_conditions:  trunc(setup.track_conditions, 50),
        is_public:         setup.is_public ?? true,
      }).eq('id', setup_id)
      if (setupErr) throw setupErr

      await supabase.from('setup_sections').delete().eq('setup_id', setup_id)
      await insertSections(setup_id, sections)

      return json({ id: setup_id })
    }

    // ── Duplicate setup ────────────────────────────────────────────────────
    if (action === 'duplicate_setup') {
      const { data: original, error: origErr } = await supabase.from('setups').select('*').eq('id', body.setup_id).single()
      if (origErr) throw origErr

      const { data: secs, error: secsErr } = await supabase
        .from('setup_sections').select('*, setup_fields(*)').eq('setup_id', body.setup_id).order('sort_order')
      if (secsErr) throw secsErr

      const { data: newSetup, error: setupErr } = await supabase.from('setups').insert({
        game_id:           original.game_id,
        car_name:          original.car_name,
        title:             original.title + ' (Copy)',
        category_id:       original.category_id,
        control_type:      original.control_type,
        author_name:       original.author_name,
        notes:             original.notes,
        track_name:        null,
        is_track_specific: original.is_track_specific,
        lap_time:          original.lap_time,
        track_conditions:  original.track_conditions,
        creator_id:        user.id,
        is_public:         false,
      }).select('id').single()
      if (setupErr) throw setupErr

      for (let sIdx = 0; sIdx < (secs || []).length; sIdx++) {
        const sec = secs[sIdx]
        const { data: newSec, error: sErr } = await supabase
          .from('setup_sections').insert({ setup_id: newSetup.id, name: sec.name, sort_order: sIdx }).select('id').single()
        if (sErr) throw sErr

        const fields = (sec.setup_fields || [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((f: { field_name: string }, fIdx: number) => ({
            section_id: newSec.id, field_name: f.field_name, field_value: '', sort_order: fIdx,
          }))
        if (fields.length > 0) {
          const { error: fErr } = await supabase.from('setup_fields').insert(fields)
          if (fErr) throw fErr
        }
      }

      return json({ id: newSetup.id })
    }

    // ── Create setup (default) ─────────────────────────────────────────────
    const { setup, sections } = body
    const categoryId = await resolveCategory(setup)

    const { data: newSetup, error: setupErr } = await supabase.from('setups').insert({
      game_id:           setup.game_id,
      car_name:          trunc(setup.car_name, 100),
      title:             trunc(setup.title, 200),
      category_id:       categoryId,
      control_type:      setup.control_type,
      author_name:       trunc(setup.author_name, 50),
      notes:             trunc(setup.notes, 1000),
      track_name:        trunc(setup.track_name, 150),
      is_track_specific: setup.is_track_specific ?? false,
      lap_time:          trunc(setup.lap_time, 20),
      track_conditions:  trunc(setup.track_conditions, 50),
      creator_id:        user.id,
      is_public:         setup.is_public ?? true,
    }).select('id').single()
    if (setupErr) throw setupErr

    await insertSections(newSetup.id, sections)

    return json({ id: newSetup.id })

  } catch (err) {
    const message = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err))
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
