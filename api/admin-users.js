/**
 * Vercel Serverless Function: Admin user management
 * File location: /api/admin-users.js
 * Endpoint: POST /api/admin-users   (admin only)
 *
 * Actions:
 *   { action: 'create', email, password, full_name, username, initials, role,
 *     discipline_id, project_id, is_active }
 *   { action: 'set_password', user_id, password }
 *
 * Needs the env var SUPABASE_SERVICE_ROLE_KEY in Vercel (never put it in the browser).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtjsgvajdgqjlindbhxw.supabase.co';
// Public anon key (same value as js/supabase.js) - only used to identify the caller.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anNndmFqZGdxamxpbmRiaHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMzNjQsImV4cCI6MjA5NjAxOTM2NH0.tCNEjswwgKONyiEcdfgZ_TJczofQZcvmPIh7uNS7D_U';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MIN_PASSWORD = 8;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_RE  = /^[A-Za-z0-9._-]{3,30}$/;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Verify the caller is a logged-in, active ADMIN. */
async function requireAdmin(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Session expired. Please sign in again.');

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!userRes.ok) throw new HttpError(401, 'Session expired. Please sign in again.');
  const user = await userRes.json();
  if (!user || !user.id) throw new HttpError(401, 'Session expired. Please sign in again.');

  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=role,is_active&id=eq.${encodeURIComponent(user.id)}`,
    { headers }
  );
  if (!profRes.ok) throw new HttpError(401, 'Could not verify your account.');
  const rows = await profRes.json();
  if (!rows.length || rows[0].role !== 'admin' || rows[0].is_active === false) {
    throw new HttpError(403, 'Only an active Admin can do this.');
  }
  return user;
}

/** Call Supabase with the service key (bypasses RLS). */
async function svc(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function readError(res, fallback) {
  try {
    const b = await res.json();
    return b.msg || b.message || b.error_description || b.error || fallback;
  } catch (e) {
    return fallback;
  }
}

async function createUser(b) {
  const email     = String(b.email || '').trim().toLowerCase();
  const password  = String(b.password || '');
  const fullName  = String(b.full_name || '').trim();
  const username  = String(b.username || '').trim();
  const initials  = String(b.initials || '').trim().toUpperCase().slice(0, 5) || null;
  const role      = String(b.role || '').trim();
  const discId    = b.discipline_id || null;
  const projectId = b.project_id || null;
  const isActive  = b.is_active !== false;

  if (!fullName)               throw new HttpError(400, 'Full name is required.');
  if (!EMAIL_RE.test(email))   throw new HttpError(400, 'A valid email is required.');
  if (!USER_RE.test(username)) throw new HttpError(400, 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore.');
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);
  if (!role)                   throw new HttpError(400, 'Role is required.');
  if (discId && !UUID_RE.test(discId))       throw new HttpError(400, 'Invalid discipline.');
  if (projectId && !UUID_RE.test(projectId)) throw new HttpError(400, 'Invalid project.');

  // Role must exist in the roles table
  const roleRes = await svc(`/rest/v1/roles?select=key&key=eq.${encodeURIComponent(role)}`);
  if (!roleRes.ok || !(await roleRes.json()).length) throw new HttpError(400, 'Unknown role.');

  // Username must be unique (login looks users up by username)
  const nameRes = await svc(`/rest/v1/users?select=id&username=eq.${encodeURIComponent(username)}`);
  if (nameRes.ok && (await nameRes.json()).length) throw new HttpError(409, 'That username is already taken.');

  // 1) Auth account (email_confirm: true = no confirmation email needed)
  const authRes = await svc('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username },
    }),
  });
  if (!authRes.ok) {
    throw new HttpError(authRes.status === 422 ? 409 : 400, await readError(authRes, 'Could not create the login account.'));
  }
  const authUser = await authRes.json();
  const newId = authUser.id;

  // 2) Profile row (the sign-up trigger already inserted a basic one - overwrite it)
  const profRes = await svc('/rest/v1/users?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: newId,
      email,
      full_name: fullName,
      username,
      initials,
      role,
      discipline_id: discId,
      project_id: projectId,
      is_active: isActive,
    }),
  });
  if (!profRes.ok) {
    // Roll back the auth account so we never leave a half-created user behind
    await svc(`/auth/v1/admin/users/${newId}`, { method: 'DELETE' });
    throw new HttpError(500, await readError(profRes, 'Could not save the user profile.'));
  }

  return { ok: true, id: newId };
}

async function setPassword(b) {
  const userId   = String(b.user_id || '');
  const password = String(b.password || '');
  if (!UUID_RE.test(userId)) throw new HttpError(400, 'Invalid user.');
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);

  const res = await svc(`/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new HttpError(400, await readError(res, 'Could not change the password.'));
  return { ok: true };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  if (!SERVICE_KEY) {
    console.error('[admin-users] SUPABASE_SERVICE_ROLE_KEY is not set');
    return res.status(500).json({ error: 'Server not configured', message: 'Server is missing its Supabase service key.' });
  }

  try {
    await requireAdmin(req);
    const body = req.body || {};

    if (body.action === 'create')       return res.status(200).json(await createUser(body));
    if (body.action === 'set_password') return res.status(200).json(await setPassword(body));
    throw new HttpError(400, 'Unknown action.');
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, message: err.message });
    console.error('[admin-users] Error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Unexpected server error.' });
  }
};
