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

  try {
    const body = await req.json()
    const { pin, action } = body

    const correctPin = Deno.env.get('SETUP_PIN')
    if (!correctPin || pin !== correctPin) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Add a new game
    if (action === 'add_game') {
      const { game } = body
      const { data, error } = await supabase
        .from('games')
        .insert({ name: game.name, slug: game.slug })
        .select('id')
        .single()
      if (error) throw error
      return new Response(JSON.stringify({ id: data.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete a game (and all its setups)
    if (action === 'delete_game') {
      const { game_id } = body
      await supabase.from('setups').delete().eq('game_id', game_id)
      const { error } = await supabase.from('games').delete().eq('id', game_id)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete a single setup
    if (action === 'delete_setup') {
      const { setup_id } = body
      const { error } = await supabase.from('setups').delete().eq('id', setup_id)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update an existing setup
    if (action === 'update_setup') {
      const { setup_id, setup, sections } = body

      let categoryId = setup.category_id || null
      if (setup.newCategory) {
        const name = setup.newCategory.trim()
        const { data: existing } = await supabase
          .from('categories').select('id').ilike('name', name).maybeSingle()
        if (existing) {
          categoryId = existing.id
        } else {
          const { data: created, error: catErr } = await supabase
            .from('categories').insert({ name }).select('id').single()
          if (catErr) throw catErr
          categoryId = created.id
        }
      }

      const { error: setupError } = await supabase
        .from('setups')
        .update({
          game_id:      setup.game_id,
          car_name:     setup.car_name,
          title:        setup.title,
          category_id:  categoryId,
          control_type: setup.control_type,
          author_name:  setup.author_name ?? null,
          notes:        setup.notes ?? null,
          track_name:   setup.track_name ?? null,
        })
        .eq('id', setup_id)
      if (setupError) throw setupError

      await supabase.from('setup_sections').delete().eq('setup_id', setup_id)

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx]
        const { data: newSection, error: sectionError } = await supabase
          .from('setup_sections')
          .insert({ setup_id, name: section.name, sort_order: sIdx })
          .select('id')
          .single()
        if (sectionError) throw sectionError

        const fields = (section.fields ?? []).map(
          (f: { field_name: string; field_value: string }, fIdx: number) => ({
            section_id:  newSection.id,
            field_name:  f.field_name,
            field_value: f.field_value,
            sort_order:  fIdx,
          })
        )
        if (fields.length > 0) {
          const { error: fieldsError } = await supabase.from('setup_fields').insert(fields)
          if (fieldsError) throw fieldsError
        }
      }

      return new Response(JSON.stringify({ id: setup_id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Submit a setup (default action)
    const { setup, sections } = body

    // Resolve or create category
    let categoryId = setup.category_id || null
    if (setup.newCategory) {
      const name = setup.newCategory.trim()
      const { data: existing } = await supabase
        .from('categories').select('id').ilike('name', name).maybeSingle()
      if (existing) {
        categoryId = existing.id
      } else {
        const { data: created, error: catErr } = await supabase
          .from('categories').insert({ name }).select('id').single()
        if (catErr) throw catErr
        categoryId = created.id
      }
    }

    const { data: newSetup, error: setupError } = await supabase
      .from('setups')
      .insert({
        game_id:      setup.game_id,
        car_name:     setup.car_name,
        title:        setup.title,
        category_id:  categoryId,
        control_type: setup.control_type,
        author_name:  setup.author_name ?? null,
        notes:        setup.notes ?? null,
        track_name:   setup.track_name ?? null,
      })
      .select('id')
      .single()

    if (setupError) throw setupError

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx]
      const { data: newSection, error: sectionError } = await supabase
        .from('setup_sections')
        .insert({ setup_id: newSetup.id, name: section.name, sort_order: sIdx })
        .select('id')
        .single()
      if (sectionError) throw sectionError

      const fields = (section.fields ?? []).map(
        (f: { field_name: string; field_value: string }, fIdx: number) => ({
          section_id:  newSection.id,
          field_name:  f.field_name,
          field_value: f.field_value,
          sort_order:  fIdx,
        })
      )
      if (fields.length > 0) {
        const { error: fieldsError } = await supabase.from('setup_fields').insert(fields)
        if (fieldsError) throw fieldsError
      }
    }

    return new Response(JSON.stringify({ id: newSetup.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
