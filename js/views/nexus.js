/**
 * views/nexus.js — NEXUS hub dashboard view.
 * Exports init(container, user) → destroy fn.
 */

import { saveCloudKey as _saveCloudKey } from '../appwrite-sync.js'

const TEMPLATE = /* html */`
  <div class="ambient-tl"></div>
  <div class="ambient-tr"></div>
  <div class="ambient-br"></div>

  <canvas id="nodeCanvas"></canvas>

  <div class="day-timer-widget">
    <div class="dt-header-label">Day Timer</div>
    <div class="dt-slots">
      <div class="dt-unit"><div class="dt-num" id="dtH">--</div><div class="dt-lbl">HRS</div></div>
      <div class="dt-sep">:</div>
      <div class="dt-unit"><div class="dt-num" id="dtM">--</div><div class="dt-lbl">MIN</div></div>
      <div class="dt-sep">:</div>
      <div class="dt-unit"><div class="dt-num" id="dtS">--</div><div class="dt-lbl">SEC</div></div>
    </div>
    <div class="dt-bar-wrap"><div class="dt-bar-fill" id="dtBarFill" style="width:0%"></div></div>
    <div class="dt-sublabel" id="dtSublabel">Current Time</div>
  </div>

  <div class="header-right">
    <div class="clock-header-label">Day Countdown</div>
    <div class="clock-slots">
      <div class="clock-unit"><div class="clock-time" id="clockH">--</div><div class="clock-unit-lbl">HRS</div></div>
      <div class="clock-sep">:</div>
      <div class="clock-unit"><div class="clock-time" id="clockM">--</div><div class="clock-unit-lbl">MIN</div></div>
      <div class="clock-sep">:</div>
      <div class="clock-unit"><div class="clock-time" id="clockS">--</div><div class="clock-unit-lbl">SEC</div></div>
    </div>
    <div class="clock-bar-wrap"><div class="clock-bar-fill" id="clockBarFill" style="width:0%"></div></div>
    <div class="clock-sublabel" id="clockRemLabel">Until Midnight</div>
  </div>

  <div class="ticker-wrap">
    <div class="ticker-label">SYSTEM FEED</div>
    <div class="ticker-track"><div class="ticker-inner" id="tickerInner"></div></div>
  </div>

  <div class="page-wrap">
    <header class="nexus-header">
      <div class="brand">
        <div class="brand-sigil"><i class="fa-solid fa-layer-group"></i></div>
        <div class="brand-text"><h1>NEXUS</h1><p>Unified Command Hub</p></div>
      </div>

      <div class="header-mini-widgets">
        <div class="mini-widget">
          <div class="mini-widget-name mastery-color" id="mwMasteryLink">MASTERY</div>
          <div class="mini-widget-stat" id="mwMasteryStat">-- / -- RITUALS</div>
          <div class="mini-widget-bar-wrap"><div class="mini-widget-bar mastery-bar" id="mwMasteryBar" style="width:0%"></div></div>
        </div>
        <div class="mini-widget">
          <div class="mini-widget-name vanguard-color" id="mwVanguardLink">VANGUARD</div>
          <div class="mini-widget-stat" id="mwVanguardStat">-- / -- MISSIONS</div>
          <div class="mini-widget-bar-wrap"><div class="mini-widget-bar vanguard-bar" id="mwVanguardBar" style="width:0%"></div></div>
        </div>
        <div class="mini-widget-divider"></div>
        <div class="mini-widget streak-widget">
          <div class="streak-sweep"></div>
          <i class="fa-solid fa-fire streak-icon"></i>
          <div class="mini-widget-name streak-color"><i class="fa-solid fa-fire"></i>STREAK</div>
          <div class="mini-widget-stat" id="mwStreakStat">-- DAYS</div>
          <div class="mini-widget-bar-wrap"><div class="mini-widget-bar streak-bar" id="mwStreakBar" style="width:0%"></div></div>
        </div>
      </div>

      <div id="authBox">
        <div id="authUser" style="display:flex;align-items:center;gap:10px;">
          <span id="greetingText" class="greeting-text"></span>
          <button id="btnSignOut">Sign Out</button>
        </div>
      </div>
    </header>

    <div class="time-matrix panel" id="timeMatrixContainer">
      <div class="today-widget">
        <div class="today-date" id="todayDateNum">--</div>
        <div class="today-meta">
          <div class="today-day" id="todayDayName">-------</div>
          <div class="today-month" id="todayMonthYear">---- ----</div>
        </div>
      </div>
      <div class="month-timeline">
        <div class="timeline-header">
          <span>Monthly Cycle Progress</span>
          <span id="monthProgressPct">--% COMPLETE</span>
        </div>
        <div class="bricks-container" id="bricksContainer"></div>
      </div>
      <div class="delta-widget" id="dayDeltaWidget">
        <div class="delta-label">Comparison (vs Yesterday)</div>
        <div class="delta-main">
          <div class="delta-arrow" id="deltaArrow" style="color:var(--text-dim)">—</div>
          <div class="delta-pct" id="deltaPct" style="color:var(--text-dim)">—</div>
          <div class="delta-sub" id="deltaSub"></div>
        </div>
        <div class="delta-bars" id="deltaBars"></div>
      </div>
    </div>

    <div class="week-panel panel" id="weekPanel">
      <div class="week-tab-btns">
        <button class="week-tab-btn active" id="wtbPlanning"
          style="--wtb-color:#38bdf8;--wtb-rgb:56,189,248;--wtb-gradient:linear-gradient(135deg,#38bdf8,#0284c7)"
          data-tab="planning">
          <i class="fa-solid fa-calendar-check wtb-icon"></i>
          <span class="wtb-label">Planning</span>
          <span class="wtb-count" id="wtbPlanningCount">—/7</span>
        </button>
        <button class="week-tab-btn" id="wtbTracking"
          style="--wtb-color:#e879f9;--wtb-rgb:232,121,249;--wtb-gradient:linear-gradient(135deg,#f0abfc,#e879f9)"
          data-tab="tracking">
          <i class="fa-solid fa-chart-line wtb-icon"></i>
          <span class="wtb-label">Tracking</span>
          <span class="wtb-count" id="wtbTrackingCount">—/7</span>
        </button>
        <button class="week-tab-btn" id="wtbOntrack"
          style="--wtb-color:#9ca3af;--wtb-rgb:156,163,175;--wtb-gradient:linear-gradient(135deg,#d1d5db,#6b7280)"
          data-tab="ontrack">
          <i class="fa-solid fa-route wtb-icon"></i>
          <span class="wtb-label">OnTrack</span>
          <span class="wtb-count" id="wtbOntrackCount">—/7</span>
        </button>
      </div>

      <div class="week-stats">
        <div class="week-stats-header">
          <div class="week-stats-title" id="weekStatsTitle">This Week · Planning</div>
        </div>
        <div class="week-day-row" id="weekDayRow"></div>
        <div class="week-bottom">
          <div>
            <div class="week-main-stat">
              <span class="week-stat-num" id="weekStatNum">—</span>
              <span class="week-stat-denom">/7</span>
            </div>
            <div class="week-stat-lbl">days this week</div>
          </div>
          <div class="week-vs">
            <div class="week-vs-label">vs prev week</div>
            <div class="week-vs-delta" id="weekVsDelta">—</div>
            <div class="week-vs-prev" id="weekVsPrev">prev: — days</div>
          </div>
        </div>
      </div>
    </div>

    <div class="readiness-banner panel">
      <div class="rb-score-col">
        <div class="rb-score-eyebrow">READINESS</div>
        <span id="gaugePct">—</span>
        <div class="rb-score-bar-wrap"><div class="rb-score-bar-fill" id="scoreFill"></div></div>
      </div>
      <div class="rb-meta-col">
        <div class="rb-eyebrow">// System Readiness Overview</div>
        <div class="readiness-title" id="readinessTitle">LOADING...</div>
        <div class="mini-bars" id="miniBars"></div>
      </div>
      <div class="rb-stats-col">
        <div class="readiness-stats" id="globalStats"></div>
      </div>
    </div>

    <div class="app-grid" id="appGrid"></div>

    <footer class="nexus-footer">
      <div class="footer-left">
        <span class="pulse-dot"></span>
        Systems Active · Synced via Appwrite Cloud
      </div>
      <div id="lastRefresh">LAST SYNC —</div>
    </footer>
  </div>
`

export async function init(container, user) {
  container.innerHTML = TEMPLATE

  // Wire mini-widget navigation links
  document.getElementById('mwMasteryLink').style.cursor = 'pointer'
  document.getElementById('mwMasteryLink').addEventListener('click', () => { location.hash = 'mastery' })
  document.getElementById('mwVanguardLink').style.cursor = 'pointer'
  document.getElementById('mwVanguardLink').addEventListener('click', () => { location.hash = 'vanguard' })

  // Sign out
  document.getElementById('btnSignOut').onclick = () => window._nexusSignOut?.()

  // Show greeting
  if (user) {
    const greetEl = document.getElementById('greetingText')
    if (greetEl) greetEl.textContent = user.email || 'Welcome back!'
    document.getElementById('authUser').style.display = 'flex'
  }

  // ── Local refs ──────────────────────────────────────────────────────────────
  const _nexusSync  = window._nexusSync
  const todayKey    = window.todayKey
  const safeJSON    = window.safeJSON
  let   saveCloudKey = _saveCloudKey

  const RITUAL_KEYS  = ['english','greenmoney','fitness','reading','learning','wakeup','sugarfree','badhabit']
  const RITUAL_NAMES = { english:'English', greenmoney:'Money', fitness:'Fitness', reading:'Reading', learning:'Learning', wakeup:'Wake-up', sugarfree:'No Sugar', badhabit:'Anti-Habit' }
  const VANGUARD_MISSIONS = ['m1','m2','m3','m4','m5','m6','m7']
  const VANGUARD_NAMES    = { m1:'Deep Work', m2:'Physical', m3:'Fuel', m4:'Knowledge', m5:'Linguistic', m6:'Mental', m7:'Recovery' }

  // ── Clock ────────────────────────────────────────────────────────────────────
  function updateClock() {
    const now = new Date()
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0)
    const diffMs = midnight - now
    const totalSec = Math.floor(diffMs / 1000)
    const hh = Math.floor(totalSec / 3600)
    const mm = Math.floor((totalSec % 3600) / 60)
    const ss = totalSec % 60
    const pad = n => String(n).padStart(2, '0')
    document.getElementById('clockH').textContent = pad(hh)
    document.getElementById('clockM').textContent = pad(mm)
    document.getElementById('clockS').textContent = pad(ss)
    const elapsedSec = 86400 - totalSec
    document.getElementById('clockBarFill').style.width = ((elapsedSec / 86400) * 100).toFixed(2) + '%'

    const h12 = now.getHours() % 12 || 12
    const ampm = now.getHours() < 12 ? 'AM' : 'PM'
    document.getElementById('dtH').textContent = pad(h12)
    document.getElementById('dtM').textContent = pad(now.getMinutes())
    document.getElementById('dtS').textContent = pad(now.getSeconds())
    document.getElementById('dtBarFill').style.width = ((elapsedSec / 86400) * 100).toFixed(2) + '%'
    document.getElementById('dtSublabel').textContent = ampm
  }

  // ── Time matrix ──────────────────────────────────────────────────────────────
  function updateTimeMatrix() {
    const now = new Date()
    const year = now.getFullYear(), month = now.getMonth(), date = now.getDate()
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December']

    const tmContainer = document.getElementById('timeMatrixContainer')
    const dColor = date <= 9 ? '#38bdf8' : date <= 19 ? '#c084fc' : '#fbbf24'
    tmContainer.style.setProperty('--date-color', dColor)

    const dateColor = date <= 10 ? '#39ff14' : date <= 20 ? '#00cfff' : '#ff8c00'
    const dateNumEl = document.getElementById('todayDateNum')
    dateNumEl.textContent = String(date).padStart(2, '0')
    dateNumEl.style.color = dateColor
    document.getElementById('todayDayName').textContent  = days[now.getDay()]
    document.getElementById('todayMonthYear').textContent = `${monthsFull[month]} ${year}`

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let bricksHTML = '', completedDays = 0
    for (let i = 1; i <= daysInMonth; i++) {
      let stateClass = 'future'
      if (i < date) { stateClass = 'past'; completedDays++ }
      else if (i === date) { stateClass = 'current'; completedDays++ }
      const isSunday = new Date(year, month, i).getDay() === 0
      const sundayClass = isSunday ? ' sunday' : ''
      const brickColor = i <= 10 ? '#39ff14' : i <= 20 ? '#00cfff' : '#ff8c00'
      const brickStyle = stateClass !== 'future'
        ? ` style="background:${brickColor};${stateClass === 'current' ? `box-shadow:0 0 12px ${brickColor}66;` : 'opacity:0.5;'}"`
        : ''
      bricksHTML += `<div class="brick ${stateClass}${sundayClass}"${brickStyle} title="${monthsFull[month]} ${i}${isSunday ? ' (Sun)' : ''}"></div>`
    }
    document.getElementById('bricksContainer').innerHTML = bricksHTML
    document.getElementById('monthProgressPct').textContent = `${Math.round((completedDays / daysInMonth) * 100)}% COMPLETE`
  }

  // ── Data readers ─────────────────────────────────────────────────────────────
  function readMastery() {
    const today = todayKey()
    const db = safeJSON('mastery_data', {})
    const todayRituals = Array.isArray(db[today]) ? db[today] : []
    let streak = 0
    const check = new Date()
    for (let i = 0; i < 365; i++) {
      const k = `${check.getFullYear()}-${String(check.getMonth()+1).padStart(2,'0')}-${String(check.getDate()).padStart(2,'0')}`
      if (!db[k] || db[k].length === 0) break
      streak++
      check.setDate(check.getDate() - 1)
    }
    return { completed: todayRituals.length, total: 8, pct: Math.round((todayRituals.length/8)*100), completedIds: todayRituals, streak, hasData: Object.keys(db).length > 0 }
  }

  function readVanguard() {
    const pst = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
    const today = `${pst.getFullYear()}-${String(pst.getMonth()+1).padStart(2,'0')}-${String(pst.getDate()).padStart(2,'0')}`
    const db = safeJSON('vanguard-logs', {})
    const dayLog = db[today] || {}
    const missions = dayLog.missions || {}
    const completedCount = VANGUARD_MISSIONS.filter(id => missions[id] === 'completed').length
    const partialCount   = VANGUARD_MISSIONS.filter(id => missions[id] === 'partial').length
    const effectiveCompleted = completedCount + partialCount * 0.5
    return {
      completed: completedCount, partial: partialCount, total: VANGUARD_MISSIONS.length,
      pct: Math.round((effectiveCompleted / VANGUARD_MISSIONS.length) * 100),
      earlyWake: !!dayLog.earlyWake, planning: !!dayLog.planning, onTrack: dayLog.onTrack,
      deepFocus: parseFloat(dayLog.deepFocus || 0), missionStatus: missions,
      hasData: Object.keys(db).length > 0,
    }
  }

  // ── Readiness ─────────────────────────────────────────────────────────────────
  function readinessLabel(pct) {
    if (pct >= 90) return 'Peak Performance'
    if (pct >= 70) return 'Strong Execution'
    if (pct >= 50) return 'On Track'
    if (pct >= 25) return 'Partial Deployment'
    if (pct > 0)  return 'Systems Warming'
    return 'Awaiting Input'
  }
  function readinessColor(pct) {
    if (pct >= 80) return '#34d399'
    if (pct >= 55) return '#fbbf24'
    if (pct >= 30) return '#f97316'
    return '#f43f5e'
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function cardShell(opts, inner) {
    const openBtn = opts.hash
      ? `<a href="#${opts.hash}" class="card-open-btn" title="Open ${opts.name}"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : ''
    return `<div class="app-card" style="--card-color:${opts.color};--card-rgb:${opts.rgb};">
  <div class="card-bg-glyph"><i class="${opts.icon}"></i></div>
  <div class="card-band">
    <div class="card-band-left">
      <div class="card-icon-wrap"><i class="${opts.icon}"></i></div>
      <div><div class="card-title">${opts.name}</div><div class="card-subtitle">${opts.sub}</div></div>
    </div>
    ${openBtn}
  </div>
  ${inner}
</div>`
  }

  function buildMasteryCard(m) {
    const opts = { name:'Mastery', sub:'Habit Rituals', icon:'fa-solid fa-crown', color:'#fbbf24', rgb:'251,191,36', hash:'mastery' }
    if (!m.hasData) return cardShell(opts, `<div class="no-data">Data Not Found — Launch hub to initialize.</div>`)
    const chips = RITUAL_KEYS.map(id => `<span class="chip ${m.completedIds.includes(id) ? 'done' : 'miss'}">${RITUAL_NAMES[id]}</span>`).join('')
    return cardShell(opts, `
    <div class="card-stats-row">
      <div class="card-stat"><div class="card-stat-num accent">${m.completed}<span style="font-size:1rem;color:var(--text-dim);font-weight:600">/${m.total}</span></div><div class="card-stat-sub">Rituals</div></div>
      <div class="card-stat"><div class="card-stat-num">${m.streak}d</div><div class="card-stat-sub">Streak</div></div>
      <div class="card-stat"><div class="card-stat-num">${m.pct}%</div><div class="card-stat-sub">Complete</div></div>
    </div>
    <div class="card-prog">
      <div class="card-prog-header"><span>Ritual Completion</span><span>${m.completed}/${m.total} Done</span></div>
      <div class="card-prog-bar"><div class="card-prog-fill" data-pct="${m.pct}" style="width:0%"></div></div>
    </div>
    <div class="card-chips">${chips}</div>`)
  }

  function buildVanguardCard(v) {
    const opts = { name:'Vanguard', sub:'10-Day Cycle Operations', icon:'fa-solid fa-shield-halved', color:'#c084fc', rgb:'192,132,252', hash:'vanguard' }
    if (!v.hasData) return cardShell(opts, `<div class="no-data">Data Not Found — Launch hub to initialize.</div>`)
    const chips = VANGUARD_MISSIONS.map(id => {
      const st = v.missionStatus[id]
      return `<span class="chip ${st === 'completed' || st === 'partial' ? 'done' : 'miss'}">${VANGUARD_NAMES[id]}${st === 'partial' ? '*' : ''}</span>`
    }).join('')
    return cardShell(opts, `
    <div class="card-stats-row">
      <div class="card-stat"><div class="card-stat-num accent">${v.completed}<span style="font-size:1rem;color:var(--text-dim);font-weight:600">/${v.total}</span></div><div class="card-stat-sub">Missions</div></div>
      <div class="card-stat"><div class="card-stat-num">${v.deepFocus > 0 ? v.deepFocus+'h' : '—'}</div><div class="card-stat-sub">Deep Focus</div></div>
      <div class="card-stat"><div class="card-stat-num">${v.pct}%</div><div class="card-stat-sub">Complete</div></div>
    </div>
    <div class="card-prog">
      <div class="card-prog-header"><span>Mission Status</span><span>${v.completed}${v.partial ? '+'+v.partial+'p' : ''}/${v.total}</span></div>
      <div class="card-prog-bar"><div class="card-prog-fill" data-pct="${v.pct}" style="width:0%"></div></div>
    </div>
    <div class="card-chips">${chips}${v.earlyWake ? '<span class="chip done">Early Wake</span>' : ''}${v.planning ? '<span class="chip done">Planning</span>' : ''}</div>`)
  }

  function updateTicker(m, v, gPct) {
    const segments = [
      `<span class="t-accent">SYS.READINESS</span> ${gPct}%`,
      `<span class="t-sep">/</span>`,
      `<span class="t-accent">MASTERY</span> ${m.pct}% · STREAK ${m.streak}D`,
      `<span class="t-sep">/</span>`,
      `<span class="t-accent">VANGUARD</span> ${v.pct}% · FOCUS ${v.deepFocus > 0 ? v.deepFocus+'H' : 'N/A'}`,
      `<span class="t-sep">/</span>`,
      `<span class="t-accent">STATUS</span> ${readinessLabel(gPct).toUpperCase()}`,
      `<span class="t-sep">/</span>`,
    ]
    const content = segments.join(' ')
    document.getElementById('tickerInner').innerHTML = content + ' ' + content
  }

  function renderApp() {
    const m = readMastery(), v = readVanguard()
    const relevant = [m, v].filter(d => d.hasData)
    const globalPct = relevant.length > 0
      ? Math.round(relevant.reduce((acc, d) => acc + d.pct, 0) / relevant.length)
      : 0
    const color = readinessColor(globalPct)

    const pctEl = document.getElementById('gaugePct')
    pctEl.style.color = color
    pctEl.textContent = globalPct + '%'

    const fill = document.getElementById('scoreFill')
    if (fill) { fill.style.width = Math.min(globalPct, 100) + '%'; fill.style.background = color; fill.style.boxShadow = `0 0 8px ${color}80` }

    document.getElementById('readinessTitle').textContent = readinessLabel(globalPct)
    document.getElementById('readinessTitle').style.color = color

    document.getElementById('miniBars').innerHTML = [
      { label:'Mastery',  pct:m.pct, color:'#fbbf24' },
      { label:'Vanguard', pct:v.pct, color:'#c084fc' },
    ].map(b => `<div class="mini-bar-item"><span class="mini-bar-label">${b.label}</span><div class="mini-bar-track"><div class="mini-bar-fill" style="width:${b.pct}%;background:${b.color};box-shadow:0 0 8px ${b.color}60;"></div></div><span class="mini-bar-pct" style="color:${b.color}">${b.pct}%</span></div>`).join('')

    const totalAppsActive = relevant.filter(d => d.pct > 0).length
    document.getElementById('globalStats').innerHTML = `
    <div class="rs-item"><div class="rs-lbl">Active Apps</div><div class="rs-val">${totalAppsActive}<span style="font-size:1rem;color:var(--text-dim);">/2</span></div></div>
    <div class="rs-item"><div class="rs-lbl">Global Score</div><div class="rs-val" style="color:${color}">${globalPct}<span style="font-size:1rem;opacity:0.5;">%</span></div></div>
    <div class="rs-item"><div class="rs-lbl">Best Streak</div><div class="rs-val">${m.streak}<span style="font-size:1rem;color:var(--text-dim);">d</span></div></div>`

    document.getElementById('appGrid').innerHTML = [buildMasteryCard(m), buildVanguardCard(v)].join('')
    requestAnimationFrame(() => {
      document.querySelectorAll('.card-prog-fill[data-pct]').forEach(el => { el.style.width = el.dataset.pct + '%' })
    })

    const now = new Date()
    document.getElementById('lastRefresh').textContent = `LAST SYNC: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`

    updateTicker(m, v, globalPct)
    renderDayDelta(m, v, globalPct)
    renderMiniWidgets(m, v)
  }

  // ── Day delta ─────────────────────────────────────────────────────────────────
  function getYesterdayKey() {
    const d = new Date(); d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  function getYesterdayMasteryPct() {
    const db = safeJSON('mastery_data', {}), yesterday = getYesterdayKey()
    const rituals = Array.isArray(db[yesterday]) ? db[yesterday] : []
    return { pct: Math.round((rituals.length/8)*100), hasData: !!db[yesterday] }
  }
  function getYesterdayVanguardPct() {
    const pst = new Date(new Date().toLocaleString('en-US', { timeZone:'America/Los_Angeles' }))
    pst.setDate(pst.getDate() - 1)
    const yesterday = `${pst.getFullYear()}-${String(pst.getMonth()+1).padStart(2,'0')}-${String(pst.getDate()).padStart(2,'0')}`
    const db = safeJSON('vanguard-logs', {}), dayLog = db[yesterday] || {}, missions = dayLog.missions || {}
    const completedCount = VANGUARD_MISSIONS.filter(id => missions[id] === 'completed').length
    const partialCount   = VANGUARD_MISSIONS.filter(id => missions[id] === 'partial').length
    return { pct: Math.round(((completedCount + partialCount*0.5) / VANGUARD_MISSIONS.length)*100), hasData: Object.keys(dayLog).length > 0 }
  }

  function renderDayDelta(m, v, globalPct) {
    const yM = getYesterdayMasteryPct(), yV = getYesterdayVanguardPct()
    const yRelevant = [yM, yV].filter(a => a.hasData)
    const yGlobal   = yRelevant.length > 0 ? Math.round(yRelevant.reduce((acc,a) => acc+a.pct, 0) / yRelevant.length) : null
    const arrowEl = document.getElementById('deltaArrow'), pctEl = document.getElementById('deltaPct')
    const subEl   = document.getElementById('deltaSub'),   barsEl = document.getElementById('deltaBars')

    if (yGlobal === null) {
      arrowEl.textContent = '—'; arrowEl.style.color = 'var(--text-dim)'
      pctEl.textContent = 'N/A'; pctEl.style.color = 'var(--text-dim)'
      subEl.innerHTML = `<div class="delta-sub-row" style="color:var(--text-dim)">No yesterday data</div>`
      barsEl.innerHTML = ''; return
    }

    const delta = globalPct - yGlobal, isFlat = delta === 0, isUp = delta > 0
    const color = isFlat ? 'var(--text-dim)' : isUp ? '#34d399' : '#f43f5e'
    arrowEl.textContent = isFlat ? '—' : isUp ? '↑' : '↓'; arrowEl.style.color = color
    pctEl.textContent = isFlat ? 'FLAT' : isUp ? `+${Math.abs(delta)}%` : `-${Math.abs(delta)}%`; pctEl.style.color = color
    subEl.innerHTML = `<div class="delta-sub-row">Today <span style="color:${readinessColor(globalPct)}">${globalPct}%</span></div><div class="delta-sub-row">Yest. <span style="color:var(--text-muted)">${yGlobal}%</span></div>`

    const appColors = ['#fbbf24','#c084fc'], appLabels = ['M','V']
    const todayPcts = [m.pct, v.pct], yestPcts = [yM.pct, yV.pct]
    barsEl.innerHTML = [0,1].map(i => {
      const maxH=32, tH=Math.round((todayPcts[i]/100)*maxH), yH=Math.round((yestPcts[i]/100)*maxH), c=appColors[i]
      return `<div class="delta-bar-col"><div class="delta-bar-pair"><div class="delta-bar-seg" style="height:${Math.max(yH,3)}px;background:${c};" title="Yesterday ${yestPcts[i]}%"></div><div class="delta-bar-seg today" style="height:${Math.max(tH,3)}px;background:${c};" title="Today ${todayPcts[i]}%"></div></div><div class="delta-bar-lbl">${appLabels[i]}</div></div>`
    }).join('')
  }

  // ── Streak ───────────────────────────────────────────────────────────────────
  function calcStreak() {
    const mData = safeJSON('mastery_data', {}), vLogs = safeJSON('vanguard-logs', {})
    let streak = 0
    const d = new Date(); d.setDate(d.getDate() - 1)
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const mDone = (mData[key] || []).length >= 3
      const vEntry = vLogs[key]
      const vDone  = vEntry && Object.values(vEntry.missions || {}).filter(s => s === 'completed' || s === 'partial').length >= 3
      if (mDone && vDone) { streak++; d.setDate(d.getDate() - 1) } else break
    }
    return streak
  }

  function renderMiniWidgets(m, v) {
    document.getElementById('mwMasteryStat').textContent = `${m.completed} / ${m.total} RITUALS`
    document.getElementById('mwMasteryBar').style.width  = m.pct + '%'
    document.getElementById('mwVanguardStat').textContent = v.partial > 0 ? `${v.completed}+${v.partial}★ / ${v.total} MISSIONS` : `${v.completed} / ${v.total} MISSIONS`
    document.getElementById('mwVanguardBar').style.width  = v.pct + '%'
    const streak = calcStreak(), STREAK_GOAL = 30
    document.getElementById('mwStreakStat').textContent = `${streak} DAY${streak !== 1 ? 'S' : ''}`
    document.getElementById('mwStreakBar').style.width  = Math.min(Math.round((streak/STREAK_GOAL)*100), 100) + '%'
  }

  // ── Week panel ───────────────────────────────────────────────────────────────
  let activeWeekTab = 'planning'
  const WEEK_CONFIGS = {
    planning: { label:'Planning', color:'#38bdf8', rgb:'56,189,248'   },
    tracking: { label:'Tracking', color:'#e879f9', rgb:'232,121,249'  },
    ontrack:  { label:'OnTrack',  color:'#9ca3af', rgb:'156,163,175'  },
  }

  function getWeekDates(weekOffset = 0) {
    const now = new Date(), sun = new Date(now)
    sun.setDate(now.getDate() - now.getDay() + weekOffset * 7)
    sun.setHours(0, 0, 0, 0)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun); d.setDate(sun.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      dates.push({ key, date: d })
    }
    return dates
  }

  function isDonePlanning(dateKey) { const db = safeJSON('vanguard-logs', {}); return !!(db[dateKey] && db[dateKey].planning) }
  function isDoneOnTrack(dateKey) {
    const vLogs = safeJSON('vanguard-logs', {})
    if (vLogs[dateKey]?.onTrack === 'full') return true
    const raw = safeJSON('streak_ontrack', [])
    return Array.isArray(raw) && raw.some(item => (typeof item === 'string' ? item : item?.date) === dateKey)
  }
  function isDoneTracking(dateKey) {
    const raw = safeJSON('streak_timeTracking', [])
    return Array.isArray(raw) && raw.some(item => (typeof item === 'string' ? item : item?.date) === dateKey)
  }

  function getWeekData(tab, weekOffset = 0) {
    const dates  = getWeekDates(weekOffset), today = todayKey()
    const checkFn = tab === 'planning' ? isDonePlanning : tab === 'tracking' ? isDoneTracking : isDoneOnTrack
    const days = dates.map(({ key, date }) => ({ key, date, done: checkFn(key), isToday: key === today, isFuture: key > today }))
    return { days, count: days.filter(d => d.done).length }
  }

  function switchWeekTab(tab) {
    activeWeekTab = tab
    document.querySelectorAll('.week-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab))
    renderWeekPanel()
  }

  function toggleWeekDay(dateKey) {
    if (activeWeekTab === 'planning') {
      const db = safeJSON('vanguard-logs', {})
      if (!db[dateKey]) db[dateKey] = {}
      db[dateKey].planning = !db[dateKey].planning
      localStorage.setItem('vanguard-logs', JSON.stringify(db))
      saveCloudKey('vanguard-logs', db)
      _nexusSync.broadcast('NEXUS')
    } else if (activeWeekTab === 'tracking') {
      const list = safeJSON('streak_timeTracking', [])
      const arr  = Array.isArray(list) ? list : []
      const idx  = arr.findIndex(item => (typeof item === 'string' ? item : item?.date) === dateKey)
      if (idx >= 0) arr.splice(idx, 1); else arr.push(dateKey)
      localStorage.setItem('streak_timeTracking', JSON.stringify(arr))
      saveCloudKey('streak_timeTracking', arr)
      _nexusSync.broadcast('NEXUS')
    } else {
      const list = safeJSON('streak_ontrack', [])
      const arr  = Array.isArray(list) ? list : []
      const idx  = arr.findIndex(item => (typeof item === 'string' ? item : item?.date) === dateKey)
      if (idx >= 0) arr.splice(idx, 1); else arr.push(dateKey)
      localStorage.setItem('streak_ontrack', JSON.stringify(arr))
      saveCloudKey('streak_ontrack', arr)
      _nexusSync.broadcast('NEXUS')
    }
    renderWeekPanel()
  }

  // Expose for onclick attributes wired via event delegation below
  window._nexusToggleWeekDay = toggleWeekDay

  function renderWeekPanel() {
    const cfg  = WEEK_CONFIGS[activeWeekTab]
    const curr = getWeekData(activeWeekTab, 0), prev = getWeekData(activeWeekTab, -1)

    Object.keys(WEEK_CONFIGS).forEach(tab => {
      const id = 'wtb' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Count'
      const el = document.getElementById(id)
      if (el) el.textContent = `${getWeekData(tab, 0).count}/7`
    })

    const panel = document.getElementById('weekPanel')
    panel.style.setProperty('--week-color', cfg.color)
    panel.style.setProperty('--week-rgb', cfg.rgb)
    document.getElementById('weekStatsTitle').textContent = `This Week · ${cfg.label}`

    const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    document.getElementById('weekDayRow').innerHTML = curr.days.map(d =>
      `<div class="week-day-col">
        <div class="week-day-label">${DAY_LABELS[d.date.getDay()]}</div>
        <div class="week-day-dot${d.done?' done':''}${d.isToday?' today':''}${d.isFuture?' future':''}"
          title="${d.key}${d.done?' ✓':''}"
          onclick="window._nexusToggleWeekDay('${d.key}')"></div>
      </div>`
    ).join('')

    const numEl = document.getElementById('weekStatNum')
    numEl.textContent = curr.count; numEl.style.color = cfg.color

    const delta = curr.count - prev.count, isFlat = delta === 0, isUp = delta > 0
    const deltaColor = isFlat ? 'var(--text-dim)' : isUp ? '#34d399' : '#f43f5e'
    const vsEl = document.getElementById('weekVsDelta')
    vsEl.textContent = isFlat ? '±0 days' : isUp ? `+${delta} days` : `${delta} days`
    vsEl.style.color = deltaColor
    document.getElementById('weekVsPrev').textContent = `prev week: ${prev.count}/7`
  }

  // Wire week tab buttons
  document.getElementById('weekPanel').addEventListener('click', e => {
    const btn = e.target.closest('.week-tab-btn')
    if (btn?.dataset.tab) switchWeekTab(btn.dataset.tab)
  })

  // ── Node canvas ───────────────────────────────────────────────────────────────
  let _rafId = null, _paused = false

  ;(function () {
    const canvas = document.getElementById('nodeCanvas')
    const ctx    = canvas.getContext('2d')
    let W, H, nodes = []
    const NODE_COUNT = 40, MAX_DIST = 180, ACCENT = 'rgba(148, 163, 184,'

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    class Node {
      constructor() { this.reset(true) }
      reset(init) {
        this.x  = Math.random() * W
        this.y  = init ? Math.random() * H : Math.random() > 0.5 ? -10 : H + 10
        this.vx = (Math.random() - 0.5) * 0.2
        this.vy = (Math.random() - 0.5) * 0.2
        this.r  = Math.random() * 1.5 + 0.5
        this.opacity = Math.random() * 0.4 + 0.1
      }
      update() {
        this.x += this.vx; this.y += this.vy
        if (this.x < -20 || this.x > W+20 || this.y < -20 || this.y > H+20) this.reset(false)
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = ACCENT + this.opacity + ')'; ctx.fill()
      }
    }

    for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node())

    function frame() {
      if (_paused) return
      ctx.clearRect(0, 0, W, H)
      nodes.forEach(n => { n.update(); n.draw() })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = ACCENT + (1 - dist/MAX_DIST) * 0.1 + ')'; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      _rafId = requestAnimationFrame(frame)
    }
    frame()
  })()

  const _visibilityHandler = () => {
    if (document.hidden) { _paused = true; cancelAnimationFrame(_rafId) }
    else { _paused = false; /* frame() re-starts on next tick via rAF */ }
  }
  document.addEventListener('visibilitychange', _visibilityHandler)

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  const _keyHandler = e => {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'v' || e.key === 'V') location.hash = 'vanguard'
    if (e.key === 'm' || e.key === 'M') location.hash = 'mastery'
  }
  document.addEventListener('keydown', _keyHandler)

  // ── Live sync listener ───────────────────────────────────────────────────────
  const _syncListener = () => { renderAll(); renderWeekPanel() }
  _nexusSync.listen(_syncListener)

  // ── Init ─────────────────────────────────────────────────────────────────────
  function renderAll() {
    updateClock()
    updateTimeMatrix()
    renderApp()
    renderWeekPanel()
    const m = readMastery(), v = readVanguard()
    const relevant = [m, v].filter(d => d.hasData)
    const globalPct = relevant.length > 0 ? Math.round(relevant.reduce((acc,d) => acc+d.pct, 0) / relevant.length) : 0
    renderDayDelta(m, v, globalPct)
    renderMiniWidgets(m, v)
  }

  const _clockInterval   = setInterval(() => { updateClock(); if (new Date().getSeconds() === 0) updateTimeMatrix() }, 1000)
  const _refreshInterval = setInterval(renderAll, 60000)

  renderAll()

  // ── Destroy (called by router on navigation away) ─────────────────────────────
  return function destroy() {
    clearInterval(_clockInterval)
    clearInterval(_refreshInterval)
    cancelAnimationFrame(_rafId)
    _paused = true
    document.removeEventListener('visibilitychange', _visibilityHandler)
    document.removeEventListener('keydown', _keyHandler)
    delete window._nexusToggleWeekDay
    container.innerHTML = ''
  }
}
