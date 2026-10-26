import { getDatabase } from '@netlify/database'
import {
  ValidationError,
  recordVisit,
  recordSave,
  getDashboardData,
  getRecentVisitors,
  checkDatabase,
  checkAdminKey,
  visitorsToCsv
} from '../../server/queries.js'

// Production version of the Express routes in server/index.js, backed by Netlify Database.
const json = (body, status = 200) => Response.json(body, { status })

async function readJson(req) {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

function adminError(req) {
  const result = checkAdminKey(req.headers.get('x-admin-key'))
  if (result === 'ok') return null
  if (result === 'not_configured') return json({ success: false, error: 'Admin access is not configured' }, 503)
  return json({ success: false, error: 'Unauthorized' }, 401)
}

export default async (req, context) => {
  const route = `${req.method} ${new URL(req.url).pathname.replace(/\/+$/, '')}`

  try {
    const { pool } = getDatabase()

    switch (route) {
      case 'GET /api/health':
        return json({ status: 'ok', timestamp: new Date().toISOString(), db: { connected: await checkDatabase(pool) } })

      case 'POST /api/track/visit': {
        const body = await readJson(req)
        const visitor = await recordVisit(pool, {
          name: body.name,
          userAgent: req.headers.get('user-agent'),
          ipAddress: context.ip
        })
        return json({ success: true, visitor }, 201)
      }

      case 'POST /api/track/save': {
        const body = await readJson(req)
        const save = await recordSave(pool, { visitId: body.visitId, name: body.name })
        if (!save) return json({ success: false, error: 'Visitor record not found' }, 404)
        return json({ success: true, save }, 201)
      }

      case 'GET /api/admin/visitors':
        return adminError(req) || json(await getDashboardData(pool))

      case 'GET /api/admin/export': {
        const denied = adminError(req)
        if (denied) return denied
        const visitors = await getRecentVisitors(pool, 10000)
        return new Response(visitorsToCsv(visitors), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="secret_premiere_invitation_visitors.csv"',
            'Cache-Control': 'no-store'
          }
        })
      }

      default:
        return json({ success: false, error: 'Not found' }, 404)
    }
  } catch (err) {
    if (err instanceof ValidationError) return json({ success: false, error: err.message }, 400)
    console.error(`Error handling ${route}:`, err.message)
    return json({ success: false, error: 'Server error' }, 500)
  }
}

export const config = {
  path: '/api/*'
}
