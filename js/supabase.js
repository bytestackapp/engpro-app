// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL    = 'https://dtjsgvajdgqjlindbhxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anNndmFqZGdxamxpbmRiaHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMzNjQsImV4cCI6MjA5NjAxOTM2NH0.tCNEjswwgKONyiEcdfgZ_TJczofQZcvmPIh7uNS7D_U';
window.__SUPABASE_URL__ = SUPABASE_URL;

// The CDN (jsdelivr) already occupies the name "supabase" as a module object.
// We use "db" as our client instance name throughout the app.
// Custom auth storage: writes to localStorage (persists across browser restarts)
// if "Remember me" was checked, otherwise sessionStorage (cleared on tab/browser close).
// The preference itself lives in localStorage since it's just a flag, not the session.
const _authStorage = {
  getItem: (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key, value) => {
    const remember = localStorage.getItem('engpro_remember') === '1';
    if (remember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: _authStorage, persistSession: true, autoRefreshToken: true },
});

// Called by the login page right before signIn(), based on the checkbox state.
function setRememberPreference(remember) {
  localStorage.setItem('engpro_remember', remember ? '1' : '0');
}

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
      role:      null,
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

// ── Look up email for a given username ───────────────────────
// Supabase Auth only signs in by email, so username-based login
// resolves the email first via a SECURITY DEFINER RPC function
// (see get_email_by_username in the SQL setup notes). This avoids
// exposing the full `users` table to anonymous/unauthenticated calls.
async function getEmailForUsername(username) {
  const { data, error } = await db.rpc('get_email_by_username', {
    p_username: username,
  });

  if (error || !data) {
    // Deliberately vague — don't reveal whether the username exists
    throw new Error('Invalid username or password.');
  }

  return data;
}

// ── Sign in + active-account check ──────────────────────────
async function signIn(username, password) {
  const email = await getEmailForUsername(username);

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Invalid username or password.');

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

  invalidateAllCache();
  sessionStorage.removeItem('engpro_push_saved');
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
