import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const responseHeaders = (origin: string | null) => {
  const allowedOrigin = Deno.env.get('APP_ORIGIN') || ''
  return origin && origin === allowedOrigin
    ? { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Vary': 'Origin' }
    : { 'Content-Type': 'application/json' }
}

const json = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), {
  status, headers: responseHeaders(origin),
})

const internalEmail = (username: string) => `${username.toLowerCase()}@game.local`
const normalizeUsername = (username: unknown) => typeof username === 'string' ? username.trim().toLowerCase() : ''
const validUsername = (username: string) => /^[a-z0-9._-]{3,32}$/.test(username)

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  const allowedOrigin = Deno.env.get('APP_ORIGIN') || ''
  if (origin && origin !== allowedOrigin) return json({ error: 'origin_not_allowed' }, 403, origin)
  if (request.method === 'OPTIONS') return new Response(null, {
    status: 204,
    headers: { ...responseHeaders(origin), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
  })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'unauthenticated' }, 401, origin)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)
  const token = authorization.slice('Bearer '.length)
  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return json({ error: 'unauthenticated' }, 401, origin)

  const { data: caller } = await admin.from('game_users')
    .select('role').eq('auth_user_id', authData.user.id).maybeSingle()
  if (caller?.role?.toLowerCase() !== 'admin') return json({ error: 'forbidden' }, 403, origin)

  const body = await request.json().catch(() => null)
  const { action, fullname, classlevel, password } = body || {}
  const username = normalizeUsername(body?.username)
  if (!validUsername(username)) return json({ error: 'invalid_username' }, 422, origin)

  if (action === 'create') {
    if (typeof fullname !== 'string' || !fullname.trim() || !['1', '2', '3', '4', '5'].includes(String(classlevel)) || typeof password !== 'string' || password.length < 8) {
      return json({ error: 'invalid_student_data' }, 422, origin)
    }
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail(username), password, email_confirm: true,
    })
    if (createError || !created.user) return json({ error: 'auth_account_exists' }, 409, origin)
    const { data: profile, error: profileError } = await admin.from('game_users').insert({
      auth_user_id: created.user.id, username, fullname: fullname.trim(), password: null,
      classlevel: String(classlevel), role: 'student', approved: true, history: [], totalscore: 0, lollipops: 0,
    }).select().single()
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: 'profile_failed' }, 500, origin)
    }
    return json({ profile }, 200, origin)
  }

  if (action === 'reset_password') {
    if (typeof password !== 'string' || password.length < 8) return json({ error: 'invalid_password' }, 422, origin)
    const { data: profile } = await admin.from('game_users').select('auth_user_id').eq('username', username).maybeSingle()
    if (!profile) return json({ error: 'student_not_found' }, 404, origin)

    // Legacy profiles existed before Supabase Auth. The first teacher password reset
    // safely creates (or reconnects) that student's Auth account.
    if (!profile.auth_user_id) {
      const email = internalEmail(username)
      const { data: authUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) return json({ error: 'auth_lookup_failed' }, 500, origin)
      const existingAuth = authUsers.users.find((user) => user.email?.toLowerCase() === email)
      let authUserId = existingAuth?.id
      if (authUserId) {
        const { error } = await admin.auth.admin.updateUserById(authUserId, { password })
        if (error) return json({ error: 'reset_failed' }, 500, origin)
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
        if (error || !created.user) return json({ error: 'create_failed' }, 500, origin)
        authUserId = created.user.id
      }
      const { error: linkError } = await admin.from('game_users')
        .update({ auth_user_id: authUserId, password: null }).eq('username', username)
      return linkError ? json({ error: 'profile_link_failed' }, 500, origin) : json({ ok: true, legacy_profile_linked: true }, 200, origin)
    }

    const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, { password })
    return error ? json({ error: 'reset_failed' }, 500, origin) : json({ ok: true }, 200, origin)
  }

  if (action === 'delete') {
    const { data: profile } = await admin.from('game_users').select('auth_user_id').eq('username', username).single()
    if (profile?.auth_user_id) await admin.auth.admin.deleteUser(profile.auth_user_id)
    await admin.from('game_users').delete().eq('username', username)
    return json({ ok: true }, 200, origin)
  }

  return json({ error: 'invalid_action' }, 422, origin)
})
