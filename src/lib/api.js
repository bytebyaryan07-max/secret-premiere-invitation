/**
 * API helpers to interact with the PostgreSQL backend
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://secret-premiere-api.onrender.com'
).replace(/\/+$/, '')

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, options)
}

export async function trackVisit(name) {
  try {
    const res = await apiFetch('/api/track/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return data?.visitor?.id || null
  } catch (err) {
    console.warn('Could not track visit (offline or server starting):', err.message)
    return null
  }
}

export async function trackSave(visitId, name) {
  try {
    const res = await apiFetch('/api/track/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitId, name })
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('Could not track save action:', err.message)
    return null
  }
}

export class AdminAuthError extends Error { }

async function adminFetch(path, adminKey) {
  const res = await apiFetch(path, {
    headers: { 'X-Admin-Key': adminKey || '' }
  })
  if (res.status === 401) throw new AdminAuthError('Incorrect password. Please try again.')
  if (res.status === 503) throw new AdminAuthError('Admin access is not configured on the server')
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res
}

export async function fetchHealth() {
  const start = performance.now()
  try {
    const res = await apiFetch('/api/health')
    const latency = Math.round(performance.now() - start)
    if (!res.ok) return { connected: false, latency, error: `HTTP ${res.status}` }
    const data = await res.json()
    return { connected: Boolean(data?.db?.connected), latency, data }
  } catch (err) {
    return {
      connected: false,
      latency: Math.round(performance.now() - start),
      error: err.message
    }
  }
}

export async function fetchVisitorStats(adminKey) {
  const res = await adminFetch('/api/admin/visitors', adminKey)
  return await res.json()
}

export async function downloadVisitorsCsv(adminKey) {
  const res = await adminFetch('/api/admin/export', adminKey)
  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `nexora_visitors_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
