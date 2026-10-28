import { useEffect, useState } from 'react'
import { Users, Download, RefreshCw, X, Database, CheckCircle2, AlertCircle, Search, Lock } from 'lucide-react'
import { fetchVisitorStats, downloadVisitorsCsv, AdminAuthError } from '../lib/api'

const KEY_STORAGE = 'premiere-admin-key'

export default function AdminDashboard({ isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'saved', 'unsaved', 'daily'
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || '')
  const [keyInput, setKeyInput] = useState('')

  const handleError = (err) => {
    if (err instanceof AdminAuthError) {
      sessionStorage.removeItem(KEY_STORAGE)
      setAdminKey('')
      setData(null)
      setError(err.message)
    } else {
      setError('Could not load visitor data from the server. Please try again.')
    }
  }

  const loadData = async (key = admin123) => {
    if (!key) return
    setLoading(true)
    setError('')
    try {
      const res = await fetchVisitorStats(key)
      setData(res)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = async () => {
    try {
      await downloadVisitorsCsv(adminKey)
    } catch (err) {
      handleError(err)
    }
  }

  const submitKey = (e) => {
    e.preventDefault()
    const key = keyInput.trim()
    if (!key) return
    sessionStorage.setItem(KEY_STORAGE, key)
    setAdminKey(key)
    setKeyInput('')
    loadData(key)
  }

  useEffect(() => {
    if (isOpen && adminKey) {
      loadData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const visitors = (data?.visitors || []).filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'saved') return matchesSearch && v.save_count > 0
    if (filter === 'unsaved') return matchesSearch && v.save_count === 0
    return matchesSearch
  })
  const savedCount = (data?.visitors || []).filter((v) => v.save_count > 0).length

  const isPostgres = Boolean(data?.success)

  if (!adminKey) {
    return (
      <div className="admin-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="admin-modal admin-login" onClick={(e) => e.stopPropagation()}>
          <div className="admin-header">
            <div className="admin-title-row">
              <h2>Organizer Access</h2>
            </div>
            <button className="admin-close-btn" onClick={onClose} aria-label="Close dashboard">
              <X size={20} />
            </button>
          </div>
          <form className="admin-key-form" onSubmit={submitKey}>
            <Lock size={22} />
            <p>Enter the admin key to view visitor statistics.</p>
            <div className="search-box">
              <input
                type="password"
                placeholder="Admin key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoFocus
                autoComplete="current-password"
              />
            </div>
            {error && <p className="admin-key-error">{error}</p>}
            <button type="submit" className="action-btn">Unlock dashboard</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <div className="admin-title-row">
            <div className="admin-badge">
              <Database size={15} />
              <span>{isPostgres ? 'PostgreSQL Live' : 'Connecting…'}</span>
            </div>
            <h2>Visitor & Save Analytics</h2>
          </div>
          <button className="admin-close-btn" onClick={onClose} aria-label="Close dashboard">
            <X size={20} />
          </button>
        </div>

        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Visitors</span>
            <span className="stat-value">{data?.stats?.totalVisitors ?? '0'}</span>
            <span className="stat-sub">Visits that unlocked the card</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Unique Guests</span>
            <span className="stat-value">{data?.stats?.uniqueGuests ?? '0'}</span>
            <span className="stat-sub">Distinct names entered</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Saved Invitations</span>
            <span className="stat-value highlight">{data?.stats?.totalSaves ?? '0'}</span>
            <span className="stat-sub">Downloads to device</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Save Rate</span>
            <span className="stat-value">{data?.stats?.saveRate ?? '0%'}</span>
            <span className="stat-sub">Visits that saved the card</span>
          </div>
        </div>

        {/* Controls: Search, Filter, Export & Refresh */}
        <div className="admin-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by guest name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({data?.visitors?.length || 0})
            </button>
            <button
              className={`filter-btn ${filter === 'saved' ? 'active' : ''}`}
              onClick={() => setFilter('saved')}
            >
              Saved ({savedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'unsaved' ? 'active' : ''}`}
              onClick={() => setFilter('unsaved')}
            >
              Viewed Only ({(data?.visitors?.length || 0) - savedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'daily' ? 'active' : ''}`}
              onClick={() => setFilter('daily')}
            >
              Daily
            </button>
          </div>

          <div className="action-buttons">
            <button className="action-btn" onClick={() => loadData()} disabled={loading} title="Refresh data">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="action-btn export-btn" onClick={exportCsv} title="Export CSV spreadsheet">
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="table-container">
          {loading && !data ? (
            <div className="admin-state-msg">
              <RefreshCw size={24} className="spin" />
              <p>Querying PostgreSQL database...</p>
            </div>
          ) : error ? (
            <div className="admin-state-msg error">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button className="btn small" onClick={() => loadData()}>Retry</button>
            </div>
          ) : filter === 'daily' ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date ({data?.timeZone || 'UTC'})</th>
                  <th>Visits</th>
                  <th>Unique Guests</th>
                  <th>Saves</th>
                </tr>
              </thead>
              <tbody>
                {(data?.daily || []).map((d) => (
                  <tr key={d.date}>
                    <td className="col-date">
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>{d.visits}</td>
                    <td>{d.unique_guests}</td>
                    <td>{d.saves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : visitors.length === 0 ? (
            <div className="admin-state-msg">
              <Users size={24} />
              <p>{search ? 'No visitors match your search.' : 'No visitors recorded yet.'}</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest Name</th>
                  <th>Visited At</th>
                  <th>Card Saved?</th>
                  <th>Saved Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, idx) => (
                  <tr key={v.id || idx}>
                    <td className="col-id">{idx + 1}</td>
                    <td className="col-name">
                      <strong>{v.name}</strong>
                    </td>
                    <td className="col-date">
                      {v.visited_at ? new Date(v.visited_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>
                    <td className="col-status">
                      {v.save_count > 0 ? (
                        <span className="badge badge-saved">
                          <CheckCircle2 size={13} />
                          Saved {v.save_count > 1 ? `(${v.save_count}x)` : ''}
                        </span>
                      ) : (
                        <span className="badge badge-visited">Viewed</span>
                      )}
                    </td>
                    <td className="col-saved-time">
                      {v.last_saved_at ? new Date(v.last_saved_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
