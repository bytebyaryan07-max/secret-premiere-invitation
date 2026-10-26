import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

let pool = null

/**
 * Returns the shared PostgreSQL pool, created from the DATABASE_URL environment
 * variable. Credentials are never hardcoded and never sent to the frontend.
 */
export function getPool() {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file.')
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
    max: 10
  })

  // An idle client error must not crash the server
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message)
  })

  return pool
}

// Verifies the connection and that the schema has been created.
export async function initDb() {
  try {
    const res = await getPool().query(
      `SELECT to_regclass('public.visitors') AS visitors,
              to_regclass('public.invitation_saves') AS saves`
    )
    const { visitors, saves } = res.rows[0]
    if (!visitors || !saves) {
      console.warn('⚠️ Connected to PostgreSQL, but tables are missing. Run: npm run db:setup')
      return false
    }
    console.log('✅ Connected to PostgreSQL. Tables "visitors" and "invitation_saves" are ready.')
    return true
  } catch (err) {
    console.error('⚠️ [PostgreSQL Connection Error]:', err.message)
    return false
  }
}
