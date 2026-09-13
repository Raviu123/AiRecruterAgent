import { supabase } from '@/services/supabaseClient'

/**
 * HTTP client for the FastAPI backend (see /backend).
 * Attaches the Supabase session token so the backend can identify the user.
 */

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  } catch (err) {
    console.error('Could not read Supabase session:', err)
    return null
  }
}

function formatErrorDetail(detail) {
  if (!detail) return null
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{ loc: [...], msg: "..." }]
  if (Array.isArray(detail)) {
    return detail.map((item) => `${(item.loc || []).slice(1).join('.') || 'request'}: ${item.msg}`).join('; ')
  }
  return JSON.stringify(detail)
}

export async function apiRequest(path, { method = 'GET', body, query, token } = {}) {
  const url = new URL(API_BASE_URL + path)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const accessToken = token ?? (await getAccessToken())
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error(`Network error calling ${method} ${path}:`, err)
    throw new ApiError(`Cannot reach the backend at ${API_BASE_URL}. Is the FastAPI server running?`, 0)
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(formatErrorDetail(data?.detail) || `Request failed with status ${response.status}`, response.status)
  }
  return data
}
