import { Volume2, VolumeX, BarChart2, Sparkles, Moon } from 'lucide-react'
import { EVENT } from '../config/event'

/**
 * HalloweenHeader
 * Dark glass-like navigation header with glowing orange borders on hover,
 * prominent NEXORA branding, Halloween emojis (🎃, 👻, 🦇, 🌙),
 * sound toggle, and Organizer Access dashboard trigger. Fully mobile responsive.
 */
export default function HalloweenHeader({
  sound,
  onToggleSound,
  onOpenDashboard,
  scene
}) {
  return (
    <header className="hw-header" role="banner">
      <div className="hw-header-inner">
        {/* Left: Prominent NEXORA Branding */}
        <div className="hw-brand" title="NEXORA — Secret Halloween Premiere">
          <span className="hw-brand-icon" aria-hidden="true">🦇</span>
          <span className="hw-brand-title">{EVENT.name || 'NEXORA'}</span>
          <span className="hw-brand-pill">
            <span className="hw-dot-pulse" aria-hidden="true">🎃</span>
            <span className="hw-pill-label">Secret Premiere</span>
          </span>
        </div>

        {/* Center: Event Key Timing Indicator (Desktop) */}
        <div className="hw-header-center" aria-label="Event date and time">
          <span className="hw-event-badge">
            <Moon size={13} className="text-amber" />
            <span>01 Nov 2026</span>
            <span className="hw-badge-sep">•</span>
            <span>9:00 AM</span>
          </span>
        </div>

        {/* Right: Sound Toggle & Organizer Access Dashboard */}
        <div className="hw-header-actions">
          {/* Eerie Sound Toggle Button */}
          <button
            type="button"
            className={`hw-nav-btn hw-sound-btn ${sound ? 'is-active' : ''}`}
            onClick={onToggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Mute atmospheric sound' : 'Unmute atmospheric sound'}
            title={sound ? 'Mute eerie sound 👻' : 'Enable spooky soundtrack 🎃'}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hw-btn-text">{sound ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Organizer Access Dashboard Button */}
          <button
            type="button"
            className="hw-nav-btn hw-admin-btn"
            onClick={onOpenDashboard}
            aria-label="Organizer Access Dashboard"
            title="Open Organizer Analytics & Visitor Dashboard 🗝️"
          >
            <BarChart2 size={15} />
            <span className="hw-btn-text">Organizer</span>
            <span className="hw-badge-key">🗝️</span>
          </button>
        </div>
      </div>
    </header>
  )
}
