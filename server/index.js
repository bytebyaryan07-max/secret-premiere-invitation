import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb, recordVisit, recordSave, getVisitorStats, getDbStatus } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Health and DB connection status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: getDbStatus()
  })
})

// Track when someone enters their name and unlocks the invitation
app.post('/api/track/visit', async (req, res) => {
  try {
    const { name } = req.body
    const userAgent = req.headers['user-agent'] || ''
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''

    const result = await recordVisit({ name, userAgent, ipAddress })
    res.json(result)
  } catch (err) {
    console.error('Error tracking visit:', err)
    res.status(500).json({ success: false, error: 'Failed to record visit' })
  }
})

// Track when someone clicks SAVE / Download invitation
app.post('/api/track/save', async (req, res) => {
  try {
    const { visitId, name } = req.body
    const result = await recordSave({ visitId, name })
    res.json(result)
  } catch (err) {
    console.error('Error tracking save:', err)
    res.status(500).json({ success: false, error: 'Failed to record save' })
  }
})

// Get visitor stats and full history for admin check
app.get('/api/admin/visitors', async (req, res) => {
  try {
    const data = await getVisitorStats()
    res.json(data)
  } catch (err) {
    console.error('Error fetching visitor stats:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch visitor stats' })
  }
})

// Export CSV for event organizers
app.get('/api/admin/export', async (req, res) => {
  try {
    const data = await getVisitorStats()
    const rows = [
      ['ID', 'Guest Name', 'Visited At', 'Card Saved?', 'Saved At', 'Save Count'].join(',')
    ]

    for (const v of data.visitors) {
      const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`
      rows.push([
        v.id,
        escape(v.guest_name),
        escape(v.visited_at),
        v.has_saved ? 'YES' : 'NO',
        escape(v.saved_at || 'N/A'),
        v.save_count || 0
      ].join(','))
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="secret_senior_invitation_visitors.csv"')
    res.status(200).send(rows.join('\n'))
  } catch (err) {
    console.error('Error exporting CSV:', err)
    res.status(500).json({ success: false, error: 'Failed to export CSV' })
  }
})

// Start server and initialize PostgreSQL
app.listen(PORT, async () => {
  console.log(`🚀 Invitation Backend Server running on http://localhost:${PORT}`)
  await initDb()
})
