/* ════════════════════════════════════════════
   STORAGE KEY  mastery_data
   Schema: { "YYYY-MM-DD": ["ritual","ritual",...], ... }
   ════════════════════════════════════════════ */

const STORAGE_KEY   = 'mastery_data';
const TOTAL_RITUALS = 8;
let saveCloudKey = () => Promise.resolve();

/* ── MASTERY RITUALS CATALOG (for calendar modal) ── */
const MASTERY_RITUALS = [
    { id: "english",    name: "English",     icon: "fa-solid fa-pen-nib",          category: "Language"  },
    { id: "greenmoney", name: "Green Money", icon: "fa-solid fa-coins",            category: "Finance"   },
    { id: "fitness",    name: "Fitness",     icon: "fa-solid fa-dumbbell",         category: "Fitness"   },
    { id: "reading",    name: "Reading",     icon: "fa-solid fa-book-open-reader", category: "Knowledge" },
    { id: "learning",   name: "Learning",    icon: "fa-solid fa-brain",            category: "Tech"      },
    { id: "wakeup",     name: "Wake Early",  icon: "fa-solid fa-sun",              category: "Routine"   },
    { id: "sugarfree",  name: "Sugar-Free",  icon: "fa-solid fa-seedling",         category: "Health"    },
    { id: "badhabit",   name: "Bad Habit",   icon: "fa-solid fa-link-slash",       category: "Character" },
];
const CAL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_SHORT_WEEK  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const _calToday = new Date();
let calViewYear  = _calToday.getFullYear();
let calViewMonth = _calToday.getMonth();

/* ── LIVE SYNC · BroadcastChannel (shared global from storage.js) ── */
const _nexusSync = window._nexusSync;
/* ── todayKey from storage.js ── */
const todayKey = window.todayKey;

/* ── HELPERS ── */
function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
}
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveCloudKey('mastery_data', data);
    _nexusSync.broadcast('MASTERY');
}

function getWeekNumber(date) {
    const doy = getDayOfYear(date);
    const jan1Day = new Date(date.getFullYear(), 0, 1).getDay();
    return Math.ceil((doy + jan1Day) / 7);
}
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000);
    return Math.floor(diff / 86400000);
}
function isLeapYear(y) { return (y%4===0 && y%100!==0) || y%400===0; }

/* ── TEMPORAL ── */
function updateTemporal() {
    const now    = new Date();
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    document.getElementById('tw-day').textContent = days[now.getDay()].slice(0,3).toUpperCase();
    document.getElementById('tw-date').textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const wk = getWeekNumber(now);
    document.getElementById('tw-week').textContent = String(wk).padStart(2,'0');
    const sow = new Date(now); sow.setDate(now.getDate() - now.getDay());
    const eow = new Date(sow); eow.setDate(sow.getDate() + 6);
    document.getElementById('tw-weekrange').textContent = `${months[sow.getMonth()]} ${sow.getDate()} – ${months[eow.getMonth()]} ${eow.getDate()}`;
    document.getElementById('week-progress').style.width = ((now.getDay()/6)*100) + '%';

    const doy      = getDayOfYear(now);
    const yearDays = isLeapYear(now.getFullYear()) ? 366 : 365;
    const yearPct  = ((doy - 1) / yearDays * 100).toFixed(1);
    document.getElementById('tw-doy').textContent    = doy;
    document.getElementById('tw-doypct').textContent = yearPct + '% elapsed';
    document.getElementById('year-progress').style.width = yearPct + '%';

    const hh = now.getHours(), mm = String(now.getMinutes()).padStart(2,'0');
    const h12 = hh % 12 || 12;
    document.getElementById('tw-time').textContent = `${h12}:${mm}`;
    document.getElementById('tw-session').textContent = hh < 12 ? 'MORNING' : hh < 17 ? 'AFTERNOON' : hh < 21 ? 'EVENING' : 'NIGHT';

    setTimeout(updateTemporal, 30000);
}

/* ── ENERGY TAGGING ── */
function loadEnergyForToday() {
    try {
        const vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
        return vLogs[todayKey()]?.energy || null;
    } catch { return null; }
}
function saveEnergy(lvl) {
    try {
        const vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
        const key   = todayKey();
        if (!vLogs[key]) vLogs[key] = { missions: {} };
        if (vLogs[key].energy === lvl) delete vLogs[key].energy;
        else vLogs[key].energy = lvl;
        localStorage.setItem('vanguard-logs', JSON.stringify(vLogs));
        saveCloudKey('vanguard-logs', vLogs);
        _nexusSync.broadcast('MASTERY');
        return vLogs[key].energy || null;
    } catch { return null; }
}
function renderEnergyButtons(energy) {
    ["low","medium","high"].forEach(lvl => {
        const btn = document.getElementById(`m-energy-${lvl}`);
        if (btn) btn.className = `energy-btn-m${energy === lvl ? ` active-${lvl}` : ''}`;
    });
}

/* ── STREAK CALCULATION ── */
function calcStreaks(data) {
    const keys = Object.keys(data).sort();
    if (!keys.length) return { current: 0, best: 0 };
    let best = 0, cur = 0, prev = null;
    const today = todayKey();
    for (const k of keys) {
        if (!data[k] || data[k].length === 0) { cur = 0; prev = null; continue; }
        if (!prev) { cur = 1; }
        else {
            const d1   = new Date(prev + 'T12:00:00');
            const d2   = new Date(k    + 'T12:00:00');
            const diff = Math.round((d2 - d1) / 86400000);
            cur = diff === 1 ? cur + 1 : 1;
        }
        if (cur > best) best = cur;
        prev = k;
    }
    if (!data[today] || data[today].length === 0) {
        const yd = new Date(); yd.setDate(yd.getDate()-1);
        const ydKey = yd.toISOString().slice(0,10);
        if (!data[ydKey] || data[ydKey].length === 0) cur = 0;
    }
    return { current: cur, best };
}

/* ── METRICS ── */
function updateMetrics(data) {
    const { current, best } = calcStreaks(data);
    const today     = todayKey();
    const todayList = data[today] || [];
    const allKeys   = Object.keys(data).filter(k => data[k]?.length > 0);

    document.getElementById('m-streak').textContent = current;
    
    // Update SVG Streak Ring
    const circ = 2 * Math.PI * 31;
    const pct  = Math.min(current / 30, 1);
    const el   = document.getElementById('streak-circle');
    if(el) { el.style.strokeDasharray = circ; el.style.strokeDashoffset = circ - pct * circ; }

    document.getElementById('m-best').textContent   = best;
    document.getElementById('m-total').textContent   = allKeys.length;
    document.getElementById('m-today').textContent   = `${todayList.length}/${TOTAL_RITUALS}`;

    let sum7 = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        sum7 += (data[k] || []).length;
    }
    document.getElementById('m-avg7').textContent = (sum7 / 7).toFixed(1);

    const perfect = allKeys.filter(k => data[k].length >= TOTAL_RITUALS).length;
    document.getElementById('m-perfect').textContent = perfect;

    let weekSum = 0;
    const now2 = new Date();
    for (let i = 0; i <= now2.getDay(); i++) {
        const d = new Date(now2); d.setDate(now2.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        weekSum += (data[k] || []).length;
    }
    document.getElementById('m-week').textContent = weekSum;

    const score = allKeys.reduce((acc, k) => {
        const c = data[k].length;
        return acc + c + (c >= TOTAL_RITUALS ? 10 : 0);
    }, 0);
    document.getElementById('m-mastery').textContent = score;

    const dayTotals = [0,0,0,0,0,0,0];
    const dayCounts = [0,0,0,0,0,0,0];
    const dayNames  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    allKeys.forEach(k => {
        const dow = new Date(k + 'T12:00:00').getDay();
        dayTotals[dow] += data[k].length;
        dayCounts[dow]++;
    });
    const dayAvgs = dayTotals.map((t,i) => dayCounts[i] ? t / dayCounts[i] : null);
    let weakIdx = -1, weakVal = Infinity;
    dayAvgs.forEach((v,i) => { if (v !== null && v < weakVal) { weakVal = v; weakIdx = i; } });
    document.getElementById('m-weakday').textContent    = weakIdx >= 0 ? dayNames[weakIdx] : '—';
    document.getElementById('m-weakday-avg').textContent = weakIdx >= 0 ? `avg ${weakVal.toFixed(1)} rituals` : 'not enough data';

    const ritualKeys = ['english','greenmoney','fitness','reading','learning','wakeup','sugarfree','badhabit'];
    const ritualLabels = { english:'English', greenmoney:'Money', fitness:'Fitness', reading:'Reading', learning:'Learning', wakeup:'Wake Up', sugarfree:'Sugar-Free', badhabit:'Bad Habit' };
    const rc = {};
    ritualKeys.forEach(r => rc[r] = 0);
    allKeys.forEach(k => { (data[k]||[]).forEach(r => { if(rc[r]!==undefined) rc[r]++; }); });
    const top = Object.entries(rc).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('m-topritual').textContent      = top && top[1]>0 ? ritualLabels[top[0]]||top[0] : '—';
    document.getElementById('m-topritual-count').textContent = top && top[1]>0 ? `${top[1]} completions` : 'all-time completions';

    const perfKeys = allKeys.filter(k => data[k].length >= TOTAL_RITUALS).sort();
    if (perfKeys.length) {
        const last = perfKeys[perfKeys.length - 1];
        const diff = Math.round((new Date(today+'T12:00:00') - new Date(last+'T12:00:00')) / 86400000);
        document.getElementById('m-sinceperfect').textContent     = diff===0 ? 'TODAY' : diff;
        document.getElementById('m-sinceperfect-sub').textContent = diff===0 ? 'perfect day!' : 'days ago';
    } else {
        document.getElementById('m-sinceperfect').textContent     = '—';
        document.getElementById('m-sinceperfect-sub').textContent = 'no perfect day yet';
    }

    const now3 = new Date();
    const thisMP = `${now3.getFullYear()}-${String(now3.getMonth()+1).padStart(2,'0')}`;
    const lm = new Date(now3.getFullYear(), now3.getMonth()-1, 1);
    const lastMP = `${lm.getFullYear()}-${String(lm.getMonth()+1).padStart(2,'0')}`;
    const thisMS  = allKeys.filter(k=>k.startsWith(thisMP)).reduce((a,k)=>a+data[k].length,0);
    const lastMS  = allKeys.filter(k=>k.startsWith(lastMP)).reduce((a,k)=>a+data[k].length,0);
    const diffM   = thisMS - lastMS;
    document.getElementById('m-monthvs').textContent     = thisMS;
    document.getElementById('m-monthvs-sub').textContent = lastMS ? `${diffM>=0?'+':''}${diffM} vs last month` : 'no last-month data';

    updateCompletionBar(todayList.length);
}

function updateCompletionBar(count) {
    const pct = (count / TOTAL_RITUALS) * 100;
    document.getElementById('comp-bar').style.width = pct + '%';
    document.getElementById('comp-label').textContent = `${count} of ${TOTAL_RITUALS} completed`;
}

/* ── RITUAL STATE ── */
function loadTodayState(data) {
    const todayList = data[todayKey()] || [];
    document.querySelectorAll('.ritual-card').forEach(card => {
        card.classList.toggle('completed', todayList.includes(card.dataset.ritual));
    });
    updateCompletionBar(todayList.length);
}

/* ── CONFETTI ── */
function launchConfetti() {
    const ck = 'mastery-confetti-' + todayKey();
    if (localStorage.getItem(ck)) return;
    localStorage.setItem(ck, '1');

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;

    const COLORS = ['#C5A572','#E8E8E8','#FFFFFF','#B8860B'];
    const SHAPES = ['rect','circle'];
    const parts  = [];
    for (let i = 0; i < 180; i++) {
        const side = 4 + Math.random() * 7;
        parts.push({
            x: Math.random()*canvas.width, y: -20-Math.random()*300,
            w: side, h: side*(0.3+Math.random()*0.5),
            shape: SHAPES[Math.random()<0.3?1:0],
            color: COLORS[Math.floor(Math.random()*COLORS.length)],
            vx:(Math.random()-0.5)*5, vy:1.5+Math.random()*4,
            rot:Math.random()*360, rotV:(Math.random()-0.5)*8,
            opacity:1, fadeStart:canvas.height*(0.55+Math.random()*0.25)
        });
    }
    function tick() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let any = false;
        for (const p of parts) {
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.07; p.vx*=0.995; p.rot+=p.rotV;
            if (p.y>p.fadeStart) p.opacity-=0.018;
            if (p.opacity<=0) continue;
            any=true;
            ctx.save();
            ctx.globalAlpha=Math.max(0,p.opacity);
            ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
            ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=5;
            if (p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.w/2,0,Math.PI*2);ctx.fill();}
            else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
            ctx.restore();
        }
        if (any) requestAnimationFrame(tick); else canvas.remove();
    }
    requestAnimationFrame(tick);
    showToast('✦ EXCELLENCE ACHIEVED — ALL RITUALS COMPLETE');
}

/* ── TOAST ── */
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 2800);
}

/* ── BUILD BRICK WALL CALENDAR ── */
function buildBrickWall() {
    const year  = calViewYear;
    const month = calViewMonth;
    const daysInMonth    = new Date(year, month + 1, 0).getDate();
    const startingWeekday = new Date(year, month, 1).getDay();
    const container = document.getElementById('brickWall');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < startingWeekday; i++) {
        const empty = document.createElement('div');
        empty.className = 'brick empty-brick';
        container.appendChild(empty);
    }
    const td = _calToday.getDate(), tm = _calToday.getMonth(), ty = _calToday.getFullYear();
    for (let d = 1; d <= daysInMonth; d++) {
        const brick = document.createElement('div');
        brick.className = 'brick';
        if (d === td && month === tm && year === ty) brick.classList.add('today');
        const dow = new Date(year, month, d).getDay();
        if (dow === 0 || dow === 6) brick.classList.add('weekend');
        brick.innerHTML = `<div class="day-num">${d}</div><div class="weekday-letter">${CAL_SHORT_WEEK[dow]}</div>`;
        brick.addEventListener('click', () => openDayModal(year, month, d));
        container.appendChild(brick);
    }
    document.getElementById('monthIndicator').textContent = `${CAL_MONTH_NAMES[month]} ${year}`;
}

/* ── OPEN DAY MODAL ── */
function openDayModal(year, month, day) {
    const dateObj   = new Date(year, month, day);
    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dateObj.getDay()];
    const isToday   = (year === _calToday.getFullYear() && month === _calToday.getMonth() && day === _calToday.getDate());
    const isPast    = dateObj < new Date(_calToday.getFullYear(), _calToday.getMonth(), _calToday.getDate());
    const dateStr   = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    document.getElementById('dModalTitle').textContent    = `${dayOfWeek}, ${CAL_MONTH_NAMES[month]} ${day}`;
    document.getElementById('dModalSubtitle').textContent = isToday
        ? 'TODAY · CURRENT ACTIVE SESSION'
        : isPast ? `PAST DATE · ${year}` : `UPCOMING · ${year}`;

    const data     = loadData();
    const doneList = data[dateStr] || [];
    const rituals  = MASTERY_RITUALS.map(r => ({ ...r, done: doneList.includes(r.id) }));
    const doneCount  = rituals.filter(r => r.done).length;
    const pct        = Math.round((doneCount / rituals.length) * 100);

    const listHtml = rituals.map(r => `
        <div class="day-mission-item ${r.done ? 'done' : ''}">
            <div class="dm-icon"><i class="${r.icon}"></i></div>
            <div style="flex:1;">
                <div style="font-weight:600; font-family:var(--font-title); font-size:1.1rem; letter-spacing:1px; text-transform:uppercase;">${r.name}</div>
                <div style="font-family:var(--font-mono); font-size:0.6rem; color:var(--text-dim); text-transform:uppercase;">${r.category}</div>
            </div>
            ${r.done ? '<div class="day-mission-check"><i class="fas fa-check"></i></div>' : ''}
        </div>
    `).join('');

    document.getElementById('dModalBody').innerHTML = `
        <div class="stat-grid" style="margin-bottom:16px;">
            <div class="stat-cell">
                <div class="stat-cell-label">Rituals Done</div>
                <div class="stat-cell-val">${doneCount}/${rituals.length}</div>
            </div>
            <div class="stat-cell">
                <div class="stat-cell-label">Day Score</div>
                <div class="stat-cell-val" style="color:${pct>=70?'#7FB77E':pct>=40?'var(--rr-gold)':'#D32F2F'}">${pct}%</div>
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
    `;

    const modal = document.getElementById('dayModal');
    modal.classList.add('active');
    const _releaseTrap = window.trapFocus(modal);
    modal._releaseTrap = _releaseTrap;
    setTimeout(() => {
        const fill = document.querySelector('#dModalBody .stat-bar-fill');
        if (fill) fill.style.width = fill.getAttribute('data-target') + '%';
    }, 50);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', async function() {
    
    // Generate particles
    const particlesEl = document.querySelector('.particles');
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
            position:absolute; background:rgba(197,165,114,${Math.random()*0.25});
            width:${Math.random()*4}px; height:${Math.random()*4}px;
            top:${Math.random()*100}%; left:${Math.random()*100}%;
            animation:float ${5+Math.random()*10}s linear infinite;
        `;
        particlesEl.appendChild(p);
    }

    try {
        const _mod = await import('./appwrite-sync.js');
        const _user = await _mod.getCurrentUser();
        if (!_user) { location.href = 'index.html'; return; }
        saveCloudKey = _mod.saveCloudKey;
        await _mod.ensureCloudDefaults();
        await _mod.bootstrapCloudToLocal();
    } catch(e) {}
    document.body.classList.add('loaded');

    updateTemporal();

    const data = loadData();

    // Sync Wake Early from Vanguard
    try {
        const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
        const _tk    = todayKey();
        if (_vLogs[_tk]?.earlyWake && !((data[_tk] || []).includes('wakeup'))) {
            data[_tk] = data[_tk] || [];
            data[_tk].push('wakeup');
            saveData(data);
        }
    } catch(e) {}

    loadTodayState(data);
    updateMetrics(data);
    renderEnergyButtons(loadEnergyForToday());

    ["low","medium","high"].forEach(lvl => {
        document.getElementById(`m-energy-${lvl}`).addEventListener('click', () => {
            const current = saveEnergy(lvl);
            renderEnergyButtons(current);
        });
    });

    document.querySelectorAll('.ritual-card').forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('completed');

            const d2     = loadData();
            const key    = todayKey();
            const list   = d2[key] || [];
            const ritual = this.dataset.ritual;

            if (this.classList.contains('completed')) {
                if (!list.includes(ritual)) list.push(ritual);
                
                // Sparkles
                for (let s = 0; s < 5; s++) {
                    const sp = document.createElement('div');
                    sp.style.cssText = `
                        position:absolute; width:4px; height:4px;
                        background:var(--rr-gold); border-radius:50%;
                        pointer-events:none; top:${20+Math.random()*60}%; left:${20+Math.random()*60}%;
                        opacity:1; transition:all 0.8s ease; z-index: 10;
                    `;
                    this.appendChild(sp);
                    requestAnimationFrame(() => {
                        sp.style.transform = `translate(${(Math.random()-0.5)*60}px,${(Math.random()-0.5)*60}px)`;
                        sp.style.opacity = '0';
                    });
                    setTimeout(() => sp.remove(), 800);
                }
            } else {
                const idx = list.indexOf(ritual);
                if (idx > -1) list.splice(idx, 1);
            }
            d2[key] = list;
            saveData(d2);

            if (list.length >= TOTAL_RITUALS && this.classList.contains('completed')) launchConfetti();

            // Sync Wake Early ↔ Vanguard
            if (ritual === 'wakeup') {
                try {
                    const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
                    if (!_vLogs[key]) _vLogs[key] = { missions: {} };
                    _vLogs[key].earlyWake = this.classList.contains('completed');
                    localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs));
                    saveCloudKey('vanguard-logs', _vLogs);
                    _nexusSync.broadcast('MASTERY');
                } catch(e) {}
            }

            // Sync single-ritual half-contributions ↔ Vanguard
            const _halfMap = { english: 'm5', learning: 'm1', fitness: 'm2', reading: 'm4', sugarfree: 'm3' };
            if (_halfMap[ritual]) {
                try {
                    const _mid = _halfMap[ritual];
                    const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
                    if (!_vLogs[key]) _vLogs[key] = { missions: {} };
                    if (!_vLogs[key].missions) _vLogs[key].missions = {};
                    if (this.classList.contains('completed')) _vLogs[key].missions[_mid] = 'partial';
                    else delete _vLogs[key].missions[_mid];
                    localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs));
                    saveCloudKey('vanguard-logs', _vLogs);
                    _nexusSync.broadcast('MASTERY');
                } catch(e) {}
            }

            // Sync Mental Fortitude (m6) ↔ Vanguard
            if (ritual === 'greenmoney' || ritual === 'badhabit') {
                try {
                    const _d2 = loadData();
                    const _list = _d2[key] || [];
                    const _green = _list.includes('greenmoney');
                    const _bad   = _list.includes('badhabit');
                    const _vLogs = JSON.parse(localStorage.getItem('vanguard-logs') || '{}');
                    if (!_vLogs[key]) _vLogs[key] = { missions: {} };
                    if (!_vLogs[key].missions) _vLogs[key].missions = {};
                    if (_green && _bad)       _vLogs[key].missions['m6'] = 'completed';
                    else if (_green || _bad)  _vLogs[key].missions['m6'] = 'partial';
                    else                      delete _vLogs[key].missions['m6'];
                    localStorage.setItem('vanguard-logs', JSON.stringify(_vLogs));
                    saveCloudKey('vanguard-logs', _vLogs);
                    _nexusSync.broadcast('MASTERY');
                } catch(e) {}
            }

            updateMetrics(d2);
        });
    });

    _nexusSync.listen(() => {
        const _d = loadData();
        loadTodayState(_d);
        updateMetrics(_d);
    });

    function updateDayCountdown() {
        const now = new Date();
        const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
        const totalDay = 86400000;
        const remaining = midnight - now;
        const elapsed = totalDay - remaining;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        const pad = n => String(n).padStart(2, '0');
        const widget = document.querySelector('.day-countdown-widget');
        if (remaining <= 0) {
            widget.style.display = 'none';
            return;
        } else {
            widget.style.display = '';
        }
        document.getElementById('zcdH').textContent = pad(h);
        document.getElementById('zcdM').textContent = pad(m);
        document.getElementById('zcdS').textContent = pad(s);
        document.getElementById('zcdFill').style.width = ((elapsed / totalDay) * 100).toFixed(2) + '%';
    }
    updateDayCountdown();
    setInterval(updateDayCountdown, 1000);

    document.addEventListener("keydown", (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.key === 'Escape') { const m = document.getElementById('dayModal'); m.classList.remove('active'); m._releaseTrap?.(); return; }
        const key = e.key.toLowerCase();
        const navMap = { n: "index.html", v: "vanguard.html" };
        if (navMap[key]) { window.location.href = navMap[key]; return; }
        const energyMap = { l: "low", m: "medium", h: "high" };
        if (energyMap[key]) { const cur = saveEnergy(energyMap[key]); renderEnergyButtons(cur); return; }
        const ritualMap = { "1": "english", "2": "greenmoney", "3": "fitness", "4": "reading", "5": "learning", "6": "wakeup", "7": "sugarfree", "8": "badhabit" };
        if (ritualMap[e.key]) { const card = document.querySelector(`.ritual-card[data-ritual="${ritualMap[e.key]}"]`); if (card) card.click(); }
        if (key === 'd') { document.getElementById('ritualGrid').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (key === 'p') { document.body.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (key === 'c') {
            const _t = new Date();
            calViewYear = _t.getFullYear(); calViewMonth = _t.getMonth();
            buildBrickWall();
            const todayBrick = document.querySelector('.brick.today');
            if (todayBrick) todayBrick.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    });

    buildBrickWall();
    document.getElementById('calPrev').addEventListener('click', () => { calViewMonth--; if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; } buildBrickWall(); });
    document.getElementById('calNext').addEventListener('click', () => { calViewMonth++; if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; } buildBrickWall(); });

    function closeModal() {
        const modal = document.getElementById('dayModal');
        modal.classList.remove('active');
        modal._releaseTrap?.();
    }
    document.getElementById('dayModalClose').addEventListener('click', closeModal);
    document.getElementById('dayModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

});