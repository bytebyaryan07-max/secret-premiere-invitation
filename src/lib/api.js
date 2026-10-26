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

export async function fetchVisitorStats() {
  try {
    const res = await fetch('/api/admin/visitors')
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch visitor stats:', err)
    throw err
  }
}
