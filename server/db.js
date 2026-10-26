import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

let pool = null
let isPostgresConnected = false
let connectionError = null

// In-memory fallback if PostgreSQL is not yet configured or temporarily offline
const memoryStore = {
  nextId: 1,
  visitors: []
}

export function initDb() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.warn('\n⚠️ [Database Notice]: DATABASE_URL is not set in .env')
    console.warn('ℹ️ Running with in-memory fallback. Visitors and saves will still be tracked in memory.')
    console.warn('ℹ️ Set DATABASE_URL in .env to persist records to PostgreSQL.\n')
    return Promise.resolve(false)
  }

  const isRemote = connectionString.includes('sslmode=require') || 
                   connectionString.includes('neon.tech') || 
                   connectionString.includes('supabase.co') ||
                   connectionString.includes('render.com') ||
                   connectionString.includes('railway.app')

  pool = new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
  })

  return pool.connect()
    .then(async (client) => {
      isPostgresConnected = true
      connectionError = null
      console.log('✅ Connected to PostgreSQL database successfully!')

      // Create table if it does not exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS invitation_visitors (
          id SERIAL PRIMARY KEY,
          guest_name VARCHAR(150) NOT NULL,
          visited_at TIMESTAMPTZ DEFAULT NOW(),
          has_saved BOOLEAN DEFAULT FALSE,
          saved_at TIMESTAMPTZ,
          save_count INTEGER DEFAULT 0,
          user_agent TEXT,
          ip_address VARCHAR(100)
        );

        CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON invitation_visitors(visited_at DESC);
        CREATE INDEX IF NOT EXISTS idx_visitors_name ON invitation_visitors(guest_name);
      `)
      client.release()
      console.log('✅ PostgreSQL table "invitation_visitors" is ready.')
      return true
    })
    .catch((err) => {
      isPostgresConnected = false
      connectionError = err.message
      console.error('\n⚠️ [PostgreSQL Connection Error]:', err.message)
      console.warn('ℹ️ Running in in-memory fallback mode so the invitation website stays fully functional.')
      console.warn('ℹ️ Please verify your PostgreSQL server and DATABASE_URL in .env.\n')
      return false
    })
}

export async function recordVisit({ name, userAgent, ipAddress }) {
  const cleanName = (name || 'Anonymous Guest').trim().slice(0, 150)

  if (isPostgresConnected && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO invitation_visitors (guest_name, user_agent, ip_address)
         VALUES ($1, $2, $3)
         RETURNING id, guest_name, visited_at, has_saved`,
        [cleanName, userAgent || null, ipAddress || null]
      )
      return { success: true, visitor: res.rows[0], mode: 'postgres' }
    } catch (err) {
      console.error('PostgreSQL insert error, using fallback:', err.message)
    }
  }

  // Fallback storage
  const record = {
    id: memoryStore.nextId++,
    guest_name: cleanName,
    visited_at: new Date().toISOString(),
    has_saved: false,
    saved_at: null,
    save_count: 0,
    user_agent: userAgent || null,
    ip_address: ipAddress || null
  }
  memoryStore.visitors.unshift(record)
  return { success: true, visitor: record, mode: 'memory' }
}

export async function recordSave({ visitId, name }) {
  const cleanName = (name || '').trim()

  if (isPostgresConnected && pool) {
    try {
      let res
      if (visitId) {
        res = await pool.query(
          `UPDATE invitation_visitors 
           SET has_saved = TRUE, saved_at = NOW(), save_count = save_count + 1
           WHERE id = $1
           RETURNING *`,
          [visitId]
        )
      }

      if (!res || res.rowCount === 0) {
        // Fallback: update latest visitor matching this name
        res = await pool.query(
          `UPDATE invitation_visitors 
           SET has_saved = TRUE, saved_at = NOW(), save_count = save_count + 1
           WHERE id = (
             SELECT id FROM invitation_visitors 
             WHERE LOWER(guest_name) = LOWER($1) 
             ORDER BY visited_at DESC 
             LIMIT 1
           )
           RETURNING *`,
          [cleanName]
        )
      }

      if (res && res.rowCount > 0) {
        return { success: true, visitor: res.rows[0], mode: 'postgres' }
      }
    } catch (err) {
      console.error('PostgreSQL update error, using fallback:', err.message)
    }
  }

  // Fallback storage update
  let target = memoryStore.visitors.find((v) => v.id === Number(visitId))
  if (!target && cleanName) {
    target = memoryStore.visitors.find((v) => v.guest_name.toLowerCase() === cleanName.toLowerCase())
  }
  if (target) {
    target.has_saved = true
    target.saved_at = new Date().toISOString()
    target.save_count = (target.save_count || 0) + 1
    return { success: true, visitor: target, mode: 'memory' }
  }

  return { success: false, message: 'Visitor record not found', mode: 'memory' }
}

export async function getVisitorStats() {
  if (isPostgresConnected && pool) {
    try {
      const statsRes = await pool.query(`
        SELECT 
          COUNT(*)::int AS total_visitors,
          COUNT(CASE WHEN has_saved THEN 1 END)::int AS total_saved,
          COUNT(DISTINCT LOWER(guest_name))::int AS unique_guests
        FROM invitation_visitors
      `)

      const visitorsRes = await pool.query(`
        SELECT id, guest_name, visited_at, has_saved, saved_at, save_count
        FROM invitation_visitors
        ORDER BY visited_at DESC
        LIMIT 200
      `)

      const total = statsRes.rows[0].total_visitors || 0
      const saved = statsRes.rows[0].total_saved || 0
      const rate = total > 0 ? Math.round((saved / total) * 100) : 0

      return {
        success: true,
        dbStatus: 'connected',
        mode: 'postgres',
        stats: {
          totalVisitors: total,
          totalSaved: saved,
          uniqueGuests: statsRes.rows[0].unique_guests || 0,
          saveRate: `${rate}%`
        },
        visitors: visitorsRes.rows
      }
    } catch (err) {
      console.error('PostgreSQL query error, using fallback:', err.message)
    }
  }

  // Memory fallback stats
  const total = memoryStore.visitors.length
  const saved = memoryStore.visitors.filter((v) => v.has_saved).length
  const unique = new Set(memoryStore.visitors.map((v) => v.guest_name.toLowerCase())).size
  const rate = total > 0 ? Math.round((saved / total) * 100) : 0

  return {
    success: true,
    dbStatus: isPostgresConnected ? 'connected' : 'fallback',
    connectionError,
    mode: 'memory',
    stats: {
      totalVisitors: total,
      totalSaved: saved,
      uniqueGuests: unique,
      saveRate: `${rate}%`
    },
    visitors: memoryStore.visitors.slice(0, 200)
  }
}

export function getDbStatus() {
  return {
    connected: isPostgresConnected,
    mode: isPostgresConnected ? 'postgres' : 'memory',
    error: connectionError
  }
}
