import { supabase } from '@/services/supabaseClient'
import { apiRequest } from '@/services/apiClient'

/**
 * Email/password auth. The backend talks to Supabase Auth; the browser only stores the
 * returned session so supabase-js can refresh it and `apiClient` can send the access token.
 */

async function storeSession(session) {
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  if (!error) return
  if (error.name === 'AuthRetryableFetchError' || /failed to fetch/i.test(error.message)) {
    // The backend accepted the credentials, but the browser cannot reach Supabase.
    throw new Error(
      `Signed in, but the browser could not reach Supabase at ${process.env.NEXT_PUBLIC_SUPABASE_URL}. ` +
      'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local and frontend/.env ' +
      '(they must match SUPABASE_URL / SUPABASE_ANON_KEY in backend/.env), then restart the dev server.'
    )
  }
  throw error
}

/**
 * @returns {Promise<{user: object, session: object}>}
 */
export async function signInWithEmail({ email, password }) {
  // Empty token: never send a stale session on the login request itself.
  const result = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password }, token: '' })
  await storeSession(result.session)
  return result
}

/**
 * @returns {Promise<{user: object, session: object|null, emailConfirmationRequired: boolean}>}
 */
export async function signUpWithEmail({ name, email, password }) {
  const result = await apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password }, token: '' })
  if (result.session) {
    await storeSession(result.session)
  }
  return result
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
