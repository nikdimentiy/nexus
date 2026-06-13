/**
 * views/vanguard.js — VANGUARD strategic analytics view.
 * Exports init(container, user) → destroy fn.
 */

import { saveCloudKey as _saveCloudKey } from '../appwrite-sync.js'

const TEMPLATE = /* html */ `
<div class="app-layout">
  <aside class="sidebar" id="app-sidebar">
    <div class="brand">
      <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
      <div class="brand-text">
        <h1>VANGUARD</h1>
        <div class="brand-tagline">&gt; apex command interface</div>
      </div>
    </div>

    <div class="sidebar-inner">
      <div class="sidebar-section">
        <div class="widget-grid">
          <div class="widget-box">
            <div class="widget-label">Today's Score</div>
            <div class="widget-value" id="disp-pts">0.0</div>
          </div>
          <div class="widget-box">
            <div class="widget-label">Year Progress</div>
            <div class="widget-value"><span id="disp-pct">0</span>%</div>
            <div class="widget-sub">Day <span id="disp-day">0</span></div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">Daily Input</div>
        <div class="control-group">
          <label for="inp-date">Reference Date</label>
          <input type="date" id="inp-date" aria-label="Reference date for daily log" />
        </div>
        <div class="control-group">
          <label for="inp-note">Daily Note</label>
          <textarea id="inp-note" maxlength="200" placeholder="skipped gym, knee pain · 3.5h focus, productive…" aria-describedby="note-char-count"></textarea>
          <div class="note-char-count" id="note-char-count">0 / 200</div>
        </div>
        <div class="control-group">
          <label>Energy Level</label>
          <div class="energy-group" role="group" aria-label="Energy level selection">
            <button class="energy-btn" id="btn-energy-low"    data-energy="low"    aria-pressed="false">↓ Low</button>
            <button class="energy-btn" id="btn-energy-medium" data-energy="medium" aria-pressed="false">◆ Med</button>
            <button class="energy-btn" id="btn-energy-high"   data-energy="high"   aria-pressed="false">↑ High</button>
          </div>
        </div>
        <div class="control-group">
          <label>Deep Caliber Work (hours)</label>
          <input type="number" id="inp-deep-focus" min="0" step="0.5" placeholder="0.0" />
        </div>
        <div class="control-group">
          <button id="btn-early-wake" class="btn-toggle">
            <i class="fa-regular fa-clock"></i> Early Wake Up
          </button>
        </div>
        <div class="control-group">
          <button id="btn-planning" class="btn-toggle">
            <i class="fa-solid fa-calendar-plus"></i> Planning
          </button>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">Insights</div>
        <div class="stat-row"><span class="stat-label">Best Day</span><span class="stat-val" id="disp-best-day" style="color:var(--cyan)">—</span></div>
        <div class="stat-row"><span class="stat-label">Top Streak</span><span class="stat-val" id="lbl-best" style="color:var(--green)">—</span></div>
        <div class="stat-row"><span class="stat-label">Needs Focus</span><span class="stat-val" id="lbl-worst" style="color:var(--rose)">—</span></div>
        <div class="stat-row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-1);">
          <span class="stat-label"><span class="energy-corr-dot" style="background:var(--green)"></span>High Energy</span>
          <span class="stat-val" id="energy-corr-high" style="color:var(--green)">—</span>
        </div>
        <div class="stat-row"><span class="stat-label"><span class="energy-corr-dot" style="background:var(--gold)"></span>Med Energy</span><span class="stat-val" id="energy-corr-med" style="color:var(--gold)">—</span></div>
        <div class="stat-row"><span class="stat-label"><span class="energy-corr-dot" style="background:var(--rose)"></span>Low Energy</span><span class="stat-val" id="energy-corr-low" style="color:var(--rose)">—</span></div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">Cycle Goal</div>
        <div class="cycle-goal-range" id="goal-cycle-label">—</div>
        <div class="control-group">
          <textarea id="inp-cycle-goal" maxlength="150" placeholder="What must this cycle achieve?" aria-label="Cycle goal" aria-describedby="goal-char-count"></textarea>
          <div class="note-char-count" id="goal-char-count">0 / 150</div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">Plan Adherence</div>
        <div class="control-group">
          <button id="btn-on-track" class="btn-toggle"><i class="fa-solid fa-route"></i> On Track?</button>
        </div>
        <div class="mission-ring-wrap" id="mission-ring-widget">
          <div class="mission-ring-label">Today's Missions</div>
          <div class="mission-ring-svg-wrap">
            <svg class="mission-ring-svg" viewBox="0 0 120 120" id="ring-svg"></svg>
          </div>
          <div class="ring-bars" id="ring-bars"></div>
        </div>
      </div>
    </div>
  </aside>

  <main class="main-content">
    <div class="topbar">
      <div class="cycle-info">
        <div class="cycle-header-row">
          <button id="btn-toggle-sidebar" title="Toggle sidebar"><i class="fa-solid fa-bars"></i></button>
          <div class="cycle-meta">
            <h2 id="cycle-label">Cycle Period</h2>
            <p id="cycle-range">— to —</p>
          </div>
          <div class="cycle-nav">
            <button class="nav-btn" id="btn-prev"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="nav-btn text-btn" id="btn-today">Today</button>
            <button class="nav-btn" id="btn-next"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <span class="week-number-badge current-week" id="current-week-label" title="Current Week Number (week starts from Sunday)">Week --</span>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div class="week-widget">
          <div class="week-widget-head" id="week-widget-label">Week</div>
          <div class="week-cells" id="week-cells"></div>
        </div>
        <button id="btn-toggle-theme" class="btn"><i class="fa-solid fa-bolt"></i> Cyber</button>
        <button id="btn-show-shortcuts" class="btn" title="Keyboard Shortcuts"><i class="fa-solid fa-keyboard"></i> Shortcuts</button>
        <button id="btn-toggle-widgets" class="btn"><i class="fa-solid fa-eye-slash"></i> Hide</button>
        <a href="#" class="btn" style="text-decoration:none;display:flex;align-items:center;gap:6px;"><i class="fas fa-atom"></i> Nexus</a>
      </div>
    </div>

    <div class="csc-wrap" id="cycle-summary-card" style="display:none">
      <div class="csc-inner">
        <div class="csc-header">
          <div class="csc-badge"><i class="fa-solid fa-flag-checkered"></i> Cycle Complete</div>
          <button class="csc-dismiss" id="csc-dismiss" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="csc-body" id="csc-body"></div>
      </div>
    </div>

    <div class="calendar-widget" id="calendar-widget">
      <div class="cal-header">
        <div class="cal-title" id="cal-month-title">Loading…</div>
        <div class="cal-subtitle" id="cal-subtitle"></div>
      </div>
      <div class="cal-sections" id="cal-sections"></div>
    </div>

    <div class="week-bar-wrapper">
      <button class="week-bar-nav-btn" id="week-bar-prev" title="Previous weeks"><i class="fa-solid fa-chevron-left"></i></button>
      <div class="week-number-bar" id="week-number-bar"></div>
      <button class="week-bar-nav-btn" id="week-bar-next" title="Next weeks"><i class="fa-solid fa-chevron-right"></i></button>
    </div>

    <div class="grid-container">
      <table id="mission-grid"></table>
    </div>

    <div class="bottom-panels-wrapper" id="bottom-panels">
      <div class="prediction-section" id="prediction-widget">
        <div class="pred-header">
          <div class="pred-header-title">
            <span class="pred-header-label">AI Forecast</span>
            <span class="pred-header-sub">Tomorrow's forecast · 14-day pattern analysis</span>
          </div>
          <button class="btn" id="btn-export-predictions"><i class="fa-solid fa-file-csv"></i> Export</button>
        </div>
        <div class="pred-grid" id="prediction-grid"></div>
      </div>

      <div class="prediction-section" id="efficiency-widget">
        <div class="pred-header">
          <div class="pred-header-title">
            <span class="pred-header-label">Cycle Efficiency</span>
            <span class="pred-header-sub">3-segment breakdown · click any card for details</span>
          </div>
        </div>
        <div class="eff-grid" id="efficiency-grid"></div>
      </div>

      <div class="prediction-section" id="strategic-insights-widget">
        <div class="pred-header">
          <div class="pred-header-title">
            <span class="pred-header-label">Strategic Insights</span>
            <span class="pred-header-sub">Full performance analytics · all-time data</span>
          </div>
        </div>
        <div id="strategic-insights-grid"></div>
      </div>

      <div class="prediction-section" id="month-progress-widget">
        <div class="pred-header" style="margin-bottom:4px;">
          <div class="pred-header-title">
            <span class="pred-header-label">Monthly Progress</span>
            <span class="month-emphasis-title" id="month-progress-sub">—</span>
          </div>
        </div>
        <div class="month-bricks-container" id="month-bricks"></div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;font-weight:600;color:var(--text-3);">
          <span id="month-start-label">—</span>
          <span style="color:var(--accent)">Day <span id="month-current-day">0</span> of <span id="month-total-days">0</span></span>
          <span id="month-end-label">—</span>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Detail modal -->
<div id="stats-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-text">
  <div class="modal-card" id="modal-card-element">
    <div class="modal-header">
      <div>
        <div class="modal-title" id="modal-title-text">Segment Insights</div>
        <div class="modal-subtitle" id="modal-sub-text">—</div>
      </div>
      <div class="modal-actions">
        <button class="btn" id="btn-modal-csv"><i class="fa-solid fa-file-csv"></i> CSV</button>
        <button class="modal-close" id="btn-modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="modal-body" id="modal-body-content"></div>
  </div>
</div>

<!-- Shortcuts modal -->
<div id="shortcuts-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
  <div class="modal-card">
    <div class="modal-header">
      <div>
        <div class="modal-title">Keyboard Shortcuts</div>
        <div class="modal-subtitle">Apex command interface navigation</div>
      </div>
      <div class="modal-actions">
        <button class="modal-close" id="btn-close-shortcuts"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="modal-body">
      <table class="kbd-table">
        <thead><tr><th class="kbd-th-category">Category</th><th class="kbd-th-action">Action</th><th class="kbd-th-key">Key</th></tr></thead>
        <tbody>
          <tr class="kbd-group-row"><td class="kbd-category" rowspan="5" style="--kbd-accent:var(--accent)"><i class="fa-solid fa-compass"></i><span>Navigation</span></td><td>Mastery Page</td><td><span class="kbd-key">M</span></td></tr>
          <tr><td>Home (Nexus)</td><td><span class="kbd-key">N</span></td></tr>
          <tr><td>Jump to Today</td><td><span class="kbd-key">T</span></td></tr>
          <tr><td>Previous Cycle</td><td><span class="kbd-key">&larr;</span></td></tr>
          <tr class="kbd-group-last"><td>Next Cycle</td><td><span class="kbd-key">&rarr;</span></td></tr>
          <tr class="kbd-group-row"><td class="kbd-category" rowspan="4" style="--kbd-accent:var(--cyan)"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Interface</span></td><td>Toggle Cyber Mode</td><td><span class="kbd-key">D</span></td></tr>
          <tr><td>Toggle Sidebar</td><td><span class="kbd-key">S</span></td></tr>
          <tr><td>Toggle Widgets</td><td><span class="kbd-key">H</span></td></tr>
          <tr class="kbd-group-last"><td>Show Shortcuts</td><td><span class="kbd-key">?</span></td></tr>
          <tr class="kbd-group-row"><td class="kbd-category" rowspan="5" style="--kbd-accent:var(--green)"><i class="fa-solid fa-bolt"></i><span>Actions</span></td><td>Toggle Mission</td><td><span class="kbd-keys"><span class="kbd-key">1</span><span class="kbd-sep">–</span><span class="kbd-key">7</span></span></td></tr>
          <tr><td>Planning Toggle</td><td><span class="kbd-key">P</span></td></tr>
          <tr><td>Early Wake Up</td><td><span class="kbd-key">E</span></td></tr>
          <tr><td>Cycle On-Track</td><td><span class="kbd-key">+</span></td></tr>
          <tr class="kbd-group-last"><td>Focus Daily Note</td><td><span class="kbd-key">A</span></td></tr>
          <tr class="kbd-group-row"><td class="kbd-category" rowspan="3" style="--kbd-accent:var(--violet)"><i class="fa-solid fa-eye"></i><span>View Focus</span></td><td>Focus On-Track</td><td><span class="kbd-key">O</span></td></tr>
          <tr><td>Focus Insights</td><td><span class="kbd-key">I</span></td></tr>
          <tr class="kbd-group-last"><td>Close Modal</td><td><span class="kbd-key">Esc</span></td></tr>
        </tbody>
      </table>
      <div class="kbd-tip">Press <strong>?</strong> anywhere to toggle this panel &mdash; no mouse required.</div>
    </div>
  </div>
</div>
`

export async function init(container, user) {
  container.innerHTML = TEMPLATE

  const _nexusSync = window._nexusSync
  const escapeHtml = window.escapeHtml
  let saveCloudKey = _saveCloudKey

  // ── Paste entire vanguard.js logic here, adapted for SPA lifecycle ───────────

  const MISSIONS = [
    {
      id: 'm1',
      name: 'Deep Caliber Work',
      icon: 'fa-brain',
      color: '#3b82f6',
      rgb: '59, 130, 246',
      spec: 'min 3 h deep work',
    },
    {
      id: 'm2',
      name: 'Physical Conditioning',
      icon: 'fa-dumbbell',
      color: '#22c55e',
      rgb: '34, 197, 94',
      spec: 'min 45 min + cardio',
    },
    {
      id: 'm3',
      name: 'Fuel & Nutrition',
      icon: 'fa-apple-whole',
      color: '#f97316',
      rgb: '249, 115, 22',
      spec: '19 h fast total',
    },
    {
      id: 'm4',
      name: 'Knowledge Acquisition',
      icon: 'fa-book',
      color: '#eab308',
      rgb: '234, 179, 8',
      spec: 'min 20 min',
    },
    {
      id: 'm5',
      name: 'Linguistic Mastery',
      icon: 'fa-language',
      color: '#ef4444',
      rgb: '239, 68, 68',
      spec: 'min 15 min',
    },
    {
      id: 'm6',
      name: 'Mental Fortitude',
      icon: 'fa-bolt',
      color: '#a855f7',
      rgb: '168, 85, 247',
      spec: 'no spend · no bad habit',
    },
    {
      id: 'm7',
      name: 'Strategic Recovery',
      icon: 'fa-bed',
      color: '#94a3b8',
      rgb: '148, 163, 184',
      spec: 'wake ≤6 AM · bed 10 PM',
    },
  ]
  const SEG_THEMES = [
    { name: 'Segment 1', color: 'var(--accent)', rgb: '79, 70, 229' },
    { name: 'Segment 2', color: 'var(--green)', rgb: '16, 185, 129' },
    { name: 'Segment 3', color: 'var(--violet)', rgb: '139, 92, 246' },
  ]
  const OVERALL_THEME = { name: 'Cycle Overall', color: 'var(--gold)', rgb: '245, 158, 11' }

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const sidebar = document.getElementById('app-sidebar')
  const _isMobile = () => window.innerWidth <= 1024
  const _storedCollapsed = localStorage.getItem('matrix-sidebar-collapsed')
  let sidebarCollapsed = _storedCollapsed !== null ? _storedCollapsed === 'true' : _isMobile()
  function applySidebarState() {
    sidebarCollapsed ? sidebar.classList.add('collapsed') : sidebar.classList.remove('collapsed')
  }
  document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed
    localStorage.setItem('matrix-sidebar-collapsed', sidebarCollapsed)
    applySidebarState()
  })
  applySidebarState()

  // ── Panels toggle ────────────────────────────────────────────────────────────
  const bottomPanels = document.getElementById('bottom-panels')
  const calendarWidget = document.getElementById('calendar-widget')
  const btnToggleWidgets = document.getElementById('btn-toggle-widgets')
  let widgetsHidden = localStorage.getItem('matrix-widgets-hidden') === 'true'
  function applyWidgetsState() {
    if (widgetsHidden) {
      bottomPanels.style.display = 'none'
      if (calendarWidget) calendarWidget.style.display = 'none'
      btnToggleWidgets.innerHTML = '<i class="fa-solid fa-eye"></i> Show'
    } else {
      bottomPanels.style.display = 'flex'
      if (calendarWidget) calendarWidget.style.display = ''
      btnToggleWidgets.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide'
    }
  }
  btnToggleWidgets.addEventListener('click', () => {
    widgetsHidden = !widgetsHidden
    localStorage.setItem('matrix-widgets-hidden', widgetsHidden)
    applyWidgetsState()
  })
  applyWidgetsState()

  // ── Theme ───────────────────────────────────────────────────────────────────
  const body = document.body
  const btnToggleTheme = document.getElementById('btn-toggle-theme')
  let theme = localStorage.getItem('matrix-theme') || 'dark'
  if (theme === 'light') theme = 'dark' // migrate any stale light preference
  function applyTheme() {
    body.classList.remove('theme-dark', 'theme-cyber')
    if (theme === 'cyber') {
      body.classList.add('theme-cyber')
      btnToggleTheme.innerHTML = '<i class="fa-solid fa-moon"></i> Dark'
    } else {
      body.classList.add('theme-dark')
      btnToggleTheme.innerHTML = '<i class="fa-solid fa-bolt"></i> Cyber'
    }
    localStorage.setItem('matrix-theme', theme)
  }
  btnToggleTheme.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'cyber' : 'light'
    applyTheme()
  })
  applyTheme()

  // ── State ─────────────────────────────────────────────────────────────────────
  let logs = {},
    latestPredictions = [],
    currentModalExportData = null,
    currentCycleStart = null

  const table = document.getElementById('mission-grid')
  const inpDate = document.getElementById('inp-date')
  const inpNote = document.getElementById('inp-note')
  const noteCharCount = document.getElementById('note-char-count')
  const inpDeepFocus = document.getElementById('inp-deep-focus')
  const btnEarlyWake = document.getElementById('btn-early-wake')
  const btnPlanning = document.getElementById('btn-planning')
  const btnOnTrack = document.getElementById('btn-on-track')
  const displayPts = document.getElementById('disp-pts')
  const dispDay = document.getElementById('disp-day')
  const dispPct = document.getElementById('disp-pct')

  // ── Utils ─────────────────────────────────────────────────────────────────────
  function saveToLocal() {
    localStorage.setItem('vanguard-logs', JSON.stringify(logs))
    saveCloudKey('vanguard-logs', logs)
    _nexusSync.broadcast('VANGUARD')
  }
  function loadFromLocal() {
    const d = localStorage.getItem('vanguard-logs')
    if (d)
      try {
        logs = JSON.parse(d)
      } catch {
        logs = {}
      }
  }

  let cycleGoals = {}
  function saveCycleGoals() {
    localStorage.setItem('vanguard-cycle-goals', JSON.stringify(cycleGoals))
    saveCloudKey('vanguard-cycle-goals', cycleGoals)
  }
  function loadCycleGoals() {
    try {
      cycleGoals = JSON.parse(localStorage.getItem('vanguard-cycle-goals') || '{}')
    } catch {
      cycleGoals = {}
    }
  }

  function getPSTDate() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  }
  function formatPSTDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function formatHumanReadable(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }
  function formatDateRange(start, end) {
    const sM = start.toLocaleDateString('en-US', { month: 'short' }),
      sD = String(start.getDate()).padStart(2, '0')
    const eM = end.toLocaleDateString('en-US', { month: 'short' }),
      eD = String(end.getDate()).padStart(2, '0')
    const yr = end.getFullYear()
    if (sM === eM && start.getFullYear() === end.getFullYear()) return `${sM} ${sD} — ${eD}, ${yr}`
    if (start.getFullYear() === end.getFullYear()) return `${sM} ${sD} — ${eM} ${eD}, ${yr}`
    return `${sM} ${sD}, ${start.getFullYear()} — ${eM} ${eD}, ${yr}`
  }

  // ── Cycle logic ───────────────────────────────────────────────────────────────
  function getCycleStart(pstDate) {
    const d = pstDate.getDate()
    return new Date(pstDate.getFullYear(), pstDate.getMonth(), d <= 10 ? 1 : d <= 20 ? 11 : 21)
  }
  function getCycleEnd(cs) {
    const d = cs.getDate()
    if (d === 1) return new Date(cs.getFullYear(), cs.getMonth(), 10)
    if (d === 11) return new Date(cs.getFullYear(), cs.getMonth(), 20)
    return new Date(cs.getFullYear(), cs.getMonth() + 1, 0)
  }
  function getCycleDays(cs) {
    const ce = getCycleEnd(cs)
    return (
      Math.round(
        (Date.UTC(ce.getFullYear(), ce.getMonth(), ce.getDate()) -
          Date.UTC(cs.getFullYear(), cs.getMonth(), cs.getDate())) /
          86400000
      ) + 1
    )
  }
  function getCycleNumber(cs) {
    return cs.getDate() <= 10 ? 1 : cs.getDate() <= 20 ? 2 : 3
  }

  function shiftCycle(dir) {
    const cs = currentCycleStart,
      d = cs.getDate()
    let s
    if (dir === 1) {
      if (d === 1) s = new Date(cs.getFullYear(), cs.getMonth(), 11)
      else if (d === 11) s = new Date(cs.getFullYear(), cs.getMonth(), 21)
      else s = new Date(cs.getFullYear(), cs.getMonth() + 1, 1)
    } else {
      if (d === 21) s = new Date(cs.getFullYear(), cs.getMonth(), 11)
      else if (d === 11) s = new Date(cs.getFullYear(), cs.getMonth(), 1)
      else s = new Date(cs.getFullYear(), cs.getMonth() - 1, 21)
    }
    currentCycleStart = s
    renderGrid()
  }
  function jumpToToday() {
    currentCycleStart = getCycleStart(getPSTDate())
    renderGrid()
  }

  function getCalculatedScoreForDate(dateStr) {
    let score = 0
    Object.values(logs[dateStr]?.missions || {}).forEach(s => {
      if (s === 'completed') score += 1
      if (s === 'partial') score += 0.5
    })
    return score
  }
  function getIntensityColor(score) {
    if (score === 0) return 'transparent'
    if (score < 2.5) return 'var(--rose)'
    if (score < 4.5) return 'var(--gold)'
    if (score < 6.0) return 'var(--cyan)'
    return 'var(--green)'
  }

  // ── Week number ───────────────────────────────────────────────────────────────
  function isoWeekNum(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayOfWeek = d.getUTCDay()
    const weekStart = new Date(d)
    weekStart.setUTCDate(d.getUTCDate() - dayOfWeek)
    const jan1 = new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 1))
    const week1Start = new Date(jan1)
    week1Start.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay())
    return Math.floor((weekStart - week1Start) / (7 * 24 * 3600 * 1000)) + 1
  }

  // ── AI Prediction ─────────────────────────────────────────────────────────────
  function calculateAI_Predictions() {
    const today = getPSTDate(),
      tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomDow = tomorrow.getDay(),
      todayStr = formatPSTDate(today)
    const window14 = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      window14.push(formatPSTDate(d))
    }
    const logged14 = window14.filter(ds => logs[ds])

    const stats = MISSIONS.map(m => {
      let baseSum = 0
      logged14.forEach(ds => {
        const st = logs[ds]?.missions?.[m.id]
        if (st === 'completed') baseSum += 1
        else if (st === 'partial') baseSum += 0.5
      })
      const baseRate = logged14.length > 0 ? baseSum / logged14.length : null
      const dowDays = logged14.filter(ds => {
        const [y, mo, d] = ds.split('-').map(Number)
        return new Date(y, mo - 1, d).getDay() === tomDow
      })
      let dowSum = 0
      dowDays.forEach(ds => {
        const st = logs[ds]?.missions?.[m.id]
        if (st === 'completed') dowSum += 1
        else if (st === 'partial') dowSum += 0.5
      })
      const dowRate = dowDays.length >= 2 ? dowSum / dowDays.length : null
      let streakSum = 0
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const st = logs[formatPSTDate(d)]?.missions?.[m.id]
        if (st === 'completed') streakSum += 1
        else if (st === 'partial') streakSum += 0.5
      }
      const todaySt = logs[todayStr]?.missions?.[m.id]
      const todayBonus = todaySt === 'completed' ? 0.12 : todaySt === 'partial' ? 0.06 : 0
      let prob
      if (baseRate === null) {
        prob = 0.5
      } else {
        const effectiveDow = dowRate !== null ? dowRate : baseRate
        prob = effectiveDow * 0.5 + baseRate * 0.28 + (streakSum / 3) * 0.15 + todayBonus * 0.07
      }
      prob = Math.min(0.97, Math.max(0.03, prob))
      const confidence = logged14.length >= 10 ? 'high' : logged14.length >= 5 ? 'med' : 'low'
      return { mission: m, prob: prob * 100, confidence, samples: logged14.length }
    })
    stats.sort((a, b) => b.prob - a.prob)
    latestPredictions = stats
    if (!logs[todayStr]) logs[todayStr] = { missions: {} }
    logs[todayStr].predictions = stats.map(s => ({ id: s.mission.id, prob: s.prob }))
    renderPredictionUI(stats.slice(0, 3))
  }

  function renderPredictionUI(top3) {
    const confLabel = { high: '●●●', med: '●●○', low: '●○○' }
    const confColor = { high: 'var(--green)', med: 'var(--gold)', low: 'var(--text-4)' }
    document.getElementById('prediction-grid').innerHTML = top3
      .map(item => {
        const m = item.mission,
          pct = Math.round(item.prob)
        const badge = `<span style="font-size:10px;font-weight:700;color:${confColor[item.confidence]};letter-spacing:1px;margin-left:6px;" title="${item.samples} days of data">${confLabel[item.confidence]}</span>`
        return `<div class="pred-card" style="--m-color:${m.color};--m-rgb:${m.rgb}">
        <div class="pred-card-top"><div class="pred-info"><div class="pred-icon"><i class="fa-solid ${m.icon}"></i></div><span class="pred-name">${m.name}${badge}</span></div><div class="pred-pct-text">${pct}%</div></div>
        <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%"></div></div>
      </div>`
      })
      .join('')
  }

  // ── Cycle efficiency ──────────────────────────────────────────────────────────
  function getCycleScores(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    let parts = [0, 0, 0],
      total = 0
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
      const score = getCalculatedScoreForDate(ds),
        seg = dd <= 10 ? 0 : dd <= 20 ? 1 : 2
      parts[seg] += score
      total += score
    }
    return { parts, total, daysInMonth }
  }

  function updateEfficiencyWidget() {
    if (!currentCycleStart) return
    const cycleYear = currentCycleStart.getFullYear(),
      cycleMonth = currentCycleStart.getMonth() + 1
    const curScores = getCycleScores(cycleYear, cycleMonth)
    const daysInMonth = curScores.daysInMonth
    const prevDate = new Date(cycleYear, cycleMonth - 2, 1)
    const prevScores = getCycleScores(prevDate.getFullYear(), prevDate.getMonth() + 1)
    const today = getPSTDate()
    const isCurrentMonth = today.getFullYear() === cycleYear && today.getMonth() + 1 === cycleMonth
    const todayDay = isCurrentMonth ? today.getDate() : -1
    const curSeg = todayDay > 0 ? (todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2) : -1
    const segStarts = [1, 11, 21],
      segEnds = [10, 20, daysInMonth]
    let html = ''
    for (let i = 0; i < 3; i++) {
      const start = segStarts[i],
        end = segEnds[i],
        segDays = end - start + 1,
        maxPts = MISSIONS.length * segDays
      const pts = curScores.parts[i].toFixed(1),
        pct = ((curScores.parts[i] / maxPts) * 100).toFixed(1)
      const diff = (curScores.parts[i] - prevScores.parts[i]).toFixed(1)
      const ti =
        parseFloat(diff) > 0 ? 'fa-arrow-up' : parseFloat(diff) < 0 ? 'fa-arrow-down' : 'fa-minus'
      const tc =
        parseFloat(diff) > 0
          ? 'var(--green)'
          : parseFloat(diff) < 0
            ? 'var(--rose)'
            : 'var(--text-3)'
      const ds2 = parseFloat(diff) > 0 ? '+' : ''
      const t2 = SEG_THEMES[i],
        isCur = i === curSeg
      const badge = isCur
        ? `<span style="font-size:10px;background:${t2.color};color:white;padding:2px 6px;border-radius:4px;margin-left:8px;">NOW</span>`
        : ''
      const cardStyle = isCur
        ? `--m-color:${t2.color};--m-rgb:${t2.rgb};border-color:var(--border-2);box-shadow:var(--shadow-sm);`
        : `--m-color:${t2.color};--m-rgb:${t2.rgb};`
      html += `<div class="pred-card clickable-card" style="${cardStyle}" data-open-modal="seg" data-modal-idx="${i}">
        <div class="pred-card-top"><div class="pred-info"><span class="pred-name" style="display:flex;align-items:center;color:${t2.color}">${t2.name}${badge}</span></div><div class="pred-pct-text">${pct}%</div></div>
        <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-top:-4px;">Days ${start}–${end}</div>
        <div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;margin-top:4px;"><span>${pts} / ${maxPts} pts</span><span style="color:${tc}"><i class="fa-solid ${ti}"></i> ${ds2}${diff} vs prev</span></div>
        <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%"></div></div>
      </div>`
    }
    const totalMaxPts = MISSIONS.length * daysInMonth,
      curTotalPct = ((curScores.total / totalMaxPts) * 100).toFixed(1)
    const prevTotalMaxPts = MISSIONS.length * prevScores.daysInMonth,
      prevTotalPct = ((prevScores.total / prevTotalMaxPts) * 100).toFixed(1)
    const od = (parseFloat(curTotalPct) - parseFloat(prevTotalPct)).toFixed(1)
    const ot =
      parseFloat(od) > 0
        ? 'fa-arrow-trend-up'
        : parseFloat(od) < 0
          ? 'fa-arrow-trend-down'
          : 'fa-minus'
    const oc =
      parseFloat(od) > 0 ? 'var(--green)' : parseFloat(od) < 0 ? 'var(--rose)' : 'var(--text-3)'
    const os = parseFloat(od) > 0 ? '+' : ''
    html += `<div class="pred-card clickable-card" style="--m-color:${OVERALL_THEME.color};--m-rgb:${OVERALL_THEME.rgb};" data-open-modal="overall" data-modal-idx="">
      <div class="pred-card-top"><div class="pred-info"><span class="pred-name" style="color:${OVERALL_THEME.color};">${OVERALL_THEME.name}</span></div><div class="pred-pct-text">${curTotalPct}%</div></div>
      <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-top:-4px;">Days 1–${daysInMonth}</div>
      <div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;margin-top:4px;"><span>${curScores.total.toFixed(1)} / ${totalMaxPts} pts</span><span style="color:${oc}"><i class="fa-solid ${ot}"></i> ${os}${od}%</span></div>
      <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${curTotalPct}%"></div></div>
    </div>`
    document.getElementById('efficiency-grid').innerHTML = html
  }

  // Wire efficiency card clicks via event delegation
  document.getElementById('efficiency-grid').addEventListener('click', e => {
    const card = e.target.closest('[data-open-modal]')
    if (!card) return
    const type = card.dataset.openModal,
      idx = card.dataset.modalIdx !== '' ? parseInt(card.dataset.modalIdx) : null
    openDetailModal(type, idx)
  })

  // ── Calendar widget ───────────────────────────────────────────────────────────
  function updateCalendarWidget(dateStr) {
    const [y, m] = dateStr.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const shortMonths = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    document.getElementById('cal-month-title').innerText = `${monthNames[m - 1]} ${y}`
    document.getElementById('cal-subtitle').innerText =
      `${daysInMonth}-day month · 10 · 10 · ${daysInMonth - 20}`
    const today = getPSTDate(),
      todayDay = y === today.getFullYear() && m === today.getMonth() + 1 ? today.getDate() : -1
    function secScore(start10, end10) {
      let s = 0
      for (let dd = start10; dd <= Math.min(end10, daysInMonth); dd++)
        s += getCalculatedScoreForDate(
          `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
        )
      return s.toFixed(1)
    }
    const todaySec = todayDay > 0 ? (todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2) : -1
    let html = ''
    for (let sec = 0; sec < 3; sec++) {
      const start = sec * 10 + 1,
        end = Math.min(start + 9, daysInMonth)
      const isActiveSec = sec === todaySec,
        score = secScore(start, end)
      const maxSec = MISSIONS.length * (end - start + 1),
        pct = maxSec > 0 ? ((parseFloat(score) / maxSec) * 100).toFixed(0) : 0
      html += `<div class="cal-section${isActiveSec ? ' active-section' : ''}"><div class="cal-section-label">Days ${start}–${end}</div><div class="cal-bricks">`
      for (let dd = start; dd <= end; dd++) {
        const dateObj = new Date(y, m - 1, dd),
          isSun = dateObj.getDay() === 0,
          isTod = dd === todayDay,
          isPast = dd < todayDay
        let cls = 'cal-brick'
        if (isTod) cls += ' today'
        else if (isPast) cls += ' past'
        else cls += ' future'
        if (isSun) cls += ' sunday'
        html += `<div class="${cls}" title="${shortMonths[m - 1]} ${dd}">${dd}</div>`
      }
      for (let dd = end + 1; dd < start + 10 && dd > daysInMonth; dd++)
        html += `<div class="cal-brick" style="opacity:0;pointer-events:none;"></div>`
      html += `</div><div class="cal-section-range">${shortMonths[m - 1]} ${String(start).padStart(2, '0')} → ${String(end).padStart(2, '0')}</div><div class="cal-section-score">${score} pts · ${pct}%</div></div>`
    }
    document.getElementById('cal-sections').innerHTML = html
  }

  // ── Monthly progress ──────────────────────────────────────────────────────────
  function updateMonthProgress(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number),
      ad = new Date(y, m - 1, d)
    const mon = ad.getMonth(),
      yr = ad.getFullYear(),
      day = ad.getDate()
    const total = new Date(yr, mon + 1, 0).getDate()
    const full = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const short = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    document.getElementById('month-progress-sub').innerText = `${full[mon]} ${yr}`
    document.getElementById('month-start-label').innerText = `${short[mon]} 01`
    document.getElementById('month-end-label').innerText = `${short[mon]} ${total}`
    document.getElementById('month-current-day').innerText = day
    document.getElementById('month-total-days').innerText = total
    let html = ''
    for (let i = 1; i <= total; i++) {
      let cls = 'month-brick'
      if (new Date(yr, mon, i).getDay() === 0) cls += ' is-sunday'
      if (i < day) cls += ' filled'
      else if (i === day) cls += ' filled today'
      html += `<div class="${cls}" title="${short[mon]} ${i}"></div>`
    }
    document.getElementById('month-bricks').innerHTML = html
  }

  // ── Week widget ───────────────────────────────────────────────────────────────
  function updateWeekWidget(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const today = new Date(y, m - 1, d),
      dow = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dow)
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const monthShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    let cells = ''
    for (let i = 0; i < 7; i++) {
      const dt = new Date(weekStart)
      dt.setDate(weekStart.getDate() + i)
      let cls = 'week-cell'
      if (dt.getDay() === 0) cls += ' is-sun'
      if (dt < today) cls += ' past'
      if (dt.toDateString() === today.toDateString()) cls += ' today'
      cells += `<div class="${cls}" title="${monthShort[dt.getMonth()]} ${dt.getDate()}"><div class="week-cell-dot">${dt.getDate()}</div><div class="week-cell-name">${dayNames[i]}</div></div>`
    }
    const eow = new Date(weekStart)
    eow.setDate(weekStart.getDate() + 6)
    document.getElementById('week-widget-label').innerText =
      `${monthShort[weekStart.getMonth()]} ${weekStart.getDate()} – ${monthShort[eow.getMonth()]} ${eow.getDate()}`
    document.getElementById('week-cells').innerHTML = cells
  }

  // ── Momentum / perfect day ────────────────────────────────────────────────────
  function getDailyMomentumValue(ds) {
    const s = getCalculatedScoreForDate(ds)
    return s <= 0 ? 0 : s >= MISSIONS.length ? 1 : 0.5
  }
  function getMomentumCoefficient() {
    const today = getPSTDate()
    let ws = 0,
      wt = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const w = 7 - i
      ws += getDailyMomentumValue(formatPSTDate(d)) * w
      wt += w
    }
    return wt > 0 ? ws / wt : 0
  }
  function isPerfectDay(ds) {
    const score = getCalculatedScoreForDate(ds)
    if (score > 5.0) return true
    const ml = logs[ds]
    if (!ml?.missions) return false
    return (
      Object.values(ml.missions).filter(s => s === 'completed' || s === 'partial').length ===
      MISSIONS.length
    )
  }
  function getPerfectDayStreak() {
    const today = getPSTDate()
    let streak = 0,
      checkDate = new Date(today)
    while (true) {
      const ds = formatPSTDate(checkDate)
      if (isPerfectDay(ds)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }
    return streak
  }
  function getRecoveryRate() {
    const loggedDates = Object.keys(logs).sort()
    if (loggedDates.length < 2) return 0
    let times = [],
      lastBreak = null
    for (const ds of loggedDates) {
      if (!isPerfectDay(ds)) {
        lastBreak = new Date(ds)
      } else if (lastBreak) {
        times.push(Math.ceil((new Date(ds) - lastBreak) / 86400000))
        lastBreak = null
      }
    }
    return times.length === 0
      ? 0
      : Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────
  function getPeriodDetailStats(startD, daysCount) {
    let stats = {
      score: 0,
      maxScore: daysCount * MISSIONS.length,
      missions: {},
      focus: 0,
      early: 0,
      plan: 0,
    }
    MISSIONS.forEach(m => (stats.missions[m.id] = 0))
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startD)
      d.setDate(d.getDate() + i)
      const ds = formatPSTDate(d),
        log = logs[ds] || {},
        ml = log.missions || {}
      stats.score += getCalculatedScoreForDate(ds)
      stats.focus += parseFloat(log.deepFocus || 0)
      if (log.earlyWake) stats.early++
      if (log.planning) stats.plan++
      MISSIONS.forEach(m => {
        if (ml[m.id] === 'completed') stats.missions[m.id] += 1
        else if (ml[m.id] === 'partial') stats.missions[m.id] += 0.5
      })
    }
    return stats
  }

  function openDetailModal(type, index) {
    const modal = document.getElementById('stats-modal'),
      card = document.getElementById('modal-card-element')
    const cycleYear = currentCycleStart.getFullYear(),
      cycleMonth = currentCycleStart.getMonth() + 1
    const daysInMonth = new Date(cycleYear, cycleMonth, 0).getDate()
    const segStarts = [1, 11, 21],
      segEnds = [10, 20, daysInMonth]
    let startD = new Date(cycleYear, cycleMonth - 1, 1),
      days = daysInMonth,
      title = 'Cycle Insights',
      accent = OVERALL_THEME.color
    if (type === 'seg') {
      startD = new Date(cycleYear, cycleMonth - 1, segStarts[index])
      days = segEnds[index] - segStarts[index] + 1
      title = `${SEG_THEMES[index].name} Insights`
      accent = SEG_THEMES[index].color
    }
    card.style.setProperty('--modal-accent', accent)
    let endD = new Date(startD)
    endD.setDate(endD.getDate() + days - 1)
    document.getElementById('modal-title-text').innerText = title
    document.getElementById('modal-sub-text').innerText = formatDateRange(startD, endD)
    const stats = getPeriodDetailStats(startD, days)
    currentModalExportData = { title, dateRange: formatDateRange(startD, endD), stats, days }
    let html = `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-inset);padding:14px 18px;border-radius:var(--r-md);border:1px solid var(--border-1);">
      <span style="font-weight:700;color:var(--text-2);text-transform:uppercase;font-size:12px;">Total Score</span>
      <span style="font-size:1.9rem;font-weight:800;color:${accent};line-height:1;">${stats.score.toFixed(1)}<span style="font-size:1rem;color:var(--text-3);font-weight:600"> / ${stats.maxScore}</span></span>
    </div>`
    MISSIONS.forEach(m => {
      const val = stats.missions[m.id],
        pct = (val / days) * 100
      html += `<div><div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;color:var(--text-2);margin-bottom:7px;"><span><i class="fa-solid ${m.icon}" style="color:${m.color};margin-right:8px;width:14px;text-align:center;"></i>${m.name}</span><span>${val} <span style="color:var(--text-3);font-weight:500">/ ${days}</span></span></div><div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%;background:${m.color};"></div></div></div>`
    })
    html += `<div style="display:flex;gap:10px;margin-top:6px;padding-top:18px;border-top:1px solid var(--border-1);">
      <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);"><div style="font-size:1.6rem;font-weight:800;color:var(--cyan);">${stats.focus.toFixed(1)}h</div><div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Deep Focus</div></div>
      <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);"><div style="font-size:1.6rem;font-weight:800;color:var(--green);">${stats.early}</div><div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Early Wakes</div></div>
      <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);"><div style="font-size:1.6rem;font-weight:800;color:var(--violet);">${stats.plan}</div><div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Days Planned</div></div>
    </div>`
    document.getElementById('modal-body-content').innerHTML = html
    modal.classList.add('active')
    modal._releaseTrap = window.trapFocus(modal)
  }

  function closeDetailModal() {
    const modal = document.getElementById('stats-modal')
    modal.classList.remove('active')
    modal._releaseTrap?.()
    currentModalExportData = null
  }
  function exportModalCSV() {
    if (!currentModalExportData) return
    const { title, dateRange, stats, days } = currentModalExportData
    let csv = `Report,"${title}"\nPeriod,"${dateRange}"\n\nMetric,Value\nPerformance Score,${stats.score} / ${stats.maxScore}\nTotal Deep Focus (hrs),${stats.focus.toFixed(1)}\nTotal Early Wakes,${stats.early}\nTotal Days Planned,${stats.plan}\n\nMission Name,Completions,Possible Days\n`
    MISSIONS.forEach(m => {
      csv += `"${m.name}",${stats.missions[m.id]},${days}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vanguard_${title.replace(/\s+/g, '_').toLowerCase()}_stats.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  document.getElementById('stats-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetailModal()
  })
  document.getElementById('btn-modal-close').addEventListener('click', closeDetailModal)
  document.getElementById('btn-modal-csv').addEventListener('click', exportModalCSV)

  // ── Week number bar ───────────────────────────────────────────────────────────
  let weekBarOffset = 0
  function updateWeekNumberBar() {
    const bar = document.getElementById('week-number-bar'),
      today = getPSTDate()
    const fmt = d =>
      String(d.getMonth() + 1).padStart(2, '0') +
      '/' +
      String(d.getDate()).padStart(2, '0') +
      '/' +
      String(d.getFullYear()).slice(-2)
    const daysUntilNextSunday = today.getDay() === 0 ? 7 : 7 - today.getDay()
    const base = new Date(today)
    base.setDate(today.getDate() + daysUntilNextSunday + weekBarOffset * 7)
    base.setHours(0, 0, 0, 0)
    let html = ''
    for (let i = 0; i < 3; i++) {
      const weekStart = new Date(base)
      weekStart.setDate(base.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const wn = isoWeekNum(weekStart)
      if (i > 0) html += '<div class="week-number-divider"></div>'
      html += `<span class="week-number-badge">Week ${wn}</span><span class="week-number-range">${fmt(weekStart)} - ${fmt(weekEnd)}</span>`
    }
    bar.innerHTML = html
    document.getElementById('week-bar-prev').disabled = weekBarOffset === 0
  }
  document.getElementById('week-bar-prev').addEventListener('click', () => {
    if (weekBarOffset > 0) {
      weekBarOffset -= 3
      if (weekBarOffset < 0) weekBarOffset = 0
      updateWeekNumberBar()
    }
  })
  document.getElementById('week-bar-next').addEventListener('click', () => {
    weekBarOffset += 3
    updateWeekNumberBar()
  })

  // ── Render grid ───────────────────────────────────────────────────────────────
  function renderGrid() {
    const dates = [],
      start = new Date(currentCycleStart)
    const _cycleDays = getCycleDays(currentCycleStart)
    for (let i = 0; i < _cycleDays; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    const todayStr = formatPSTDate(getPSTDate()),
      months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    updateWeekNumberBar()
    const currentWeekNum = isoWeekNum(getPSTDate())
    const curWeekLabel = document.getElementById('current-week-label')
    if (curWeekLabel) {
      curWeekLabel.textContent = `Week ${currentWeekNum}`
    }
    const s = dates[0],
      e = dates[dates.length - 1]
    const startMonth = months[s.getMonth()],
      endMonth = months[e.getMonth()],
      cycleNum = getCycleNumber(currentCycleStart)
    const rangeStr =
      startMonth === endMonth
        ? `<span style="color:var(--green)">${startMonth} ${s.getDate()}</span> – <span style="color:var(--rose)">${e.getDate()}</span>`
        : `<span style="color:var(--green)">${startMonth} ${s.getDate()}</span> – <span style="color:var(--rose)">${endMonth} ${e.getDate()}</span>`
    document.getElementById('cycle-label').innerHTML =
      `<span class="cycle-number-badge">Cycle ${cycleNum}</span> <span style="color:var(--text-4);font-weight:500;font-size:0.95rem;">·</span> ${rangeStr}`
    document.getElementById('cycle-range').innerText =
      `${formatHumanReadable(s)} — ${formatHumanReadable(e)}`

    let html = `<thead><tr><th class="th-mission">Objectives</th>`
    dates.forEach(d => {
      const ds = formatPSTDate(d),
        cls = []
      if (ds === todayStr) cls.push('col-today')
      if (d.getDay() === 0) cls.push('col-sunday')
      html += `<th class="${cls.join(' ')}"><div class="date-day-name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</div><div class="date-day-num">${d.getDate()}</div></th>`
    })
    html += `</tr></thead><tbody><tr class="intensity-row"><td class="th-mission"><span style="font-weight:700;color:var(--text-3);text-transform:uppercase;font-size:11px;">Effort Level</span></td>`
    dates.forEach(d => {
      const ds = formatPSTDate(d),
        cls = []
      if (ds === todayStr) cls.push('col-today')
      if (d.getDay() === 0) cls.push('col-sunday')
      const score = getCalculatedScoreForDate(ds),
        c = getIntensityColor(score)
      html += `<td class="${cls.join(' ')}"><div class="intensity-score-text" style="color:${c};">${score > 0 ? score.toFixed(1) : ''}</div><div class="intensity-bar" style="background:${score > 0 ? c : 'transparent'};"></div></td>`
    })
    html += `</tr>`
    MISSIONS.forEach(m => {
      html += `<tr class="mission-row" style="--m-color:${m.color};--m-rgb:${m.rgb}"><td class="th-mission"><div class="mission-info"><div class="mission-icon"><i class="fa-solid ${m.icon}"></i></div><div class="mission-text"><span class="mission-name">${m.name}</span><span class="mission-spec">${m.spec}</span></div></div></td>`
      dates.forEach(d => {
        const ds = formatPSTDate(d),
          cls = ['cell-action']
        if (ds === todayStr) cls.push('col-today')
        if (d.getDay() === 0) cls.push('col-sunday')
        html += `<td class="${cls.join(' ')}" data-date="${ds}" data-mid="${m.id}"></td>`
      })
      html += `</tr>`
    })
    table.innerHTML = html + '</tbody>'
    updateVisuals()
    updateEfficiencyWidget()
    updateStrategicInsights()
    updateCalendarWidget(inpDate.value || formatPSTDate(getPSTDate()))
    updateCycleGoalInput()
    checkCycleSummary()
  }

  // Wire mission cell clicks via event delegation
  table.addEventListener('click', e => {
    const cell = e.target.closest('.cell-action')
    if (cell) toggleMission(cell)
  })

  // ── Cycle goal ────────────────────────────────────────────────────────────────
  function updateCycleGoalInput() {
    const csKey = formatPSTDate(currentCycleStart),
      csEnd = getCycleEnd(currentCycleStart)
    const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    document.getElementById('goal-cycle-label').textContent =
      `${mo[currentCycleStart.getMonth()]} ${currentCycleStart.getDate()} – ${mo[csEnd.getMonth()]} ${csEnd.getDate()}`
    const val = cycleGoals[csKey] || ''
    document.getElementById('inp-cycle-goal').value = val
    const cc = document.getElementById('goal-char-count')
    cc.textContent = `${val.length} / 150`
    cc.classList.toggle('warn', val.length > 120)
  }

  // ── Cycle summary card ────────────────────────────────────────────────────────
  function getPrevCycleStart(cs) {
    const d = cs.getDate()
    if (d === 1) return new Date(cs.getFullYear(), cs.getMonth() - 1, 21)
    if (d === 11) return new Date(cs.getFullYear(), cs.getMonth(), 1)
    return new Date(cs.getFullYear(), cs.getMonth(), 11)
  }

  function checkCycleSummary() {
    const card = document.getElementById('cycle-summary-card'),
      body = document.getElementById('csc-body')
    if (!card || !body) return
    const today = getPSTDate(),
      csEnd = getCycleEnd(currentCycleStart)
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const endMs = Date.UTC(csEnd.getFullYear(), csEnd.getMonth(), csEnd.getDate())
    if (todayMs <= endMs) {
      card.style.display = 'none'
      return
    }
    const dismissKey = `csc-dismissed-${formatPSTDate(currentCycleStart)}`
    if (localStorage.getItem(dismissKey) === '1') {
      card.style.display = 'none'
      return
    }
    const nDays = getCycleDays(currentCycleStart),
      dates = []
    for (let i = 0; i < nDays; i++) {
      const d = new Date(
        currentCycleStart.getFullYear(),
        currentCycleStart.getMonth(),
        currentCycleStart.getDate() + i
      )
      dates.push(formatPSTDate(d))
    }
    let cycleScore = 0,
      bestScore = -1,
      bestDate = null,
      focusTotal = 0
    const mCounts = {}
    MISSIONS.forEach(m => (mCounts[m.id] = 0))
    dates.forEach(ds => {
      const s = getCalculatedScoreForDate(ds)
      cycleScore += s
      if (s > bestScore) {
        bestScore = s
        bestDate = ds
      }
      focusTotal += parseFloat(logs[ds]?.deepFocus || 0)
      Object.entries(logs[ds]?.missions || {}).forEach(([mid, st]) => {
        mCounts[mid] = (mCounts[mid] || 0) + (st === 'completed' ? 1 : st === 'partial' ? 0.5 : 0)
      })
    })
    const prevCs = getPrevCycleStart(currentCycleStart),
      prevDays = getCycleDays(prevCs)
    let prevScore = 0
    const prevCounts = {}
    MISSIONS.forEach(m => (prevCounts[m.id] = 0))
    for (let i = 0; i < prevDays; i++) {
      const d = new Date(prevCs.getFullYear(), prevCs.getMonth(), prevCs.getDate() + i)
      const ds = formatPSTDate(d)
      prevScore += getCalculatedScoreForDate(ds)
      Object.entries(logs[ds]?.missions || {}).forEach(([mid, st]) => {
        prevCounts[mid] =
          (prevCounts[mid] || 0) + (st === 'completed' ? 1 : st === 'partial' ? 0.5 : 0)
      })
    }
    let bestM = null,
      bestMDelta = -Infinity,
      worstM = null,
      worstMDelta = Infinity
    MISSIONS.forEach(m => {
      const delta = (mCounts[m.id] || 0) - (prevCounts[m.id] || 0)
      if (delta > bestMDelta) {
        bestMDelta = delta
        bestM = m
      }
      if (delta < worstMDelta) {
        worstMDelta = delta
        worstM = m
      }
    })
    const diff = cycleScore - prevScore,
      diffStr = diff === 0 ? '=' : diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
    const diffCls = diff > 0 ? 'csc-up' : diff < 0 ? 'csc-down' : 'csc-same'
    const bestDateLabel = bestDate
      ? new Date(bestDate + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '—'
    const goalText = cycleGoals[formatPSTDate(currentCycleStart)] || ''
    body.innerHTML = `
      <div class="csc-goal-row"><div class="csc-goal-label"><i class="fa-solid fa-bullseye"></i> Cycle Goal</div>${goalText ? `<div class="csc-goal-text">"${escapeHtml(goalText)}"</div>` : '<div class="csc-goal-empty">No goal was set for this cycle</div>'}</div>
      <div class="csc-stat"><div class="csc-stat-label">Cycle Score</div><div class="csc-stat-value">${cycleScore.toFixed(1)}</div><div class="csc-stat-sub">of ${nDays * 7} max</div></div>
      <div class="csc-stat"><div class="csc-stat-label">vs Last Cycle</div><div class="csc-stat-value ${diffCls}">${diffStr}</div><div class="csc-stat-sub">prev ${prevScore.toFixed(1)}</div></div>
      <div class="csc-stat"><div class="csc-stat-label">Best Day</div><div class="csc-stat-value" style="font-size:13px">${bestDateLabel}</div><div class="csc-stat-sub">${bestScore > 0 ? bestScore.toFixed(1) + ' pts' : '—'}</div></div>
      <div class="csc-stat"><div class="csc-stat-label">Focus Hours</div><div class="csc-stat-value">${focusTotal.toFixed(1)}<span style="font-size:10px;font-weight:500"> h</span></div><div class="csc-stat-sub">Deep Caliber</div></div>
      ${bestM && bestMDelta > 0 ? `<div class="csc-stat"><div class="csc-stat-label">Improved</div><div class="csc-stat-value csc-up" style="font-size:11px;line-height:1.3">${bestM.name.split(' ')[0]}</div><div class="csc-stat-sub"><span class="csc-up">+${bestMDelta.toFixed(1)}</span> vs prev</div></div>` : ''}
      ${worstM && worstMDelta < 0 ? `<div class="csc-stat"><div class="csc-stat-label">Needs Work</div><div class="csc-stat-value csc-down" style="font-size:11px;line-height:1.3">${worstM.name.split(' ')[0]}</div><div class="csc-stat-sub"><span class="csc-down">${worstMDelta.toFixed(1)}</span> vs prev</div></div>` : ''}
    `
    card.style.display = ''
    document.getElementById('csc-dismiss').onclick = () => {
      localStorage.setItem(dismissKey, '1')
      card.style.display = 'none'
    }
  }

  // ── Strategic insights ────────────────────────────────────────────────────────
  function updateStrategicInsights() {
    const loggedDates = Object.keys(logs).sort(),
      container = document.getElementById('strategic-insights-grid')
    if (!container) return
    if (!loggedDates.length) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-4);font-weight:600;">Track a few days to unlock insights.</div>'
      return
    }
    const n = loggedDates.length,
      allScores = loggedDates.map(d => getCalculatedScoreForDate(d))
    const avgScore = (allScores.reduce((a, b) => a + b, 0) / n).toFixed(2),
      maxScore = Math.max(...allScores)
    const totalPts = allScores.reduce((a, b) => a + b, 0).toFixed(1)
    const perfectStreak = getPerfectDayStreak(),
      perfectDays = loggedDates.filter(d => isPerfectDay(d)).length,
      recoveryRate = getRecoveryRate()
    let earlyScores = [],
      noEarlyScores = [],
      planScores = [],
      noPlanScores = [],
      onTrackScores = [],
      offTrackScores = []
    loggedDates.forEach(d => {
      const s = getCalculatedScoreForDate(d)
      if (logs[d]?.earlyWake) earlyScores.push(s)
      else noEarlyScores.push(s)
      if (logs[d]?.planning) planScores.push(s)
      else noPlanScores.push(s)
      const ot = logs[d]?.onTrack
      if (ot === 'full' || ot === 'partial') onTrackScores.push(s)
      else offTrackScores.push(s)
    })
    const avgE =
      earlyScores.length > 0 ? earlyScores.reduce((a, b) => a + b, 0) / earlyScores.length : 0
    const avgNE =
      noEarlyScores.length > 0 ? noEarlyScores.reduce((a, b) => a + b, 0) / noEarlyScores.length : 0
    const avgP =
      planScores.length > 0 ? planScores.reduce((a, b) => a + b, 0) / planScores.length : 0
    const avgNP =
      noPlanScores.length > 0 ? noPlanScores.reduce((a, b) => a + b, 0) / noPlanScores.length : 0
    const avgOT =
      onTrackScores.length > 0 ? onTrackScores.reduce((a, b) => a + b, 0) / onTrackScores.length : 0
    const avgOff =
      offTrackScores.length > 0
        ? offTrackScores.reduce((a, b) => a + b, 0) / offTrackScores.length
        : 0
    const totalFocus = loggedDates.reduce((s, d) => s + parseFloat(logs[d]?.deepFocus || 0), 0),
      avgFocus = (n > 0 ? totalFocus / n : 0).toFixed(1)
    let correctPred = 0,
      totalPred = 0
    loggedDates.forEach(d => {
      const preds = logs[d]?.predictions
      if (!preds) return
      preds.forEach(p => {
        totalPred++
        if ((logs[d]?.missions?.[p.id] === 'completed') === p.prob >= 50) correctPred++
      })
    })
    const accuracyPct = totalPred > 0 ? Math.round((correctPred / totalPred) * 100) : 0
    const missionStats = MISSIONS.map(m => {
      let comp = 0,
        part = 0,
        streak = 0,
        curS = 0
      loggedDates.forEach(d => {
        const st = logs[d]?.missions?.[m.id]
        if (st === 'completed') comp++
        else if (st === 'partial') part++
      })
      const sorted = loggedDates.filter(d => logs[d]?.missions?.[m.id] === 'completed')
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) {
          curS = 1
          streak = 1
          continue
        }
        if (Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000) === 1) {
          curS++
          streak = Math.max(streak, curS)
        } else curS = 1
      }
      return { ...m, comp, part, streak, compPct: n > 0 ? Math.round((comp / n) * 100) : 0 }
    }).sort((a, b) => b.compPct - a.compPct)
    const dowSums = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      dowCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    loggedDates.forEach(d => {
      const [y, mo, dy] = d.split('-').map(Number),
        dow = new Date(y, mo - 1, dy).getDay()
      dowSums[dow] += getCalculatedScoreForDate(d)
      dowCounts[dow]++
    })
    const dowAvgs = Array.from({ length: 7 }, (_, i) =>
      dowCounts[i] > 0 ? (dowSums[i] / dowCounts[i]).toFixed(1) : '—'
    )
    const dowMax = Math.max(
      ...Array.from({ length: 7 }, (_, i) => (dowCounts[i] > 0 ? dowSums[i] / dowCounts[i] : 0))
    )
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      dowColors = [
        'var(--rose)',
        'var(--cyan)',
        'var(--green)',
        'var(--accent)',
        'var(--gold)',
        'var(--violet)',
        'var(--teal)',
      ]
    const momentum = (getMomentumCoefficient() * 100).toFixed(0),
      activeDays = allScores.filter(s => s > 0).length,
      consistencyPct = n > 0 ? Math.round((activeDays / n) * 100) : 0
    function siMini(color, label, val, sub) {
      return `<div class="si-mini-card"><div class="si-mini-label" style="color:${color};"><i class="fa-solid fa-chart-pie"></i> ${label}</div><div class="si-mini-val" style="color:var(--text-1)">${val}</div><div class="si-mini-sub">${sub}</div></div>`
    }
    let html = ''
    html += `<div class="si-section-title">Core Performance</div><div class="si-grid-4">${siMini('var(--accent)', 'Avg Daily Score', avgScore + ' pts', `Over ${n} logged days`)}${siMini('var(--green)', 'Total Points', totalPts + ' pts', `${n} days tracked`)}${siMini('var(--cyan)', 'Perfect Day Streak', perfectStreak + ' days', `${perfectDays} perfect days all-time`)}${siMini('var(--teal)', 'Recovery Rate', recoveryRate + ' days', 'Avg days back to perfect')}</div>`
    html += `<div class="si-section-title">Habit Correlations</div><div class="si-grid-4">${siMini('var(--gold)', 'Early Wake Effect', (avgE - avgNE > 0 ? '+' : '') + (avgE - avgNE).toFixed(2) + ' pts', 'Early avg: ' + avgE.toFixed(1))}${siMini('var(--violet)', 'Planning Impact', (avgP - avgNP > 0 ? '+' : '') + (avgP - avgNP).toFixed(2) + ' pts', 'Planned avg: ' + avgP.toFixed(1))}${siMini('var(--amber)', 'On-Track Impact', (avgOT - avgOff > 0 ? '+' : '') + (avgOT - avgOff).toFixed(2) + ' pts', 'On-track avg: ' + avgOT.toFixed(1))}${siMini('var(--cyan)', 'Deep Focus Total', totalFocus.toFixed(1) + ' h', 'Avg ' + avgFocus + 'h/day')}</div>`
    html += `<div class="si-section-title">Momentum & Consistency</div><div class="si-grid-4">${siMini('var(--green)', 'Momentum Index', momentum + '%', 'Weighted recent performance')}${siMini('var(--cyan)', 'Consistency', consistencyPct + '%', `${activeDays} active days`)}${siMini('var(--gold)', 'Best Single Day', maxScore + ' pts', 'All-time highest')}${siMini('var(--rose)', 'AI Accuracy', accuracyPct + '%', `${correctPred} correct predictions`)}</div>`
    html += `<div class="si-section-title">Mission Completion Rates</div><div class="si-grid-7">`
    missionStats.forEach(m => {
      html += `<div class="si-mission-card" style="--m-color:${m.color};--m-rgb:${m.rgb}"><div class="si-mission-top"><div class="si-mission-icon"><i class="fa-solid ${m.icon}"></i></div><div class="si-mission-pct">${m.compPct}%</div></div><div class="si-mission-name">${m.name}</div><div class="pred-bar-bg" style="height:4px;"><div class="pred-bar-fill" style="width:${m.compPct}%;"></div></div><div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;"><span>${m.comp} done</span><span style="color:var(--gold)">🔥${m.streak}</span></div></div>`
    })
    html += `</div><div class="si-section-title">Day-of-Week Averages</div><div class="pred-card" style="--m-color:var(--accent);--m-rgb:79, 70, 229;"><div class="dow-grid">`
    for (let i = 0; i < 7; i++) {
      const val = dowCounts[i] > 0 ? dowSums[i] / dowCounts[i] : 0,
        hp = dowMax > 0 ? Math.round((val / dowMax) * 100) : 0
      html += `<div class="dow-cell"><div class="dow-label">${dowNames[i]}</div><div class="dow-bar-wrap"><div class="dow-bar-fill" style="height:${hp}%;background:${dowColors[i]};"></div></div><div class="dow-val">${dowAvgs[i]}</div></div>`
    }
    html += `</div></div>`
    container.innerHTML = html
  }

  // ── Streak / toggle mission ───────────────────────────────────────────────────
  function getStreakLength(mid, checkDate) {
    if (logs[formatPSTDate(checkDate)]?.missions?.[mid] !== 'completed') return 0
    let len = 1,
      back = new Date(checkDate),
      fwd = new Date(checkDate)
    while (
      logs[formatPSTDate(new Date(back.setDate(back.getDate() - 1)))]?.missions?.[mid] ===
      'completed'
    )
      len++
    while (
      logs[formatPSTDate(new Date(fwd.setDate(fwd.getDate() + 1)))]?.missions?.[mid] === 'completed'
    )
      len++
    return len
  }

  function toggleMission(el) {
    const date = el.dataset.date,
      mid = el.dataset.mid
    if (!logs[date]) logs[date] = { missions: {} }
    if (!logs[date].missions) logs[date].missions = {}
    const cur = logs[date].missions[mid]
    logs[date].missions[mid] = !cur ? 'partial' : cur === 'partial' ? 'completed' : null
    if (!logs[date].missions[mid]) delete logs[date].missions[mid]
    saveToLocal()
    renderGrid()
    if (inpDate.value !== date) inpDate.value = date
    updateDailyWidgets(date)
    updateInsights()
    calculateAI_Predictions()
  }

  function updateVisuals() {
    document.querySelectorAll('.cell-action').forEach(el => {
      const ds = el.dataset.date,
        mid = el.dataset.mid,
        st = logs[ds]?.missions?.[mid]
      const [y, m, d] = ds.split('-').map(Number)
      el.classList.toggle('streak-line', getStreakLength(mid, new Date(y, m - 1, d)) > 6)
      let html = `<div class="status-mark st-none"></div>`
      if (st === 'partial') html = `<div class="status-mark st-part"></div>`
      if (st === 'completed')
        html = `<div class="status-mark st-done"><i class="fa-solid fa-check"></i></div>`
      el.innerHTML = html
    })
  }

  // ── Daily widgets ─────────────────────────────────────────────────────────────
  function updateDailyWidgets(dateStr) {
    const score = getCalculatedScoreForDate(dateStr)
    displayPts.innerText = score.toFixed(1)
    displayPts.style.color = score === 0 ? 'var(--text-3)' : getIntensityColor(score)
    if (inpDate.value === dateStr) {
      const noteVal = logs[dateStr]?.note || ''
      inpNote.value = noteVal
      noteCharCount.textContent = `${noteVal.length} / 200`
      noteCharCount.classList.toggle('warn', noteVal.length > 170)
      const energy = logs[dateStr]?.energy || null
      ;['low', 'medium', 'high'].forEach(lvl => {
        const btn = document.getElementById(`btn-energy-${lvl}`)
        btn.className = `energy-btn${energy === lvl ? ` active-${lvl}` : ''}`
        btn.setAttribute('aria-pressed', energy === lvl ? 'true' : 'false')
      })
      inpDeepFocus.value = logs[dateStr]?.deepFocus || ''
      const isEarly = !!logs[dateStr]?.earlyWake
      btnEarlyWake.classList.toggle('active', isEarly)
      btnEarlyWake.innerHTML = isEarly
        ? '<i class="fa-solid fa-check"></i> Early Wake Up'
        : '<i class="fa-regular fa-clock"></i> Early Wake Up'
      const isPlan = !!logs[dateStr]?.planning
      btnPlanning.classList.toggle('active-planning', isPlan)
      btnPlanning.innerHTML = isPlan
        ? '<i class="fa-solid fa-check"></i> Planned'
        : '<i class="fa-solid fa-calendar-plus"></i> Planning'
      const ot = logs[dateStr]?.onTrack
      btnOnTrack.classList.remove('active-ontrack-partial', 'active-ontrack-full')
      if (ot === 'partial') {
        btnOnTrack.classList.add('active-ontrack-partial')
        btnOnTrack.innerHTML = '<i class="fa-solid fa-minus"></i> &lt; 50% On Track'
      } else if (ot === 'full') {
        btnOnTrack.classList.add('active-ontrack-full')
        btnOnTrack.innerHTML = '<i class="fa-solid fa-check-double"></i> &gt; 50% On Track'
      } else {
        btnOnTrack.innerHTML = '<i class="fa-solid fa-route"></i> On Track?'
      }
    }
    updateMonthProgress(dateStr)
    updateWeekWidget(dateStr)
    updateCalendarWidget(dateStr)
    updateMissionRing(dateStr)
  }

  // ── Mission ring ──────────────────────────────────────────────────────────────
  function updateMissionRing(dateStr) {
    const svg = document.getElementById('ring-svg'),
      barsEl = document.getElementById('ring-bars')
    if (!svg || !barsEl) return
    const missions = (logs[dateStr] || {}).missions || {}
    svg.querySelectorAll('.orbital-track,.orbital-arc').forEach(s => s.remove())
    const CX = 60,
      CY = 60,
      SW = 4,
      RADII = [55, 48, 41, 34, 27, 20, 13]
    MISSIONS.forEach((m, i) => {
      const r = RADII[i],
        C = 2 * Math.PI * r,
        status = missions[m.id] || null
      const isComp = status === 'completed',
        isPart = status === 'partial'
      const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      track.setAttribute('class', 'orbital-track')
      track.setAttribute('cx', CX)
      track.setAttribute('cy', CY)
      track.setAttribute('r', r)
      track.setAttribute('stroke', m.color)
      track.setAttribute('stroke-width', SW)
      track.setAttribute('fill', 'none')
      track.setAttribute('opacity', '0.1')
      svg.appendChild(track)
      if (!isComp && !isPart) return
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      arc.setAttribute('class', `orbital-arc ${isComp ? 'completed' : 'partial'}`)
      arc.setAttribute('cx', CX)
      arc.setAttribute('cy', CY)
      arc.setAttribute('r', r)
      arc.setAttribute('stroke', m.color)
      arc.setAttribute('stroke-width', SW)
      arc.setAttribute('fill', 'none')
      if (isComp) {
        arc.setAttribute('stroke-dasharray', `${C} 0`)
        arc.setAttribute('stroke-dashoffset', '0')
        arc.style.filter = `drop-shadow(0 0 5px ${m.color})`
      } else {
        const half = C / 2
        arc.setAttribute('stroke-dasharray', `${half} ${half}`)
        arc.setAttribute('stroke-dashoffset', `${-half / 2}`)
      }
      svg.appendChild(arc)
    })
    barsEl.innerHTML = ''
    MISSIONS.forEach(m => {
      const status = missions[m.id] || null,
        fillPct = status === 'completed' ? 100 : status === 'partial' ? 50 : 0
      const glow = fillPct === 100 ? `box-shadow:0 0 5px ${m.color}55` : '',
        sym = fillPct === 100 ? '✓' : fillPct === 50 ? '½' : '–',
        symColor = fillPct > 0 ? m.color : 'var(--text-4)'
      const row = document.createElement('div')
      row.className = 'ring-bar-row'
      row.title = `${m.name}: ${status || '—'}`
      row.innerHTML = `<i class="fa-solid ${m.icon} ring-bar-icon" style="color:${m.color}${fillPct === 0 ? ';opacity:0.3' : ''}"></i><div class="ring-bar-track"><div class="ring-bar-fill" style="width:${fillPct}%;background:${m.color};${glow}"></div></div><span class="ring-bar-status" style="color:${symColor}">${sym}</span>`
      barsEl.appendChild(row)
    })
  }

  // ── Insights ──────────────────────────────────────────────────────────────────
  function updateInsights() {
    const ds = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      dc = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    for (const dateStr in logs) {
      const score = getCalculatedScoreForDate(dateStr)
      if (score > 0) {
        const [y, m, d] = dateStr.split('-').map(Number),
          day = new Date(y, m - 1, d).getDay()
        ds[day] += score
        dc[day]++
      }
    }
    let bestDay = -1,
      maxAvg = -1
    for (let i = 0; i < 7; i++)
      if (dc[i] > 0 && ds[i] / dc[i] > maxAvg) {
        maxAvg = ds[i] / dc[i]
        bestDay = i
      }
    document.getElementById('disp-best-day').innerText =
      bestDay > -1 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][bestDay] : '—'
    const ls = {},
      tc = {}
    MISSIONS.forEach(m => {
      ls[m.id] = 0
      tc[m.id] = 0
    })
    for (const m of MISSIONS) {
      const dates = Object.keys(logs)
        .filter(d => logs[d]?.missions?.[m.id] === 'completed')
        .sort()
      tc[m.id] = dates.length
      let maxS = 0,
        curS = 0
      for (let i = 0; i < dates.length; i++) {
        if (i === 0) {
          curS = 1
          maxS = 1
          continue
        }
        if (Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000) === 1) {
          curS++
          maxS = Math.max(maxS, curS)
        } else curS = 1
      }
      ls[m.id] = maxS
    }
    const ss = Object.entries(ls).sort((a, b) => b[1] - a[1])
    document.getElementById('lbl-best').innerText =
      ss[0][1] > 0 ? MISSIONS.find(m => m.id === ss[0][0]).name : '—'
    const sc2 = Object.entries(tc).sort((a, b) => a[1] - b[1])
    document.getElementById('lbl-worst').innerText =
      sc2.length > 0 ? MISSIONS.find(m => m.id === sc2[0][0]).name : '—'
    updateEnergyCorrelation()
  }

  function updateEnergyCorrelation() {
    const groups = { low: [], medium: [], high: [] }
    Object.entries(logs).forEach(([date, log]) => {
      if (!log?.energy || !groups[log.energy]) return
      groups[log.energy].push(getCalculatedScoreForDate(date))
    })
    const fmt = arr =>
      arr.length
        ? `${(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)} pts (${arr.length}d)`
        : '—'
    document.getElementById('energy-corr-high').textContent = fmt(groups.high)
    document.getElementById('energy-corr-med').textContent = fmt(groups.medium)
    document.getElementById('energy-corr-low').textContent = fmt(groups.low)
  }

  // ── Year/cycle progress ───────────────────────────────────────────────────────
  function calcYearProgress(nowDate) {
    const start = new Date(nowDate.getFullYear(), 0, 0),
      doy = Math.floor((nowDate - start) / 86400000)
    const yr = nowDate.getFullYear(),
      total = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0 ? 366 : 365
    dispDay.innerText = doy
    dispPct.innerText = ((doy / total) * 100).toFixed(1)
  }

  // ── Shortcuts modal ───────────────────────────────────────────────────────────
  let _plusCount = 0,
    _plusTimer = null
  const shortcutsModal = document.getElementById('shortcuts-modal')
  function openShortcuts() {
    shortcutsModal.classList.add('active')
    shortcutsModal._releaseTrap = window.trapFocus(shortcutsModal)
  }
  function closeShortcuts() {
    shortcutsModal.classList.remove('active')
    shortcutsModal._releaseTrap?.()
  }
  function toggleShortcuts() {
    shortcutsModal.classList.contains('active') ? closeShortcuts() : openShortcuts()
  }
  document.getElementById('btn-show-shortcuts').addEventListener('click', toggleShortcuts)
  document.getElementById('btn-close-shortcuts').addEventListener('click', closeShortcuts)
  shortcutsModal.addEventListener('click', e => {
    if (e.target === shortcutsModal) closeShortcuts()
  })

  // ── Events ────────────────────────────────────────────────────────────────────
  inpDate.addEventListener('change', e => updateDailyWidgets(e.target.value))
  ;['low', 'medium', 'high'].forEach(lvl => {
    document.getElementById(`btn-energy-${lvl}`).addEventListener('click', () => {
      const date = inpDate.value
      if (!logs[date]) logs[date] = { missions: {} }
      logs[date].energy = logs[date].energy === lvl ? undefined : lvl
      if (!logs[date].energy) delete logs[date].energy
      saveToLocal()
      updateDailyWidgets(date)
      updateEnergyCorrelation()
    })
  })
  inpNote.addEventListener('input', e => {
    const val = e.target.value
    noteCharCount.textContent = `${val.length} / 200`
    noteCharCount.classList.toggle('warn', val.length > 170)
    if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }
    if (val.trim()) logs[inpDate.value].note = val
    else delete logs[inpDate.value].note
    saveToLocal()
  })
  inpDeepFocus.addEventListener('input', e => {
    if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }
    logs[inpDate.value].deepFocus = e.target.value
    saveToLocal()
  })
  btnEarlyWake.addEventListener('click', () => {
    if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }
    logs[inpDate.value].earlyWake = !logs[inpDate.value].earlyWake
    saveToLocal()
    try {
      const _dk = inpDate.value,
        _mData = JSON.parse(localStorage.getItem('mastery_data') || '{}')
      _mData[_dk] = _mData[_dk] || []
      if (logs[_dk].earlyWake) {
        if (!_mData[_dk].includes('wakeup')) _mData[_dk].push('wakeup')
      } else {
        const _i = _mData[_dk].indexOf('wakeup')
        if (_i > -1) _mData[_dk].splice(_i, 1)
      }
      localStorage.setItem('mastery_data', JSON.stringify(_mData))
      saveCloudKey('mastery_data', _mData)
      _nexusSync.broadcast('VANGUARD')
    } catch (_) {}
    updateDailyWidgets(inpDate.value)
  })
  btnPlanning.addEventListener('click', () => {
    if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }
    logs[inpDate.value].planning = !logs[inpDate.value].planning
    saveToLocal()
    updateDailyWidgets(inpDate.value)
  })
  btnOnTrack.addEventListener('click', () => {
    if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }
    const s = logs[inpDate.value].onTrack
    if (!s) logs[inpDate.value].onTrack = 'partial'
    else if (s === 'partial') logs[inpDate.value].onTrack = 'full'
    else delete logs[inpDate.value].onTrack
    saveToLocal()
    updateDailyWidgets(inpDate.value)
  })
  document.getElementById('btn-prev').addEventListener('click', () => shiftCycle(-1))
  document.getElementById('btn-next').addEventListener('click', () => shiftCycle(1))
  document.getElementById('btn-today').addEventListener('click', jumpToToday)
  document.getElementById('btn-export-predictions').addEventListener('click', () => {
    if (!latestPredictions?.length) {
      alert('No prediction data.')
      return
    }
    let csv = 'Mission Name,Probability (%)\n'
    latestPredictions.forEach(i => {
      csv += `"${i.mission.name}",${Math.round(i.prob)}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vanguard_predictions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })
  document.getElementById('inp-cycle-goal').addEventListener('input', e => {
    const val = e.target.value,
      csKey = formatPSTDate(currentCycleStart)
    const cc = document.getElementById('goal-char-count')
    cc.textContent = `${val.length} / 150`
    cc.classList.toggle('warn', val.length > 120)
    if (val.trim()) cycleGoals[csKey] = val
    else delete cycleGoals[csKey]
    saveCycleGoals()
  })

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  const _keyHandler = e => {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'Escape') {
      closeShortcuts()
      closeDetailModal()
    }
    if (e.key === '?') {
      toggleShortcuts()
      e.preventDefault()
    }
    if (e.key === 'm' || e.key === 'M') location.hash = 'mastery'
    if (e.key === 'n' || e.key === 'N') location.hash = ''
    if (e.key === 't' || e.key === 'T') jumpToToday()
    if (e.key === 'ArrowLeft') shiftCycle(-1)
    if (e.key === 'ArrowRight') shiftCycle(1)
    if (e.key === 'd' || e.key === 'D') {
      theme = theme === 'dark' ? 'cyber' : 'dark'
      applyTheme()
    }
    if (e.key === 's' || e.key === 'S') {
      sidebarCollapsed = !sidebarCollapsed
      localStorage.setItem('matrix-sidebar-collapsed', sidebarCollapsed)
      applySidebarState()
    }
    if (e.key === 'h' || e.key === 'H') {
      widgetsHidden = !widgetsHidden
      localStorage.setItem('matrix-widgets-hidden', widgetsHidden)
      applyWidgetsState()
    }
    if (e.key === '+') {
      _plusCount = (_plusCount || 0) + 1
      clearTimeout(_plusTimer)
      _plusTimer = setTimeout(() => {
        const date = inpDate.value
        if (!logs[date]) logs[date] = { missions: {} }
        if (_plusCount === 1) logs[date].onTrack = 'partial'
        else if (_plusCount === 2) logs[date].onTrack = 'full'
        else delete logs[date].onTrack
        _plusCount = 0
        saveToLocal()
        updateDailyWidgets(date)
        const btn = document.getElementById('btn-on-track')
        if (btn) {
          btn.style.transition = 'box-shadow 0.2s'
          btn.style.boxShadow = '0 0 0 3px var(--accent)'
          setTimeout(() => {
            btn.style.boxShadow = ''
          }, 900)
        }
      }, 400)
    }
    if (e.key === 'p' || e.key === 'P') {
      btnPlanning.click()
      btnPlanning.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (e.key === 'e' || e.key === 'E') {
      btnEarlyWake.click()
      btnEarlyWake.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (e.key === 'o' || e.key === 'O') {
      const btn = document.getElementById('btn-on-track')
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' })
        btn.style.transition = 'box-shadow 0.2s'
        btn.style.boxShadow = '0 0 0 3px var(--accent)'
        setTimeout(() => {
          btn.style.boxShadow = ''
        }, 1200)
      }
    }
    if (e.key === 'a' || e.key === 'A') {
      const note = document.getElementById('inp-note')
      if (note) {
        note.focus()
        note.select()
        e.preventDefault()
      }
    }
    if (e.key === 'i' || e.key === 'I') {
      const siw = document.getElementById('strategic-insights-widget')
      if (siw) {
        siw.scrollIntoView({ behavior: 'smooth', block: 'start' })
        siw.style.transition = 'box-shadow 0.2s'
        siw.style.boxShadow = '0 0 0 3px var(--accent)'
        setTimeout(() => {
          siw.style.boxShadow = ''
        }, 1200)
      }
    }
    const num = parseInt(e.key)
    if (num >= 1 && num <= MISSIONS.length) {
      const mid = MISSIONS[num - 1].id,
        date = inpDate.value,
        cell = table.querySelector(`td[data-date="${date}"][data-mid="${mid}"]`)
      if (cell) toggleMission(cell)
    }
  }
  document.addEventListener('keydown', _keyHandler)

  // ── Live sync ─────────────────────────────────────────────────────────────────
  _nexusSync.listen(() => {
    loadFromLocal()
    renderGrid()
  })

  // ── Init ──────────────────────────────────────────────────────────────────────
  loadFromLocal()
  loadCycleGoals()
  try {
    const _mData = JSON.parse(localStorage.getItem('mastery_data') || '{}')
    const _todayStr = formatPSTDate(getPSTDate())
    if ((_mData[_todayStr] || []).includes('wakeup') && !logs[_todayStr]?.earlyWake) {
      if (!logs[_todayStr]) logs[_todayStr] = { missions: {} }
      logs[_todayStr].earlyWake = true
      saveToLocal()
    }
  } catch (_) {}
  const pstNow = getPSTDate()
  currentCycleStart = getCycleStart(pstNow)
  inpDate.value = formatPSTDate(pstNow)
  updateDailyWidgets(inpDate.value)
  calcYearProgress(pstNow)
  renderGrid()
  updateInsights()
  calculateAI_Predictions()

  // Apply theme to body (vanguard has light/dark)
  applyTheme()

  return function destroy() {
    document.removeEventListener('keydown', _keyHandler)
    // Remove theme classes — reset body for other views
    body.classList.remove('theme-dark', 'theme-cyber')
    container.innerHTML = ''
  }
}
