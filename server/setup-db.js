/**
 * Creates the tables and indexes in the database at DATABASE_URL, using the same
 * SQL that Netlify applies automatically to Netlify Database on deploy.
 *
 * Only use this for your own local/external PostgreSQL. The deployed Netlify
 * Database is migrated automatically and should not be modified by hand.
 */
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getPool } from './db.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'netlify', 'database', 'migrations')

try {
  const pool = getPool()
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    await pool.query(await readFile(path.join(migrationsDir, file), 'utf8'))
    console.log(`✅ Applied ${file}`)
  }
  await pool.end()
} catch (err) {
  console.error('❌ Database setup failed:', err.message)
  process.exitCode = 1
}
