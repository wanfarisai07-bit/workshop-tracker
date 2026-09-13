import { supabase } from '../api/supabaseClient';

/**
 * This app has exactly one shared staff account — every desktop and mobile
 * device signs in as the same Supabase Auth user, so any number of people
 * can be "logged in" at once with no per-seat accounts to manage and no
 * conflict between sessions (each browser/device keeps its own independent
 * session token).
 *
 * Supabase Auth's password sign-in needs an email, not a bare username, so
 * the "Staff ID" the login screen shows is checked against this fixed value
 * and mapped to one fixed internal email under the hood. Everything else —
 * the actual password check, session persistence across reloads, and
 * sign-out — is real Supabase Auth, not a demo shortcut. The password
 * itself is never stored in this codebase; only Supabase (server-side)
 * knows it.
 */
export const SHARED_STAFF_ID = 'sasbworkshop';
const SHARED_EMAIL = 'sasbworkshop@sasbworkshop.internal';

/** Returns an error message on failure, or null on success. */
export async function signIn(staffId: string, password: string): Promise<string | null> {
  if (staffId.trim().toLowerCase() !== SHARED_STAFF_ID) {
    return 'Invalid Staff ID or password.';
  }
  const { error } = await supabase.auth.signInWithPassword({ email: SHARED_EMAIL, password });
  return error ? 'Invalid Staff ID or password.' : null;
}

export async function signOut(): Promise<void> {
  // `scope: 'local'` is essential here, not cosmetic: supabase-js's default
  // scope is 'global', which revokes the refresh token for every device
  // signed in as this account. Since every staff member shares this one
  // account, a default-scope sign-out would log everyone else out too the
  // moment anyone hit "Sign out" — 'local' only clears *this* browser's
  // session, leaving every other device's session untouched.
  await supabase.auth.signOut({ scope: 'local' });
}
