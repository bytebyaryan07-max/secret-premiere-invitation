import { useEffect, useState } from 'react'
import { Users, Download, RefreshCw, X, Database, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { fetchVisitorStats } from '../lib/api'

export default function AdminDashboard({ isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'saved', 'unsaved'

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchVisitorStats()
      setData(res)
    } catch (err) {
      setError('Could not connect to PostgreSQL server. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const visitors = (data?.visitors || []).filter((v) => {
    const matchesSearch = v.guest_name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'saved') return matchesSearch && v.has_saved
    if (filter === 'unsaved') return matchesSearch && !v.has_saved
    return matchesSearch
  })

  const isPostgres = data?.mode === 'postgres' || data?.dbStatus === 'connected'

  return (
    <div className="admin-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <div className="admin-title-row">
            <div className="admin-badge">
              <Database size={15} />
              <span>{isPostgres ? 'PostgreSQL Live' : 'In-Memory Mode'}</span>
            </div>
            <h2>Visitor & Save Analytics</h2>
          </div>
          <button className="admin-close-btn" onClick={onClose} aria-label="Close dashboard">
            <X size={20} />
          </button>
        </div>

        {/* Status notice */}
        {!isPostgres && (
          <div className="admin-notice">
            <AlertCircle size={16} />
            <span>
              Connected in fallback mode. To persist permanently in PostgreSQL, verify <code>DATABASE_URL</code> in your <code>.env</code> file.
            </span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Visitors</span>
            <span className="stat-value">{data?.stats?.totalVisitors ?? '0'}</span>
            <span className="stat-sub">Seniors who opened card</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Saved Invitations</span>
            <span className="stat-value highlight">{data?.stats?.totalSaved ?? '0'}</span>
            <span className="stat-sub">Downloaded to device</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Save Rate</span>
            <span className="stat-value">{data?.stats?.saveRate ?? '0%'}</span>
            <span className="stat-sub">Conversion of guests</span>
          </div>
        </div>

        {/* Controls: Search, Filter, Export & Refresh */}
        <div className="admin-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by senior name..."
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
              Saved ({data?.stats?.totalSaved || 0})
            </button>
            <button
              className={`filter-btn ${filter === 'unsaved' ? 'active' : ''}`}
              onClick={() => setFilter('unsaved')}
            >
              Viewed Only ({((data?.stats?.totalVisitors || 0) - (data?.stats?.totalSaved || 0))})
            </button>
          </div>

          <div className="action-buttons">
            <button className="action-btn" onClick={loadData} disabled={loading} title="Refresh data">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <a href="/api/admin/export" download className="action-btn export-btn" title="Export CSV spreadsheet">
              <Download size={15} />
              <span>Export CSV</span>
            </a>
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
              <button className="btn small" onClick={loadData}>Retry</button>
            </div>
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
                  <th>Senior / Guest Name</th>
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
                      <strong>{v.guest_name}</strong>
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
                      {v.has_saved ? (
                        <span className="badge badge-saved">
                          <CheckCircle2 size={13} />
                          Saved {v.save_count > 1 ? `(${v.save_count}x)` : ''}
                        </span>
                      ) : (
                        <span className="badge badge-visited">Viewed</span>
                      )}
                    </td>
                    <td className="col-saved-time">
                      {v.saved_at ? new Date(v.saved_at).toLocaleTimeString([], {
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
