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
const validFullname = (fullname: unknown) => typeof fullname === 'string' && fullname.trim().length >= 1 && fullname.trim().length <= 120
const validClasslevel = (classlevel: unknown) => ['1', '2', '3', '4', '5'].includes(String(classlevel))
const normalizeClassName = (className: unknown) => typeof className === 'string' ? className.trim() : ''
const validClassName = (className: unknown) => className === undefined || className === null || (typeof className === 'string' && className.trim().length <= 64)
const validGender = (gender: unknown) => gender === undefined || gender === null || gender === '' || ['male', 'female'].includes(String(gender))
const studentAvatarKeys = new Set([
  'boy-short', 'boy-side', 'boy-curly', 'boy-bowl', 'boy-spiky',
  'girl-long', 'girl-bob', 'girl-twins', 'girl-braid', 'girl-doll',
  'boy-reader', 'boy-athlete', 'boy-artist', 'boy-explorer', 'boy-visor',
  'girl-captain', 'girl-artist', 'girl-reader', 'girl-athlete', 'girl-inventor',
  'boy-hoodie', 'boy-cap', 'boy-vest', 'boy-redhair', 'boy-goggles',
  'girl-ponytail', 'girl-curly', 'girl-pink-glasses', 'girl-buns', 'girl-sunhat',
  'boy-wavy', 'boy-fade', 'boy-dino', 'boy-headphones', 'boy-wink',
  'girl-flower', 'girl-bow', 'girl-star', 'girl-bunny', 'girl-streak',
  'cartoon-robot-cat', 'cartoon-lightning-squirrel', 'cartoon-rescue-pup', 'cartoon-dragon', 'cartoon-garden-alien',
  'cartoon-mini-robot', 'cartoon-cloud-fox', 'cartoon-otter', 'cartoon-red-panda', 'cartoon-pilot-bird',
])
const normalizeAvatarKey = (avatarKey: unknown) => typeof avatarKey === 'string' ? avatarKey.trim() : ''
const validAvatarKey = (avatarKey: unknown) => avatarKey === undefined || avatarKey === null || (typeof avatarKey === 'string' && studentAvatarKeys.has(normalizeAvatarKey(avatarKey)))

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
  const { action, fullname, classlevel, password, class_name: rawClassName, gender: rawGender, avatar_key: rawAvatarKey } = body || {}
  const className = normalizeClassName(rawClassName)
  const gender = rawGender || null
  const avatarKey = normalizeAvatarKey(rawAvatarKey) || 'boy-short'
  const username = normalizeUsername(body?.username)
  if (!validUsername(username)) return json({ error: 'invalid_username' }, 422, origin)

  if (action === 'create') {
    if (!validFullname(fullname) || !validClasslevel(classlevel) || typeof password !== 'string' || password.length < 8 || !validClassName(rawClassName) || !validGender(rawGender) || !validAvatarKey(rawAvatarKey)) {
      return json({ error: 'invalid_student_data' }, 422, origin)
    }
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail(username), password, email_confirm: true,
    })
    if (createError || !created.user) return json({ error: 'auth_account_exists' }, 409, origin)
    const { data: profile, error: profileError } = await admin.from('game_users').insert({
      auth_user_id: created.user.id, username, fullname: fullname.trim(), password: null,
      classlevel: String(classlevel), class_name: className || null, gender, avatar_key: avatarKey, role: 'student', approved: true, history: [], totalscore: 0, stars: 0, total_stars_earned: 0,
    }).select().single()
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: 'profile_failed' }, 500, origin)
    }
    return json({ profile }, 200, origin)
  }

  if (action === 'update_profile' || action === 'approve') {
    const { data: profile, error: profileLookupError } = await admin.from('game_users')
      .select('id, auth_user_id, username, role').eq('username', username).maybeSingle()
    if (profileLookupError || !profile) return json({ error: 'student_not_found' }, 404, origin)
    if (String(profile.role || '').toLowerCase() === 'admin') return json({ error: 'invalid_student_data' }, 422, origin)

    if (action === 'approve') {
      const { data: approvedProfile, error: approveError } = await admin.from('game_users')
        .update({ approved: true, history: [], totalscore: 0, stars: 0 })
        .eq('id', profile.id).select().single()
      return approveError ? json({ error: 'profile_update_failed' }, 500, origin) : json({ profile: approvedProfile }, 200, origin)
    }

    if (!validFullname(fullname) || !validClasslevel(classlevel) || !validClassName(rawClassName) || !validGender(rawGender) || !validAvatarKey(rawAvatarKey)) {
      return json({ error: 'invalid_student_data' }, 422, origin)
    }
    const profileUpdate: Record<string, string | null> = {
      fullname: fullname.trim(), classlevel: String(classlevel), class_name: className || null, gender,
    }
    if (rawAvatarKey !== undefined) profileUpdate.avatar_key = avatarKey
    const { data: updatedProfile, error: updateError } = await admin.from('game_users')
      .update(profileUpdate)
      .eq('id', profile.id).select().single()
    return updateError ? json({ error: 'profile_update_failed' }, 500, origin) : json({ profile: updatedProfile }, 200, origin)
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
