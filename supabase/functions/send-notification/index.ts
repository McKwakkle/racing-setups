// send-notification: emails setup creators when their setup is upvoted.
//
// Required Supabase secrets (only needed if you want email notifications):
//   RESEND_API_KEY      — from resend.com (free: 3,000 emails/month)
//   RESEND_FROM_EMAIL   — e.g. "Racing Setups <noreply@yourdomain.com>"
//
// Set them with:
//   supabase secrets set RESEND_API_KEY=re_... RESEND_FROM_EMAIL="Racing Setups <noreply@yourdomain.com>"
//
// If the secrets are not set, the function returns 200 and does nothing.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const resendKey  = Deno.env.get('RESEND_API_KEY')
    const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL')
    if (!resendKey || !fromEmail) return json({ ok: true, skipped: 'no email config' })

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { setup_id, type } = await req.json()
    if (type !== 'upvote' || !setup_id) return json({ ok: true })

    // Get setup + creator info
    const { data: setup } = await supabase
      .from('setups')
      .select('title, car_name, creator_id, profiles!setups_creator_id_fkey(notify_on_upvote)')
      .eq('id', setup_id)
      .single()

    if (!setup?.creator_id) return json({ ok: true })

    // Don't notify if voting on own setup
    if (setup.creator_id === user.id) return json({ ok: true })

    // Check notification preference
    const notify = (setup as { profiles?: { notify_on_upvote?: boolean } }).profiles?.notify_on_upvote
    if (!notify) return json({ ok: true, skipped: 'notifications off' })

    // Get creator email from auth.users via admin API
    const { data: creatorData } = await supabase.auth.admin.getUserById(setup.creator_id)
    const creatorEmail = creatorData?.user?.email
    if (!creatorEmail) return json({ ok: true })

    // Send via Resend
    const siteUrl = Deno.env.get('SITE_URL') || 'https://your-site.vercel.app'
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: creatorEmail,
        subject: `Someone upvoted your setup: ${setup.title}`,
        html: `
          <p>Your setup <strong>${setup.title}</strong> (${setup.car_name}) just received an upvote!</p>
          <p><a href="${siteUrl}/setup/${setup_id}">View your setup →</a></p>
          <hr />
          <p style="font-size:12px;color:#888;">
            You're receiving this because you have upvote notifications enabled.
            <a href="${siteUrl}/dashboard">Turn off notifications</a> in your dashboard settings.
          </p>
        `,
      }),
    })

    return json({ ok: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
