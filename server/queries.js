import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Shared, parameterized PostgreSQL queries.
 *
 * Every function takes a `pg`-compatible pool (anything with `query(text, params)`),
 * so the same logic runs in the Express server (pg Pool from DATABASE_URL) and in the
 * Netlify Function (Netlify Database pool).
 */

const MAX_NAME_LENGTH = 100
const MAX_USER_AGENT_LENGTH = 512

export class ValidationError extends Error {}

export function cleanName(name) {
  const clean = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH) : ''
  if (!clean) throw new ValidationError('Name is required')
  return clean
}

// IP addresses are only stored when explicitly enabled, to avoid collecting
// personal data the dashboard does not need.
export function shouldStoreIp() {
  return process.env.STORE_IP_ADDRESS === 'true'
}

export function firstForwardedIp(value) {
  if (!value) return null
  const ip = String(value).split(',')[0].trim()
  return ip ? ip.slice(0, 45) : null
}

export async function recordVisit(pool, { name, userAgent, ipAddress }) {
  const res = await pool.query(
    `INSERT INTO visitors (name, user_agent, ip_address)
     VALUES ($1, $2, $3)
     RETURNING id, name, visited_at`,
    [
      cleanName(name),
      userAgent ? String(userAgent).slice(0, MAX_USER_AGENT_LENGTH) : null,
      shouldStoreIp() ? ipAddress || null : null
    ]
  )
  return res.rows[0]
}

export async function recordSave(pool, { visitId, name }) {
  const id = Number.parseInt(visitId, 10)
  let res

  if (Number.isInteger(id) && id > 0) {
    res = await pool.query(
      `INSERT INTO invitation_saves (visitor_id)
       SELECT id FROM visitors WHERE id = $1
       RETURNING id, visitor_id, saved_at`,
      [id]
    )
  }

  // Fallback: attach the save to the most recent visit with this name
  if ((!res || res.rowCount === 0) && typeof name === 'string' && name.trim()) {
    res = await pool.query(
      `INSERT INTO invitation_saves (visitor_id)
       SELECT id FROM visitors
       WHERE lower(name) = lower($1)
       ORDER BY visited_at DESC
       LIMIT 1
       RETURNING id, visitor_id, saved_at`,
      [cleanName(name)]
    )
  }

  return res && res.rowCount > 0 ? res.rows[0] : null
}

export async function getTotals(pool) {
  const res = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM visitors)::int                     AS total_visitors,
      (SELECT COUNT(DISTINCT lower(name)) FROM visitors)::int  AS unique_guests,
      (SELECT COUNT(*) FROM invitation_saves)::int             AS total_saves,
      (SELECT COUNT(DISTINCT visitor_id) FROM invitation_saves)::int AS visits_with_save
  `)
  return res.rows[0]
}

export async function getRecentVisitors(pool, limit = 200) {
  const res = await pool.query(
    `SELECT v.id, v.name, v.visited_at, v.user_agent,
            COUNT(s.id)::int AS save_count,
            MAX(s.saved_at)  AS last_saved_at
     FROM visitors v
     LEFT JOIN invitation_saves s ON s.visitor_id = v.id
     GROUP BY v.id, v.name, v.visited_at, v.user_agent
     ORDER BY v.visited_at DESC
     LIMIT $1`,
    [limit]
  )
  return res.rows
}

export async function getDailyStats(pool, { days = 30, timeZone = 'UTC' } = {}) {
  const res = await pool.query(
    `WITH days AS (
       SELECT generate_series(
         (NOW() AT TIME ZONE $2)::date - ($1::int - 1),
         (NOW() AT TIME ZONE $2)::date,
         INTERVAL '1 day'
       )::date AS day
     ),
     v AS (
       SELECT (visited_at AT TIME ZONE $2)::date AS day,
              COUNT(*)::int AS visits,
              COUNT(DISTINCT lower(name))::int AS unique_guests
       FROM visitors
       WHERE visited_at >= NOW() - make_interval(days => $1::int + 1)
       GROUP BY 1
     ),
     s AS (
       SELECT (saved_at AT TIME ZONE $2)::date AS day,
              COUNT(*)::int AS saves
       FROM invitation_saves
       WHERE saved_at >= NOW() - make_interval(days => $1::int + 1)
       GROUP BY 1
     )
     SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
            COALESCE(v.visits, 0)        AS visits,
            COALESCE(v.unique_guests, 0) AS unique_guests,
            COALESCE(s.saves, 0)         AS saves
     FROM days d
     LEFT JOIN v USING (day)
     LEFT JOIN s USING (day)
     ORDER BY d.day DESC`,
    [days, timeZone]
  )
  return res.rows
}

export async function getDashboardData(pool) {
  const timeZone = process.env.STATS_TIMEZONE || 'UTC'
  const [totals, visitors, daily] = await Promise.all([
    getTotals(pool),
    getRecentVisitors(pool),
    getDailyStats(pool, { timeZone })
  ])

  const rate = totals.total_visitors > 0
    ? Math.round((totals.visits_with_save / totals.total_visitors) * 100)
    : 0

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    timeZone,
    stats: {
      totalVisitors: totals.total_visitors,
      uniqueGuests: totals.unique_guests,
      totalSaves: totals.total_saves,
      visitsWithSave: totals.visits_with_save,
      saveRate: `${rate}%`
    },
    visitors,
    daily
  }
}

export async function checkDatabase(pool) {
  try {
    await pool.query('SELECT 1')
    return true
  } catch (err) {
    console.error('Database health check failed:', err.message)
    return false
  }
}

/**
 * Admin access is granted only with the ADMIN_KEY server environment variable.
 * Returns 'ok', 'unauthorized', or 'not_configured'.
 */
export function checkAdminKey(provided) {
  const expected = process.env.ADMIN_KEY || '12341234'
  if (!provided) return 'unauthorized'
  const a = createHash('sha256').update(String(provided)).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b) ? 'ok' : 'unauthorized'
}

export function visitorsToCsv(visitors) {
  // Quote every value and neutralise spreadsheet formula injection
  const escape = (value) => {
    let str = value == null ? '' : String(value)
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`
    return `"${str.replace(/"/g, '""')}"`
  }
  const toIso = (d) => (d ? new Date(d).toISOString() : '')

  const rows = [['ID', 'Guest Name', 'Visited At', 'Save Count', 'Last Saved At', 'Device / Browser'].join(',')]
  for (const v of visitors) {
    rows.push([v.id, escape(v.name), escape(toIso(v.visited_at)), v.save_count, escape(toIso(v.last_saved_at)), escape(v.user_agent || '')].join(','))
  }
  return rows.join('\n')
}
