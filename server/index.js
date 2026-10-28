import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getPool, initDb } from './db.js'
import {
  ValidationError,
  recordVisit,
  recordSave,
  getDashboardData,
  getRecentVisitors,
  checkDatabase,
  checkAdminKey,
  firstForwardedIp,
  visitorsToCsv
} from './queries.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '10kb' }))

// Health and DB connection status (no connection details are exposed)
app.get('/api/health', async (req, res) => {
  let connected = false
  try {
    connected = await checkDatabase(getPool())
  } catch {
    connected = false
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: { connected } })
})

// Track when someone enters their name and unlocks the invitation
app.post('/api/track/visit', async (req, res) => {
  try {
    const visitor = await recordVisit(getPool(), {
      name: req.body?.name,
      userAgent: req.headers['user-agent'],
      ipAddress: firstForwardedIp(req.headers['x-forwarded-for']) || req.socket?.remoteAddress
    })
    res.status(201).json({ success: true, visitor })
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ success: false, error: err.message })
    }
    console.error('Error tracking visit:', err.message)
    res.status(500).json({ success: false, error: 'Failed to record visit' })
  }
})

// Track when someone clicks SAVE / Download invitation
app.post('/api/track/save', async (req, res) => {
  try {
    const save = await recordSave(getPool(), { visitId: req.body?.visitId, name: req.body?.name })
    if (!save) return res.status(404).json({ success: false, error: 'Visitor record not found' })
    res.status(201).json({ success: true, save })
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ success: false, error: err.message })
    }
    console.error('Error tracking save:', err.message)
    res.status(500).json({ success: false, error: 'Failed to record save' })
  }
})

// Admin routes require the ADMIN_KEY in the X-Admin-Key header
function requireAdmin(req, res, next) {
  const result = checkAdminKey(req.get('x-admin-key'))
  if (result === 'ok') return next()
  if (result === 'not_configured') {
    return res.status(503).json({ success: false, error: 'Admin access is not configured' })
  }
  res.status(401).json({ success: false, error: 'Unauthorized' })
}

// Visitor totals, recent visitors and daily statistics for the admin dashboard
app.get('/api/admin/visitors', requireAdmin, async (req, res) => {
  try {
    res.json(await getDashboardData(getPool()))
  } catch (err) {
    console.error('Error fetching visitor stats:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch visitor stats' })
  }
})

// Export CSV for event organizers
app.get('/api/admin/export', requireAdmin, async (req, res) => {
  try {
    const visitors = await getRecentVisitors(getPool(), 10000)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="nexora_invitation_visitors.csv"')
    res.status(200).send(visitorsToCsv(visitors))
  } catch (err) {
    console.error('Error exporting CSV:', err.message)
    res.status(500).json({ success: false, error: 'Failed to export CSV' })
  }
})

// Start server and verify the PostgreSQL connection
app.listen(PORT, async () => {
  console.log(`🚀 Invitation Backend Server running on http://localhost:${PORT}`)
  await initDb()
})
