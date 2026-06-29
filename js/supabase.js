// ============================================================
// SUPABASE CONFIG — Replace with your project credentials
// ============================================================
const SUPABASE_URL    = 'https://dtjsgvajdgqjlindbhxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anNndmFqZGdxamxpbmRiaHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMzNjQsImV4cCI6MjA5NjAxOTM2NH0.tCNEjswwgKONyiEcdfgZ_TJczofQZcvmPIh7uNS7D_U';

// The CDN (jsdelivr) already occupies the name "supabase" as a module object.
// We use "db" as our client instance name throughout the app.
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// CURRENT USER STATE
// ============================================================
let currentUser    = null;
let currentProfile = null;

// ── Init: restore session on page load ──────────────────────
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
  }
  return session;
}

// ── Load profile row from public.users ──────────────────────
async function loadProfile() {
  if (!currentUser) return null;

  const { data, error } = await db
    .from('users')
    .select('*, disciplines(name)')
    .eq('id', currentUser.id)
    .single();

  if (error || !data) {
    console.warn('[EngPro] loadProfile: no profile row found, falling back to auth metadata. user id:', currentUser.id);
    // Fallback: build a minimal profile from auth user metadata
    // so sidebar and layout don't break on first login
    // FIX [M8]: Fallback profile keeps role as null (not 'admin').
    // layout.js safeProfile also now uses null — both files aligned on restricted fallback.
    currentProfile = {
      id:        currentUser.id,
      email:     currentUser.email,
      full_name: currentUser.user_metadata?.full_name || currentUser.email,
      username:  currentUser.user_metadata?.username  || null,
      role:      currentUser.user_metadata?.role      || null,
      is_active: true,
      disciplines: null,
    };
    return currentProfile;
  }

  currentProfile = data;
  return data;
}

function getProfile() { return currentProfile; }
function getUser()    { return currentUser; }

// ── Sign in + active-account check ──────────────────────────
async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;

  currentUser = data.user;
  const profile = await loadProfile();

  // Block inactive accounts immediately after login
  if (!profile) {
    await db.auth.signOut();
    currentUser = null;
    currentProfile = null;
    throw new Error('No user profile found. Contact your administrator.');
  }

  if (profile.is_active === false) {
    await db.auth.signOut();
    currentUser = null;
    currentProfile = null;
    throw new Error('Your account has been deactivated. Contact your administrator.');
  }

  return data;
}

// ── Sign out ─────────────────────────────────────────────────
async function signOut() {
  // Remove this browser's push subscription from DB before signing out
  try {
    if (currentProfile?.id && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await db.from('push_subscriptions')
            .delete()
            .eq('user_id', currentProfile.id)
            .eq('subscription->>endpoint', sub.endpoint);
        }
      }
    }
  } catch (err) {
    console.warn('[EngPro] Failed to remove push subscription on logout:', err);
  }

  await db.auth.signOut();
  currentUser    = null;
  currentProfile = null;
  window.location.href = '../index.html';
}

// ── Require any authenticated session ────────────────────────
// Use on pages that just need a login, regardless of role.
async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = '../index.html';
    return;
  }

  currentUser = session.user;
  await loadProfile();

  // Redirect deactivated users back to login
  if (!currentProfile || currentProfile.is_active === false) {
    await db.auth.signOut();
    window.location.href = '../index.html';
  }
}

// ── Require a specific role (or one of several roles) ────────
// Usage: requireRole('admin') or requireRole('admin','lead_engineer')
async function requireRole(...roles) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = '../index.html';
    return;
  }

  currentUser = session.user;
  await loadProfile();

  // No profile or deactivated → back to login
  if (!currentProfile || currentProfile.is_active === false) {
    await db.auth.signOut();
    window.location.href = '../index.html';
    return;
  }

  // Wrong role → redirect to dashboard (not logout)
  if (!roles.includes(currentProfile.role)) {
    window.location.href = 'dashboard.html';
  }
}

// ── Get current JWT access token (for Edge Function calls) ───
async function getAuthToken() {
  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('No active session');
    return session.access_token;
  } catch (err) {
    console.error('[EngPro] getAuthToken error:', err);
    return null;
  }
}
