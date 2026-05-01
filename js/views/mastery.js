import { saveCloudKey } from '../appwrite-sync.js'

const STORAGE_KEY   = 'mastery_data'
const TOTAL_RITUALS = 8

const MASTERY_RITUALS = [
  { id: 'english',    name: 'English',     icon: 'fa-solid fa-pen-nib',          category: 'Language'  },
  { id: 'greenmoney', name: 'Green Money', icon: 'fa-solid fa-coins',            category: 'Finance'   },
  { id: 'fitness',    name: 'Fitness',     icon: 'fa-solid fa-dumbbell',         category: 'Fitness'   },
  { id: 'reading',    name: 'Reading',     icon: 'fa-solid fa-book-open-reader', category: 'Knowledge' },
  { id: 'learning',   name: 'Learning',    icon: 'fa-solid fa-brain',            category: 'Tech'      },
  { id: 'wakeup',     name: 'Wake Early',  icon: 'fa-solid fa-sun',              category: 'Routine'   },
  { id: 'sugarfree',  name: 'Sugar-Free',  icon: 'fa-solid fa-seedling',         category: 'Health'    },
  { id: 'badhabit',   name: 'Bad Habit',   icon: 'fa-solid fa-link-slash',       category: 'Character' },
]

const CAL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CAL_SHORT_WEEK  = ['SUN','MON','TUE','WED','THU','FRI','SAT']

const TEMPLATE = `
<div class="particles"></div>

<div class="day-countdown-widget" title="Time remaining today">
  <div class="zcd-header">Day Remaining</div>
  <div class="zcd-slots">
    <div class="zcd-unit"><div class="zcd-num" id="zcdH">--</div><div class="zcd-label">HRS</div></div>
    <div class="zcd-sep">:</div>
    <div class="zcd-unit"><div class="zcd-num" id="zcdM">--</div><div class="zcd-label">MIN</div></div>
    <div class="zcd-sep">:</div>
    <div class="zcd-unit"><div class="zcd-num" id="zcdS">--</div><div class="zcd-label">SEC</div></div>
  </div>
  <div class="zcd-bar"><div class="zcd-bar-fill" id="zcdFill" style="width:0%"></div></div>
  <div class="zcd-sublabel">Until Midnight</div>
</div>

<div class="rolls-container">

  <h1 class="rolls-title">Daily Mastery</h1>

  <div class="temporal-widget">
    <div class="temporal-card">
      <div class="t-label">Day of Week</div>
      <div class="t-value" id="tw-day">—</div>
      <div class="t-sub" id="tw-date">—</div>
    </div>
    <div class="temporal-card">
      <div class="t-label">Week of Year</div>
      <div class="t-value" id="tw-week">—</div>
      <div class="t-sub" id="tw-weekrange">—</div>
      <div class="day-progress-bar" id="week-progress"></div>
    </div>
    <div class="temporal-card">
      <div class="t-label">Day of Year</div>
      <div class="t-value" id="tw-doy">—</div>
      <div class="t-sub" id="tw-doypct">—</div>
      <div class="day-progress-bar" id="year-progress"></div>
    </div>
    <div class="temporal-card">
      <div class="t-label">Local Time</div>
      <div class="t-value" id="tw-time">—</div>
      <div class="t-sub" id="tw-session">—</div>
    </div>
  </div>

  <div class="rolls-section">
    <h2>Performance Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">🔥</div>
        <div class="metric-label">Current Streak</div>
        <div class="streak-ring">
          <svg viewBox="0 0 70 70"><circle cx="35" cy="35" r="31" id="streak-circle"/></svg>
          <span class="streak-number" id="m-streak">0</span>
        </div>
        <div class="metric-sub">consecutive days</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🏆</div>
        <div class="metric-label">Best Streak</div>
        <div class="metric-value" id="m-best">0</div>
        <div class="metric-sub">days record</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📅</div>
        <div class="metric-label">Total Days Logged</div>
        <div class="metric-value" id="m-total">0</div>
        <div class="metric-sub">days recorded</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">✅</div>
        <div class="metric-label">Today Completed</div>
        <div class="metric-value" id="m-today">0/8</div>
        <div class="metric-sub">rituals</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <div class="metric-label">7-Day Avg</div>
        <div class="metric-value" id="m-avg7">—</div>
        <div class="metric-sub">rituals/day</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🎯</div>
        <div class="metric-label">Perfect Days</div>
        <div class="metric-value" id="m-perfect">0</div>
        <div class="metric-sub">8/8 days all-time</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">⚡</div>
        <div class="metric-label">This Week</div>
        <div class="metric-value" id="m-week">0</div>
        <div class="metric-sub">rituals so far</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🌟</div>
        <div class="metric-label">Mastery Score</div>
        <div class="metric-value" id="m-mastery">0</div>
        <div class="metric-sub">lifetime points</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">😴</div>
        <div class="metric-label">Weakest Day</div>
        <div class="metric-value" id="m-weakday">—</div>
        <div class="metric-sub" id="m-weakday-avg">lowest avg</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🎖️</div>
        <div class="metric-label">Top Ritual</div>
        <div class="metric-value" id="m-topritual" style="font-size:1.6rem;">—</div>
        <div class="metric-sub" id="m-topritual-count">all-time completions</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-label">Since Perfect Day</div>
        <div class="metric-value" id="m-sinceperfect">—</div>
        <div class="metric-sub" id="m-sinceperfect-sub">days ago</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📈</div>
        <div class="metric-label">Month vs Last</div>
        <div class="metric-value" id="m-monthvs">—</div>
        <div class="metric-sub" id="m-monthvs-sub">rituals this month</div>
      </div>
    </div>
  </div>

  <div class="rolls-section" style="margin-top:80px;">
    <div class="spirit-of-ecstasy">✧</div>
    <h2>Daily Rituals</h2>

    <div class="energy-section">
      <div class="energy-label-head">Energy Level:</div>
      <div class="energy-btns">
        <button class="energy-btn-m" id="m-energy-low">LOW</button>
        <button class="energy-btn-m" id="m-energy-medium">MEDIUM</button>
        <button class="energy-btn-m" id="m-energy-high">HIGH</button>
      </div>
    </div>

    <div class="completion-bar-wrap">
      <div class="completion-bar-fill" id="comp-bar" style="width:0%"></div>
    </div>
    <div class="completion-label" id="comp-label">0 of 8 completed</div>

    <div class="ritual-grid" id="ritualGrid">
      <div class="ritual-card" data-ritual="english">
        <i class="fa-solid fa-pen-nib ritual-icon-fa"></i>
        <div class="ritual-name">English</div>
        <div class="ritual-desc">create opportunities · global voice</div>
      </div>
      <div class="ritual-card" data-ritual="greenmoney">
        <span class="ritual-icon-fa greenmoney-icon-wrap">
          <i class="fa-solid fa-coins greenmoney-coins"></i>
          <i class="fa-solid fa-circle-dollar-sign greenmoney-dollar"></i>
        </span>
        <div class="ritual-name">Green Money</div>
        <div class="ritual-desc">build abundant future · financial fortress</div>
      </div>
      <div class="ritual-card" data-ritual="fitness">
        <i class="fa-solid fa-dumbbell ritual-icon-fa"></i>
        <div class="ritual-name">Fitness</div>
        <div class="ritual-desc">forge elite body · sculpted physique</div>
      </div>
      <div class="ritual-card" data-ritual="reading">
        <i class="fa-solid fa-book-open-reader ritual-icon-fa"></i>
        <div class="ritual-name">Reading</div>
        <div class="ritual-desc">intellectual feast · expand knowledge</div>
      </div>
      <div class="ritual-card" data-ritual="learning">
        <i class="fa-solid fa-brain ritual-icon-fa"></i>
        <div class="ritual-name">Learning</div>
        <div class="ritual-desc">cyber learning · build &amp; grow daily</div>
      </div>
      <div class="ritual-card" data-ritual="wakeup">
        <i class="fa-solid fa-sun ritual-icon-fa"></i>
        <div class="ritual-name">Wake Early</div>
        <div class="ritual-desc">prime day launch · win the morning</div>
      </div>
      <div class="ritual-card" data-ritual="sugarfree">
        <i class="fa-solid fa-seedling ritual-icon-fa"></i>
        <div class="ritual-name">Sugar-Free</div>
        <div class="ritual-desc">virtue cultivator · replace bad input</div>
      </div>
      <div class="ritual-card" data-ritual="badhabit">
        <i class="fa-solid fa-link-slash ritual-icon-fa"></i>
        <div class="ritual-name">Bad Habit</div>
        <div class="ritual-desc">override bad habit · build character</div>
      </div>
    </div>
  </div>

  <div class="calendar-section">
    <div class="cal-header">
      <div class="cal-title">Mission Timeline</div>
      <div class="cal-nav">
        <button class="cal-nav-btn" id="calPrev"><i class="fas fa-chevron-left"></i></button>
        <div class="month-indicator" id="monthIndicator">--</div>
        <button class="cal-nav-btn" id="calNext"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    <div class="cal-daynames">
      <div class="cal-dayname">SUN</div>
      <div class="cal-dayname">MON</div>
      <div class="cal-dayname">TUE</div>
      <div class="cal-dayname">WED</div>
      <div class="cal-dayname">THU</div>
      <div class="cal-dayname">FRI</div>
      <div class="cal-dayname">SAT</div>
    </div>
    <div class="brick-wall" id="brickWall"></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<div class="modal-overlay" id="dayModal" role="dialog" aria-modal="true" aria-labelledby="dModalTitle">
  <div class="modal-box">
    <button class="modal-close" id="dayModalClose" aria-label="Close"><i class="fas fa-times"></i></button>
    <div class="modal-header">
      <div class="modal-icon"><i class="fas fa-calendar-day"></i></div>
      <div>
        <div class="modal-title" id="dModalTitle">DAY STATS</div>
        <div class="modal-subtitle" id="dModalSubtitle">--</div>
      </div>
    </div>
    <div class="modal-body" id="dModalBody"></div>
  </div>
</div>

<a href="#" class="nexus-fab">
  <span class="nfab-hex">⬡</span>
  <span>Nexus</span>
</a>
`

export async function init(container, _user) {
  container.innerHTML = TEMPLATE
  document.body.classList.add('loaded')

  const _nexusSync = window._nexusSync
  const todayKey   = window.todayKey

  const _calToday  = new Date()
  let calViewYear  = _calToday.getFullYear()
  let calViewMonth = _calToday.getMonth()

  let _temporalStopped  = false
  let _temporalTimeout  = null
  let _countdownInterval = null
  let _destroyed        = false

  // ── Particles ──────────────────────────────────────────────────────────────
  const particlesEl = container.querySelector('.particles')
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div')
    p.style.cssText = `
      position:absolute; background:rgba(197,165,114,${Math.random() * 0.25});
      width:${Math.random() * 4}px; height:${Math.random() * 4}px;
      top:${Math.random() * 100}%; left:${Math.random() * 100}%;
      animation:float ${5 + Math.random() * 10}s linear infinite;
    `
    particlesEl.appendChild(p)
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
    catch { return {} }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    saveCloudKey('mastery_data', data)
    _nexusSync.broadcast('MASTERY')
  }

  function getWeekNumber(date) {
    return Math.ceil((getDayOfYear(date) + new Date(date.getFullYear(), 0, 1).getDay()) / 7)
  }

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff  = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000)
    return Math.floor(diff / 86400000)
  }

  function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 }

  // ── Temporal ────────────────────────────────────────────────────────────────
  function updateTemporal() {
    if (_temporalStopped) return
    const now    = new Date()
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    document.getElementById('tw-day').textContent  = days[now.getDay()].slice(0, 3).toUpperCase()
    document.getElementById('tw-date').textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

    const wk = getWeekNumber(now)
    document.getElementById('tw-week').textContent = String(wk).padStart(2, '0')
    const sow = new Date(now); sow.setDate(now.getDate() - now.getDay())
    const eow = new Date(sow); eow.setDate(sow.getDate() + 6)
    document.getElementById('tw-weekrange').textContent = `${months[sow.getMonth()]} ${sow.getDate()} – ${months[eow.getMonth()]} ${eow.getDate()}`
    document.getElementById('week-progress').style.width = ((now.getDay() / 6) * 100) + '%'

    const doy     = getDayOfYear(now)
    const yearDays = isLeapYear(now.getFullYear()) ? 366 : 365
    const yearPct  = ((doy - 1) / yearDays * 100).toFixed(1)
    document.getElementById('tw-doy').textContent    = doy
    document.getElementById('tw-doypct').textContent = yearPct + '% elapsed'
    document.getElementById('year-progress').style.width = yearPct + '%'

    const hh = now.getHours(), mm = String(now.getMinutes()).padStart(2, '0')
    const h12 = hh % 12 || 12
    document.getElementById('tw-time').textContent    = `${h12}:${mm}`
    document.getElementById('tw-session').textContent = hh < 12 ? 'MORNING' : hh < 17 ? 'AFTERNOON' : hh < 21 ? 'EVENING' : 'NIGHT'

    _temporalTimeout = setTimeout(updateTemporal, 30000)
  }

  // ── Energy tagging ──────────────────────────────────────────────────────────
  function loadEnergyForToday() {
    try {
      const vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
      return vLogs[todayKey()]?.energy || null
    } catch { return null }
  }

  function saveEnergy(lvl) {
    try {
      const vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
      const key   = todayKey()
      if (!vLogs[key]) vLogs[key] = { missions: {} }
      if (vLogs[key].energy === lvl) delete vLogs[key].energy
      else vLogs[key].energy = lvl
      localStorage.setItem('vanguard-logs', JSON.stringify(vLogs))
      saveCloudKey('vanguard-logs', vLogs)
      _nexusSync.broadcast('MASTERY')
      return vLogs[key].energy || null
    } catch { return null }
  }

  function renderEnergyButtons(energy) {
    ;['low', 'medium', 'high'].forEach(lvl => {
      const btn = document.getElementById(`m-energy-${lvl}`)
      if (btn) btn.className = `energy-btn-m${energy === lvl ? ` active-${lvl}` : ''}`
    })
  }

  // ── Streak calculation ───────────────────────────────────────────────────────
  function calcStreaks(data) {
    const keys = Object.keys(data).sort()
    if (!keys.length) return { current: 0, best: 0 }
    let best = 0, cur = 0, prev = null
    const today = todayKey()
    for (const k of keys) {
      if (!data[k] || data[k].length === 0) { cur = 0; prev = null; continue }
      if (!prev) { cur = 1 }
      else {
        const d1   = new Date(prev + 'T12:00:00')
        const d2   = new Date(k    + 'T12:00:00')
        const diff = Math.round((d2 - d1) / 86400000)
        cur = diff === 1 ? cur + 1 : 1
      }
      if (cur > best) best = cur
      prev = k
    }
    if (!data[today] || data[today].length === 0) {
      const yd = new Date(); yd.setDate(yd.getDate() - 1)
      const ydKey = yd.toISOString().slice(0, 10)
      if (!data[ydKey] || data[ydKey].length === 0) cur = 0
    }
    return { current: cur, best }
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────
  function updateMetrics(data) {
    const { current, best } = calcStreaks(data)
    const today     = todayKey()
    const todayList = data[today] || []
    const allKeys   = Object.keys(data).filter(k => data[k]?.length > 0)

    document.getElementById('m-streak').textContent = current

    const circ = 2 * Math.PI * 31
    const pct  = Math.min(current / 30, 1)
    const el   = document.getElementById('streak-circle')
    if (el) { el.style.strokeDasharray = circ; el.style.strokeDashoffset = circ - pct * circ }

    document.getElementById('m-best').textContent  = best
    document.getElementById('m-total').textContent  = allKeys.length
    document.getElementById('m-today').textContent  = `${todayList.length}/${TOTAL_RITUALS}`

    let sum7 = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      sum7 += (data[k] || []).length
    }
    document.getElementById('m-avg7').textContent = (sum7 / 7).toFixed(1)

    const perfect = allKeys.filter(k => data[k].length >= TOTAL_RITUALS).length
    document.getElementById('m-perfect').textContent = perfect

    let weekSum = 0
    const now2 = new Date()
    for (let i = 0; i <= now2.getDay(); i++) {
      const d = new Date(now2); d.setDate(now2.getDate() - i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      weekSum += (data[k] || []).length
    }
    document.getElementById('m-week').textContent = weekSum

    const score = allKeys.reduce((acc, k) => {
      const c = data[k].length
      return acc + c + (c >= TOTAL_RITUALS ? 10 : 0)
    }, 0)
    document.getElementById('m-mastery').textContent = score

    const dayTotals = [0, 0, 0, 0, 0, 0, 0]
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    const dayNames  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    allKeys.forEach(k => {
      const dow = new Date(k + 'T12:00:00').getDay()
      dayTotals[dow] += data[k].length
      dayCounts[dow]++
    })
    const dayAvgs = dayTotals.map((t, i) => dayCounts[i] ? t / dayCounts[i] : null)
    let weakIdx = -1, weakVal = Infinity
    dayAvgs.forEach((v, i) => { if (v !== null && v < weakVal) { weakVal = v; weakIdx = i } })
    document.getElementById('m-weakday').textContent     = weakIdx >= 0 ? dayNames[weakIdx] : '—'
    document.getElementById('m-weakday-avg').textContent = weakIdx >= 0 ? `avg ${weakVal.toFixed(1)} rituals` : 'not enough data'

    const ritualKeys   = ['english','greenmoney','fitness','reading','learning','wakeup','sugarfree','badhabit']
    const ritualLabels = { english:'English', greenmoney:'Money', fitness:'Fitness', reading:'Reading', learning:'Learning', wakeup:'Wake Up', sugarfree:'Sugar-Free', badhabit:'Bad Habit' }
    const rc = {}
    ritualKeys.forEach(r => { rc[r] = 0 })
    allKeys.forEach(k => { (data[k] || []).forEach(r => { if (rc[r] !== undefined) rc[r]++ }) })
    const top = Object.entries(rc).sort((a, b) => b[1] - a[1])[0]
    document.getElementById('m-topritual').textContent      = top && top[1] > 0 ? ritualLabels[top[0]] || top[0] : '—'
    document.getElementById('m-topritual-count').textContent = top && top[1] > 0 ? `${top[1]} completions` : 'all-time completions'

    const perfKeys = allKeys.filter(k => data[k].length >= TOTAL_RITUALS).sort()
    if (perfKeys.length) {
      const last = perfKeys[perfKeys.length - 1]
      const diff = Math.round((new Date(today + 'T12:00:00') - new Date(last + 'T12:00:00')) / 86400000)
      document.getElementById('m-sinceperfect').textContent     = diff === 0 ? 'TODAY' : diff
      document.getElementById('m-sinceperfect-sub').textContent = diff === 0 ? 'perfect day!' : 'days ago'
    } else {
      document.getElementById('m-sinceperfect').textContent     = '—'
      document.getElementById('m-sinceperfect-sub').textContent = 'no perfect day yet'
    }

    const now3    = new Date()
    const thisMP  = `${now3.getFullYear()}-${String(now3.getMonth() + 1).padStart(2, '0')}`
    const lm      = new Date(now3.getFullYear(), now3.getMonth() - 1, 1)
    const lastMP  = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`
    const thisMS  = allKeys.filter(k => k.startsWith(thisMP)).reduce((a, k) => a + data[k].length, 0)
    const lastMS  = allKeys.filter(k => k.startsWith(lastMP)).reduce((a, k) => a + data[k].length, 0)
    const diffM   = thisMS - lastMS
    document.getElementById('m-monthvs').textContent     = thisMS
    document.getElementById('m-monthvs-sub').textContent = lastMS ? `${diffM >= 0 ? '+' : ''}${diffM} vs last month` : 'no last-month data'

    updateCompletionBar(todayList.length)
  }

  function updateCompletionBar(count) {
    document.getElementById('comp-bar').style.width   = (count / TOTAL_RITUALS * 100) + '%'
    document.getElementById('comp-label').textContent = `${count} of ${TOTAL_RITUALS} completed`
  }

  // ── Ritual state ─────────────────────────────────────────────────────────────
  function loadTodayState(data) {
    const todayList = data[todayKey()] || []
    document.querySelectorAll('.ritual-card').forEach(card => {
      card.classList.toggle('completed', todayList.includes(card.dataset.ritual))
    })
    updateCompletionBar(todayList.length)
  }

  // ── Confetti ─────────────────────────────────────────────────────────────────
  function launchConfetti() {
    const ck = 'mastery-confetti-' + todayKey()
    if (localStorage.getItem(ck)) return
    localStorage.setItem(ck, '1')

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight

    const COLORS = ['#C5A572','#E8E8E8','#FFFFFF','#B8860B']
    const SHAPES = ['rect','circle']
    const parts  = []
    for (let i = 0; i < 180; i++) {
      const side = 4 + Math.random() * 7
      parts.push({
        x: Math.random() * canvas.width, y: -20 - Math.random() * 300,
        w: side, h: side * (0.3 + Math.random() * 0.5),
        shape: SHAPES[Math.random() < 0.3 ? 1 : 0],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 5, vy: 1.5 + Math.random() * 4,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8,
        opacity: 1, fadeStart: canvas.height * (0.55 + Math.random() * 0.25)
      })
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let any = false
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.vx *= 0.995; p.rot += p.rotV
        if (p.y > p.fadeStart) p.opacity -= 0.018
        if (p.opacity <= 0) continue
        any = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 5
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill() }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (any) requestAnimationFrame(tick); else canvas.remove()
    }
    requestAnimationFrame(tick)
    showToast('✦ EXCELLENCE ACHIEVED — ALL RITUALS COMPLETE')
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 2800)
  }

  // ── Brick wall calendar ──────────────────────────────────────────────────────
  function buildBrickWall() {
    const year   = calViewYear
    const month  = calViewMonth
    const daysInMonth     = new Date(year, month + 1, 0).getDate()
    const startingWeekday = new Date(year, month, 1).getDay()
    const brickContainer  = document.getElementById('brickWall')
    if (!brickContainer) return
    brickContainer.innerHTML = ''
    for (let i = 0; i < startingWeekday; i++) {
      const empty = document.createElement('div')
      empty.className = 'brick empty-brick'
      brickContainer.appendChild(empty)
    }
    const td = _calToday.getDate(), tm = _calToday.getMonth(), ty = _calToday.getFullYear()
    for (let d = 1; d <= daysInMonth; d++) {
      const brick = document.createElement('div')
      brick.className = 'brick'
      if (d === td && month === tm && year === ty) brick.classList.add('today')
      const dow = new Date(year, month, d).getDay()
      if (dow === 0 || dow === 6) brick.classList.add('weekend')
      brick.innerHTML = `<div class="day-num">${d}</div><div class="weekday-letter">${CAL_SHORT_WEEK[dow]}</div>`
      brick.addEventListener('click', () => openDayModal(year, month, d))
      brickContainer.appendChild(brick)
    }
    document.getElementById('monthIndicator').textContent = `${CAL_MONTH_NAMES[month]} ${year}`
  }

  // ── Day modal ────────────────────────────────────────────────────────────────
  function openDayModal(year, month, day) {
    const dateObj   = new Date(year, month, day)
    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()]
    const isToday   = (year === _calToday.getFullYear() && month === _calToday.getMonth() && day === _calToday.getDate())
    const isPast    = dateObj < new Date(_calToday.getFullYear(), _calToday.getMonth(), _calToday.getDate())
    const dateStr   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    document.getElementById('dModalTitle').textContent    = `${dayOfWeek}, ${CAL_MONTH_NAMES[month]} ${day}`
    document.getElementById('dModalSubtitle').textContent = isToday
      ? 'TODAY · CURRENT ACTIVE SESSION'
      : isPast ? `PAST DATE · ${year}` : `UPCOMING · ${year}`

    const data      = loadData()
    const doneList  = data[dateStr] || []
    const rituals   = MASTERY_RITUALS.map(r => ({ ...r, done: doneList.includes(r.id) }))
    const doneCount = rituals.filter(r => r.done).length
    const pct       = Math.round((doneCount / rituals.length) * 100)

    const listHtml = rituals.map(r => `
      <div class="day-mission-item ${r.done ? 'done' : ''}">
        <div class="dm-icon"><i class="${r.icon}"></i></div>
        <div style="flex:1;">
          <div style="font-weight:600;font-family:var(--font-title);font-size:1.1rem;letter-spacing:1px;text-transform:uppercase;">${r.name}</div>
          <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-dim);text-transform:uppercase;">${r.category}</div>
        </div>
        ${r.done ? '<div class="day-mission-check"><i class="fas fa-check"></i></div>' : ''}
      </div>
    `).join('')

    document.getElementById('dModalBody').innerHTML = `
      <div class="stat-grid" style="margin-bottom:16px;">
        <div class="stat-cell">
          <div class="stat-cell-label">Rituals Done</div>
          <div class="stat-cell-val">${doneCount}/${rituals.length}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Day Score</div>
          <div class="stat-cell-val" style="color:${pct >= 70 ? '#7FB77E' : pct >= 40 ? 'var(--rr-gold)' : '#D32F2F'}">${pct}%</div>
        </div>
      </div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-label">
          <span>Daily Completion</span>
          <span style="color:var(--rr-gold)">${pct}%</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:0%;" data-target="${pct}"></div>
        </div>
      </div>
      <div class="day-mission-list">${listHtml}</div>
      ${!isToday && !isPast ? '<div class="modal-tip">Future date. Complete today\'s rituals and they will be recorded here.</div>' : ''}
    `

    const modal = document.getElementById('dayModal')
    modal.classList.add('active')
    const _releaseTrap = window.trapFocus(modal)
    modal._releaseTrap = _releaseTrap
    setTimeout(() => {
      const fill = document.querySelector('#dModalBody .stat-bar-fill')
      if (fill) fill.style.width = fill.getAttribute('data-target') + '%'
    }, 50)
  }

  function closeModal() {
    const modal = document.getElementById('dayModal')
    modal.classList.remove('active')
    modal._releaseTrap?.()
  }

  // ── Day countdown ────────────────────────────────────────────────────────────
  function updateDayCountdown() {
    const now      = new Date()
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0)
    const totalDay = 86400000
    const remaining = midnight - now
    const elapsed   = totalDay - remaining
    const h = Math.floor(remaining / 3600000)
    const m = Math.floor((remaining % 3600000) / 60000)
    const s = Math.floor((remaining % 60000) / 1000)
    const pad = n => String(n).padStart(2, '0')
    const widget = document.querySelector('.day-countdown-widget')
    if (!widget) return
    if (remaining <= 0) { widget.style.display = 'none'; return }
    widget.style.display = ''
    document.getElementById('zcdH').textContent = pad(h)
    document.getElementById('zcdM').textContent = pad(m)
    document.getElementById('zcdS').textContent = pad(s)
    document.getElementById('zcdFill').style.width = ((elapsed / totalDay) * 100).toFixed(2) + '%'
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  function _keyHandler(e) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'Escape') { closeModal(); return }
    const key = e.key.toLowerCase()
    const navMap = { n: '', v: 'vanguard' }
    if (navMap[key] !== undefined) { location.hash = navMap[key]; return }
    const energyMap = { l: 'low', m: 'medium', h: 'high' }
    if (energyMap[key]) { const cur = saveEnergy(energyMap[key]); renderEnergyButtons(cur); return }
    const ritualMap = { '1':'english', '2':'greenmoney', '3':'fitness', '4':'reading', '5':'learning', '6':'wakeup', '7':'sugarfree', '8':'badhabit' }
    if (ritualMap[e.key]) {
      const card = document.querySelector(`.ritual-card[data-ritual="${ritualMap[e.key]}"]`)
      if (card) card.click()
      return
    }
    if (key === 'd') { document.getElementById('ritualGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
    if (key === 'p') { document.body.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
    if (key === 'c') {
      const _t = new Date()
      calViewYear = _t.getFullYear(); calViewMonth = _t.getMonth()
      buildBrickWall()
      document.querySelector('.brick.today')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  updateTemporal()

  const data = loadData()

  // Sync Wake Early from Vanguard
  try {
    const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
    const _tk    = todayKey()
    if (_vLogs[_tk]?.earlyWake && !((data[_tk] || []).includes('wakeup'))) {
      data[_tk] = data[_tk] || []
      data[_tk].push('wakeup')
      saveData(data)
    }
  } catch (_) {}

  loadTodayState(data)
  updateMetrics(data)
  renderEnergyButtons(loadEnergyForToday())

  ;['low', 'medium', 'high'].forEach(lvl => {
    document.getElementById(`m-energy-${lvl}`).addEventListener('click', () => {
      const current = saveEnergy(lvl)
      renderEnergyButtons(current)
    })
  })

  document.querySelectorAll('.ritual-card').forEach(card => {
    card.addEventListener('click', function () {
      this.classList.toggle('completed')

      const d2     = loadData()
      const key    = todayKey()
      const list   = d2[key] || []
      const ritual = this.dataset.ritual

      if (this.classList.contains('completed')) {
        if (!list.includes(ritual)) list.push(ritual)
        for (let s = 0; s < 5; s++) {
          const sp = document.createElement('div')
          sp.style.cssText = `
            position:absolute;width:4px;height:4px;
            background:var(--rr-gold);border-radius:50%;
            pointer-events:none;top:${20 + Math.random() * 60}%;left:${20 + Math.random() * 60}%;
            opacity:1;transition:all 0.8s ease;z-index:10;
          `
          this.appendChild(sp)
          requestAnimationFrame(() => {
            sp.style.transform = `translate(${(Math.random() - 0.5) * 60}px,${(Math.random() - 0.5) * 60}px)`
            sp.style.opacity = '0'
          })
          setTimeout(() => sp.remove(), 800)
        }
      } else {
        const idx = list.indexOf(ritual)
        if (idx > -1) list.splice(idx, 1)
      }
      d2[key] = list
      saveData(d2)

      if (list.length >= TOTAL_RITUALS && this.classList.contains('completed')) launchConfetti()

      // Sync Wake Early ↔ Vanguard
      if (ritual === 'wakeup') {
        try {
          const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
          if (!_vLogs[key]) _vLogs[key] = { missions: {} }
          _vLogs[key].earlyWake = this.classList.contains('completed')
          localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs))
          saveCloudKey('vanguard-logs', _vLogs)
          _nexusSync.broadcast('MASTERY')
        } catch (_) {}
      }

      // Sync single-ritual half-contributions ↔ Vanguard
      const _halfMap = { english: 'm5', learning: 'm1', fitness: 'm2', reading: 'm4', sugarfree: 'm3' }
      if (_halfMap[ritual]) {
        try {
          const _mid   = _halfMap[ritual]
          const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
          if (!_vLogs[key]) _vLogs[key] = { missions: {} }
          if (!_vLogs[key].missions) _vLogs[key].missions = {}
          if (this.classList.contains('completed')) _vLogs[key].missions[_mid] = 'partial'
          else delete _vLogs[key].missions[_mid]
          localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs))
          saveCloudKey('vanguard-logs', _vLogs)
          _nexusSync.broadcast('MASTERY')
        } catch (_) {}
      }

      // Sync Mental Fortitude (m6) ↔ Vanguard
      if (ritual === 'greenmoney' || ritual === 'badhabit') {
        try {
          const _d2    = loadData()
          const _list  = _d2[key] || []
          const _green = _list.includes('greenmoney')
          const _bad   = _list.includes('badhabit')
          const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}')
          if (!_vLogs[key]) _vLogs[key] = { missions: {} }
          if (!_vLogs[key].missions) _vLogs[key].missions = {}
          if (_green && _bad)      _vLogs[key].missions['m6'] = 'completed'
          else if (_green || _bad) _vLogs[key].missions['m6'] = 'partial'
          else                     delete _vLogs[key].missions['m6']
          localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs))
          saveCloudKey('vanguard-logs', _vLogs)
          _nexusSync.broadcast('MASTERY')
        } catch (_) {}
      }

      updateMetrics(d2)
    })
  })

  _nexusSync.listen(() => {
    if (_destroyed) return
    const _d = loadData()
    loadTodayState(_d)
    updateMetrics(_d)
  })

  updateDayCountdown()
  _countdownInterval = setInterval(updateDayCountdown, 1000)

  document.addEventListener('keydown', _keyHandler)

  buildBrickWall()

  document.getElementById('calPrev').addEventListener('click', () => {
    calViewMonth--
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear-- }
    buildBrickWall()
  })
  document.getElementById('calNext').addEventListener('click', () => {
    calViewMonth++
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++ }
    buildBrickWall()
  })

  document.getElementById('dayModalClose').addEventListener('click', closeModal)
  document.getElementById('dayModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal() })

  // ── Destroy ──────────────────────────────────────────────────────────────────
  return function destroy() {
    _destroyed       = true
    _temporalStopped = true
    clearTimeout(_temporalTimeout)
    clearInterval(_countdownInterval)
    document.removeEventListener('keydown', _keyHandler)
    document.body.classList.remove('loaded')
    container.innerHTML = ''
  }
}
