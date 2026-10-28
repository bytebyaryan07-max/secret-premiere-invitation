import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Users,
  Eye,
  Download,
  Calendar,
  Clock,
  MapPin,
  Database,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Smartphone,
  Monitor,
  CheckCircle2,
  TrendingUp,
  Key,
  Lock,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Activity,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { fetchVisitorStats, downloadVisitorsCsv, fetchHealth, AdminAuthError } from '../lib/api'
import { EVENT } from '../config/event'

const KEY_STORAGE = 'premiere-admin-key'

function parseDevice(ua) {
  if (!ua) return { type: 'Desktop', os: 'Web', browser: 'Browser', isMobile: false }
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  let browser = 'Browser'
  if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'

  let os = 'Device'
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  return { type: isMobile ? 'Mobile' : 'Desktop', os, browser, isMobile }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function DashboardPanel({ onBack }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'saved' | 'unsaved' | 'today'
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'name' | 'saves'
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [dbHealth, setDbHealth] = useState({ connected: true, latency: null })
  const [lastUpdated, setLastUpdated] = useState(null)

  const timerRef = useRef(null)

  // Ensure document, body, and root overflow are enabled when dashboard is mounted
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const rootEl = document.getElementById('root')
    const prevRootOverflow = rootEl?.style.overflow || ''

    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'
    if (rootEl) rootEl.style.overflow = 'auto'

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      if (rootEl) rootEl.style.overflow = prevRootOverflow
    }
  }, [])

  const loadData = async (silent = false, keyToUse = adminKey) => {
    if (!keyToUse) {
      setIsAuthenticated(false)
      return
    }
    if (!silent) setLoading(true)
    setError('')
    try {
      const [res, health] = await Promise.all([
        fetchVisitorStats(keyToUse),
        fetchHealth()
      ])
      setData(res)
      setDbHealth(health)
      setLastUpdated(new Date())
      setIsAuthenticated(true)
      setAuthError('')
    } catch (err) {
      if (err instanceof AdminAuthError) {
        setIsAuthenticated(false)
        sessionStorage.removeItem(KEY_STORAGE)
        setAdminKey('')
        setAuthError(err.message || 'Incorrect password. Please try again.')
      } else {
        setError('Could not connect to database server. Retrying...')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Attempt auto-login if key is stored in session
  useEffect(() => {
    if (adminKey) {
      loadData(false, adminKey)
    } else {
      setIsAuthenticated(false)
    }
  }, [adminKey])

  // Auto-refresh interval (every 10 seconds if enabled and authenticated)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoRefresh && isAuthenticated && adminKey) {
      timerRef.current = setInterval(() => {
        loadData(true, adminKey)
      }, 10000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoRefresh, isAuthenticated, adminKey])

  const handleUnlock = async (e) => {
    e.preventDefault()
    const entered = passwordInput.trim()
    if (!entered) {
      setAuthError('Please enter the organizer password')
      return
    }
    setSubmitting(true)
    setAuthError('')
    try {
      const res = await fetchVisitorStats(entered)
      const health = await fetchHealth()
      setData(res)
      setDbHealth(health)
      setLastUpdated(new Date())
      setAdminKey(entered)
      sessionStorage.setItem(KEY_STORAGE, entered)
      setIsAuthenticated(true)
      setPasswordInput('')
    } catch (err) {
      setAuthError(err.message || 'Incorrect password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLock = () => {
    sessionStorage.removeItem(KEY_STORAGE)
    setAdminKey('')
    setIsAuthenticated(false)
    setData(null)
    setPasswordInput('')
    setAuthError('')
  }

  const copyInvitationUrl = () => {
    const url = window.location.origin
    navigator.clipboard?.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  const exportCsv = async () => {
    try {
      await downloadVisitorsCsv(adminKey)
    } catch (err) {
      alert(err.message || 'Export failed')
    }
  }

  // Filtered and sorted visitors
  const rawVisitors = data?.visitors || []
  const filteredVisitors = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)

    let list = rawVisitors.filter((v) => {
      const matchSearch = v.name.toLowerCase().includes(search.toLowerCase())
      if (!matchSearch) return false

      if (filter === 'saved') return v.save_count > 0
      if (filter === 'unsaved') return v.save_count === 0
      if (filter === 'today') {
        const vDate = v.visited_at ? new Date(v.visited_at).toISOString().slice(0, 10) : ''
        return vDate === todayStr
      }
      return true
    })

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'saves') return (b.save_count || 0) - (a.save_count || 0)
      // default: recent
      return new Date(b.visited_at || 0) - new Date(a.visited_at || 0)
    })

    return list
  }, [rawVisitors, search, filter, sortBy])

  // Aggregated analytics
  const totalVisitors = data?.stats?.totalVisitors ?? rawVisitors.length
  const uniqueGuests = data?.stats?.uniqueGuests ?? new Set(rawVisitors.map((v) => v.name.toLowerCase())).size
  const totalSaves = data?.stats?.totalSaves ?? rawVisitors.reduce((acc, v) => acc + (v.save_count || 0), 0)
  const savedCount = rawVisitors.filter((v) => v.save_count > 0).length
  const saveRate = data?.stats?.saveRate || (totalVisitors > 0 ? `${Math.round((savedCount / totalVisitors) * 100)}%` : '0%')

  // Device breakdown
  const deviceStats = useMemo(() => {
    let mobile = 0
    let desktop = 0
    rawVisitors.forEach((v) => {
      const { isMobile } = parseDevice(v.user_agent)
      if (isMobile) mobile++
      else desktop++
    })
    const total = mobile + desktop || 1
    return {
      mobile,
      desktop,
      mobilePct: Math.round((mobile / total) * 100),
      desktopPct: Math.round((desktop / total) * 100)
    }
  }, [rawVisitors])

  // Daily stats for mini-chart
  const dailyStats = useMemo(() => {
    const list = data?.daily || []
    return list.slice(0, 7).reverse()
  }, [data?.daily])

  const maxDailyVisits = useMemo(() => {
    const max = Math.max(...dailyStats.map((d) => d.visits || 0), 1)
    return max
  }, [dailyStats])

  // If NOT authenticated, render the Password Unlock Screen
  if (!isAuthenticated) {
    return (
      <div className="dp-page dp-auth-page">
        <div className="dp-auth-box">
          <div className="dp-lock-circle">
            <Lock size={26} className="dp-gold-icon" />
          </div>
          <div className="dp-auth-header">
            <h2>Organizer Access</h2>
            <p className="dp-auth-desc">Enter the password to view NEXORA guest analytics and visitor tracking.</p>
          </div>

          <form onSubmit={handleUnlock} className="dp-auth-form">
            <div className="dp-auth-input-wrap">
              <Key size={16} className="dp-auth-icon" />
              <input
                type="password"
                placeholder="Enter password (12341234)"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  setAuthError('')
                }}
                autoFocus
                className="dp-auth-input"
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <div className="dp-auth-error">
                <AlertCircle size={15} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="dp-btn dp-btn-primary dp-btn-full" disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw size={15} className="dp-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Unlock Dashboard</span>
                </>
              )}
            </button>
          </form>

          {onBack && (
            <button className="dp-btn dp-btn-ghost dp-auth-back" onClick={onBack}>
              <ArrowLeft size={14} />
              <span>Back to Invitation</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Authenticated Dashboard View
  return (
    <div className="dp-page">
      {/* Top Navigation & Status Bar */}
      <header className="dp-header">
        <div className="dp-header-left">
          {onBack && (
            <button className="dp-btn dp-btn-ghost" onClick={onBack} title="Back to Invitation">
              <ArrowLeft size={16} />
              <span>Back to Invitation</span>
            </button>
          )}
          <div className="dp-title-block">
            <div className="dp-brand">
              <Sparkles size={18} className="dp-gold-icon" />
              <h1>Organizer Dashboard</h1>
            </div>
            <p className="dp-subtitle">Real-time Guest Tracker & Invitation Analytics • NEXORA</p>
          </div>
        </div>

        <div className="dp-header-right">
          {/* PostgreSQL Connection Pill */}
          <div className={`dp-status-pill ${dbHealth.connected ? 'dp-status-online' : 'dp-status-offline'}`}
            title={`Database: ${dbHealth.connected ? 'PostgreSQL Active' : 'Offline'} (${dbHealth.latency ?? 0}ms)`}>
            <span className="dp-pulse-dot" />
            <Database size={13} />
            <span>{dbHealth.connected ? 'PostgreSQL Live' : 'Database Offline'}</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            className={`dp-btn dp-btn-compact ${autoRefresh ? 'dp-btn-active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Auto-refresh visitor data every 10 seconds"
          >
            <Activity size={14} className={autoRefresh ? 'dp-spin-pulse' : ''} />
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            className="dp-btn dp-btn-compact"
            onClick={() => loadData()}
            disabled={loading}
            title="Refresh now"
          >
            <RefreshCw size={14} className={loading ? 'dp-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export CSV */}
          <button className="dp-btn dp-btn-primary" onClick={exportCsv} title="Download CSV Spreadsheet of Guests">
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Copy Link */}
          <button className="dp-btn dp-btn-secondary" onClick={copyInvitationUrl} title="Copy Public Invitation URL">
            {copiedLink ? <Check size={14} className="dp-text-success" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}</span>
          </button>

          {/* Lock Dashboard */}
          <button
            className="dp-btn dp-btn-ghost dp-btn-compact"
            onClick={handleLock}
            title="Lock Dashboard"
          >
            <Lock size={14} />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="dp-error-banner">
          <AlertCircle size={18} />
          <p>{error}</p>
          <button className="dp-btn dp-btn-compact" onClick={() => loadData()}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="dp-content">
        {/* Metric Cards Row */}
        <section className="dp-metrics-grid">
          <div className="dp-metric-card">
            <div className="dp-metric-header">
              <span className="dp-metric-label">Total Visits</span>
              <div className="dp-metric-icon-wrap dp-icon-amber">
                <Eye size={18} />
              </div>
            </div>
            <div className="dp-metric-number">{totalVisitors}</div>
            <p className="dp-metric-sub">Total card unlocks & sessions</p>
          </div>

          <div className="dp-metric-card">
            <div className="dp-metric-header">
              <span className="dp-metric-label">Unique Guests</span>
              <div className="dp-metric-icon-wrap dp-icon-gold">
                <Users size={18} />
              </div>
            </div>
            <div className="dp-metric-number dp-gold-text">{uniqueGuests}</div>
            <p className="dp-metric-sub">Distinct senior guest names</p>
          </div>

          <div className="dp-metric-card">
            <div className="dp-metric-header">
              <span className="dp-metric-label">Cards Saved</span>
              <div className="dp-metric-icon-wrap dp-icon-emerald">
                <Download size={18} />
              </div>
            </div>
            <div className="dp-metric-number dp-emerald-text">{totalSaves}</div>
            <p className="dp-metric-sub">{savedCount} distinct guests downloaded card</p>
          </div>

          <div className="dp-metric-card">
            <div className="dp-metric-header">
              <span className="dp-metric-label">Save Rate</span>
              <div className="dp-metric-icon-wrap dp-icon-blue">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="dp-metric-number">{saveRate}</div>
            <p className="dp-metric-sub">Percentage of visits saved to device</p>
          </div>

          <div className="dp-metric-card dp-event-mini-card">
            <div className="dp-metric-header">
              <span className="dp-metric-label">Event Target</span>
              <div className="dp-metric-icon-wrap dp-icon-purple">
                <Calendar size={18} />
              </div>
            </div>
            <div className="dp-event-mini-title">{EVENT.name || 'NEXORA'}</div>
            <div className="dp-event-mini-details">
              <span><Clock size={12} /> {EVENT.date} • {EVENT.time}</span>
              <span><MapPin size={12} /> {EVENT.venue}</span>
            </div>
          </div>
        </section>

        {/* Analytics & Insights 2-Column Section */}
        <section className="dp-insights-grid">
          {/* Daily Activity Visual Bar Chart */}
          <div className="dp-panel-card">
            <div className="dp-panel-header">
              <div className="dp-panel-title">
                <BarChart3 size={16} className="dp-gold-icon" />
                <h3>Recent Daily Activity</h3>
              </div>
              <span className="dp-panel-hint">Last 7 Active Days</span>
            </div>

            {dailyStats.length === 0 ? (
              <div className="dp-empty-chart">
                <Activity size={24} />
                <p>No daily history recorded yet. Open the invitation to generate activity!</p>
              </div>
            ) : (
              <div className="dp-chart-wrapper">
                <div className="dp-chart-bars">
                  {dailyStats.map((d) => {
                    const heightPct = Math.max(12, Math.round((d.visits / maxDailyVisits) * 100))
                    const saveHeightPct = d.visits > 0 ? Math.round((d.saves / d.visits) * 100) : 0
                    const formattedDate = new Date(`${d.date}T00:00:00`).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })

                    return (
                      <div className="dp-chart-col" key={d.date} title={`${formattedDate}: ${d.visits} visits, ${d.unique_guests} unique, ${d.saves} saves`}>
                        <div className="dp-bar-track">
                          <div className="dp-bar-fill" style={{ height: `${heightPct}%` }}>
                            {d.saves > 0 && (
                              <div
                                className="dp-bar-save-fill"
                                style={{ height: `${saveHeightPct}%` }}
                                title={`${d.saves} saves`}
                              />
                            )}
                          </div>
                        </div>
                        <span className="dp-chart-count">{d.visits}</span>
                        <span className="dp-chart-label">
                          {new Date(`${d.date}T00:00:00`).toLocaleDateString([], { weekday: 'narrow', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="dp-chart-legend">
                  <span className="dp-legend-item"><span className="dp-legend-dot dp-dot-visits" /> Total Visits</span>
                  <span className="dp-legend-item"><span className="dp-legend-dot dp-dot-saves" /> Saved Invitations</span>
                </div>
              </div>
            )}
          </div>

          {/* Device & Platform Distribution */}
          <div className="dp-panel-card">
            <div className="dp-panel-header">
              <div className="dp-panel-title">
                <Smartphone size={16} className="dp-gold-icon" />
                <h3>Device & Audience Breakdown</h3>
              </div>
              <span className="dp-panel-hint">Guest platforms</span>
            </div>

            <div className="dp-device-breakdown">
              <div className="dp-device-row">
                <div className="dp-device-info">
                  <div className="dp-device-icon"><Smartphone size={16} /></div>
                  <div>
                    <div className="dp-device-name">Mobile Devices</div>
                    <div className="dp-device-count">{deviceStats.mobile} guests</div>
                  </div>
                </div>
                <div className="dp-device-meter-wrap">
                  <div className="dp-device-bar">
                    <div className="dp-device-progress dp-bg-amber" style={{ width: `${deviceStats.mobilePct}%` }} />
                  </div>
                  <span className="dp-device-pct">{deviceStats.mobilePct}%</span>
                </div>
              </div>

              <div className="dp-device-row">
                <div className="dp-device-info">
                  <div className="dp-device-icon"><Monitor size={16} /></div>
                  <div>
                    <div className="dp-device-name">Desktop / Laptop</div>
                    <div className="dp-device-count">{deviceStats.desktop} guests</div>
                  </div>
                </div>
                <div className="dp-device-meter-wrap">
                  <div className="dp-device-bar">
                    <div className="dp-device-progress dp-bg-blue" style={{ width: `${deviceStats.desktopPct}%` }} />
                  </div>
                  <span className="dp-device-pct">{deviceStats.desktopPct}%</span>
                </div>
              </div>

              <div className="dp-audience-highlight">
                <div className="dp-highlight-pill">
                  <CheckCircle2 size={14} className="dp-text-success" />
                  <span>Configured for: <strong>{EVENT.audience}</strong></span>
                </div>
                <p className="dp-closing-quote">
                  "{EVENT.closing?.[0] || 'SOME MEMORIES ARE PLANNED.'} {EVENT.closing?.[1] || 'OTHERS BECOME LEGENDARY.'}"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visitors Explorer Table Section */}
        <section className="dp-panel-card dp-table-panel">
          <div className="dp-table-header-row">
            <div>
              <h2 className="dp-table-title">Guest Directory & Visitor Log</h2>
              <p className="dp-table-subtitle">
                Showing {filteredVisitors.length} of {rawVisitors.length} recorded visitors
                {lastUpdated && ` • Updated ${formatRelativeTime(lastUpdated)}`}
              </p>
            </div>

            <div className="dp-table-controls">
              {/* Search Box */}
              <div className="dp-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search guest name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dp-search-input"
                />
                {search && (
                  <button className="dp-clear-btn" onClick={() => setSearch('')}>×</button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="dp-filter-tabs">
                <button
                  className={`dp-tab ${filter === 'all' ? 'dp-tab-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({rawVisitors.length})
                </button>
                <button
                  className={`dp-tab ${filter === 'saved' ? 'dp-tab-active' : ''}`}
                  onClick={() => setFilter('saved')}
                >
                  Saved ({savedCount})
                </button>
                <button
                  className={`dp-tab ${filter === 'unsaved' ? 'dp-tab-active' : ''}`}
                  onClick={() => setFilter('unsaved')}
                >
                  Viewed Only ({rawVisitors.length - savedCount})
                </button>
                <button
                  className={`dp-tab ${filter === 'today' ? 'dp-tab-active' : ''}`}
                  onClick={() => setFilter('today')}
                >
                  Today
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="dp-sort-select-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dp-select"
                >
                  <option value="recent">Sort: Most Recent</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="saves">Sort: Most Saves</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="dp-table-wrap">
            {loading && rawVisitors.length === 0 ? (
              <div className="dp-state-msg">
                <RefreshCw size={28} className="dp-spin dp-gold-icon" />
                <p>Loading guest records from PostgreSQL database...</p>
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="dp-state-msg">
                <Users size={32} className="dp-gold-icon" />
                <h4>No visitors found</h4>
                <p>{search ? `No guests matching "${search}".` : 'No visitor records match this filter.'}</p>
                {search && (
                  <button className="dp-btn dp-btn-compact dp-btn-ghost" onClick={() => setSearch('')}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <table className="dp-table">
                <thead>
                  <tr>
                    <th className="dp-col-idx">#</th>
                    <th className="dp-col-guest">Guest Name</th>
                    <th className="dp-col-device">Device / Browser</th>
                    <th className="dp-col-time">Visited At</th>
                    <th className="dp-col-status">Card Status</th>
                    <th className="dp-col-saves">Saves</th>
                    <th className="dp-col-lastsave">Last Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((v, idx) => {
                    const dev = parseDevice(v.user_agent)
                    const hasSaved = (v.save_count || 0) > 0

                    return (
                      <tr key={v.id || idx} className="dp-row">
                        <td className="dp-col-idx">{idx + 1}</td>
                        <td className="dp-col-guest">
                          <div className="dp-guest-cell">
                            <div className="dp-avatar">
                              {v.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="dp-guest-name">{v.name}</span>
                          </div>
                        </td>
                        <td className="dp-col-device">
                          <span className="dp-device-badge" title={v.user_agent || 'Unknown device'}>
                            {dev.isMobile ? <Smartphone size={12} /> : <Monitor size={12} />}
                            <span>{dev.os} • {dev.browser}</span>
                          </span>
                        </td>
                        <td className="dp-col-time">
                          <div className="dp-time-cell">
                            <span className="dp-time-rel">{formatRelativeTime(v.visited_at)}</span>
                            <span className="dp-time-abs">
                              {v.visited_at ? new Date(v.visited_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="dp-col-status">
                          {hasSaved ? (
                            <span className="dp-badge dp-badge-saved">
                              <CheckCircle2 size={13} />
                              Saved Card
                            </span>
                          ) : (
                            <span className="dp-badge dp-badge-viewed">
                              <Eye size={13} />
                              Viewed Card
                            </span>
                          )}
                        </td>
                        <td className="dp-col-saves">
                          <span className={`dp-save-count ${hasSaved ? 'dp-save-positive' : ''}`}>
                            {v.save_count || 0}
                          </span>
                        </td>
                        <td className="dp-col-lastsave">
                          <span className="dp-subtle-text">
                            {v.last_saved_at ? new Date(v.last_saved_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
