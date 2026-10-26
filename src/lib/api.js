/**
 * API helpers to interact with the PostgreSQL backend
 */

export async function trackVisit(name) {
  try {
    const res = await fetch('/api/track/visit', {
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
    const res = await fetch('/api/track/save', {
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

export class AdminAuthError extends Error {}

async function adminFetch(path, adminKey) {
  const res = await fetch(path, { headers: { 'X-Admin-Key': adminKey } })
  if (res.status === 401) throw new AdminAuthError('Incorrect admin key')
  if (res.status === 503) throw new AdminAuthError('Admin access is not configured on the server')
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res
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
  link.download = 'secret_premiere_invitation_visitors.csv'
  link.click()
  URL.revokeObjectURL(url)
}
