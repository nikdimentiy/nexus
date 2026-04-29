let saveCloudKey = () => Promise.resolve();

      // ─── MISSIONS ───
      const MISSIONS = [
        { id: "m1", name: "Deep Caliber Work",      icon: "fa-brain",       color: "#3b82f6", rgb: "59, 130, 246",  spec: "min 3 h deep work" },
        { id: "m2", name: "Physical Conditioning",  icon: "fa-dumbbell",    color: "#22c55e", rgb: "34, 197, 94",   spec: "min 45 min + cardio" },
        { id: "m3", name: "Fuel & Nutrition",        icon: "fa-apple-whole", color: "#f97316", rgb: "249, 115, 22",  spec: "19 h fast total" },
        { id: "m4", name: "Knowledge Acquisition",  icon: "fa-book",        color: "#eab308", rgb: "234, 179, 8",   spec: "min 20 min" },
        { id: "m5", name: "Linguistic Mastery",     icon: "fa-language",    color: "#ef4444", rgb: "239, 68, 68",   spec: "min 15 min" },
        { id: "m6", name: "Mental Fortitude",       icon: "fa-bolt",        color: "#a855f7", rgb: "168, 85, 247",  spec: "no spend · no bad habit" },
        { id: "m7", name: "Strategic Recovery",     icon: "fa-bed",         color: "#94a3b8", rgb: "148, 163, 184", spec: "wake ≤6 AM · bed 10 PM" },
      ];

      // Each month has exactly 3 cycles: days 1–10, 11–20, 21–end-of-month
      const SEG_THEMES = [
        { name: "Segment 1", color: "var(--accent)", rgb: "79, 70, 229" },
        { name: "Segment 2", color: "var(--green)",  rgb: "16, 185, 129" },
        { name: "Segment 3", color: "var(--violet)", rgb: "139, 92, 246" },
      ];
      const OVERALL_THEME = { name: "Cycle Overall", color: "var(--gold)", rgb: "245, 158, 11" };

      // ─── SIDEBAR ───
      const sidebar = document.getElementById("app-sidebar");
      const _isMobile = () => window.innerWidth <= 1024;
      const _storedCollapsed = localStorage.getItem("matrix-sidebar-collapsed");
      let sidebarCollapsed = _storedCollapsed !== null ? _storedCollapsed === "true" : _isMobile();
      function applySidebarState() { sidebarCollapsed ? sidebar.classList.add("collapsed") : sidebar.classList.remove("collapsed"); }
      document.getElementById("btn-toggle-sidebar").addEventListener("click", () => {
        sidebarCollapsed = !sidebarCollapsed; localStorage.setItem("matrix-sidebar-collapsed", sidebarCollapsed); applySidebarState();
      });
      applySidebarState();

      // ─── PANELS TOGGLE ───
      const bottomPanels = document.getElementById("bottom-panels");
      const calendarWidget = document.getElementById("calendar-widget");
      const btnToggleWidgets = document.getElementById("btn-toggle-widgets");
      let widgetsHidden = localStorage.getItem("matrix-widgets-hidden") === "true";
      function applyWidgetsState() {
        if (widgetsHidden) {
          bottomPanels.style.display = "none";
          if (calendarWidget) calendarWidget.style.display = "none";
          btnToggleWidgets.innerHTML = '<i class="fa-solid fa-eye"></i> Show';
        } else {
          bottomPanels.style.display = "flex";
          if (calendarWidget) calendarWidget.style.display = "";
          btnToggleWidgets.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide';
        }
      }
      btnToggleWidgets.addEventListener("click", () => { widgetsHidden = !widgetsHidden; localStorage.setItem("matrix-widgets-hidden", widgetsHidden); applyWidgetsState(); });
      applyWidgetsState();

      // ─── THEME ───
      const body = document.body;
      const btnToggleTheme = document.getElementById("btn-toggle-theme");
      let theme = localStorage.getItem("matrix-theme") || "light";
      function applyTheme() {
        if (theme === "dark") { body.classList.add("theme-dark"); btnToggleTheme.innerHTML = '<i class="fa-regular fa-sun"></i> Light'; }
        else { body.classList.remove("theme-dark"); btnToggleTheme.innerHTML = '<i class="fa-solid fa-moon"></i> Dark'; }
        localStorage.setItem("matrix-theme", theme);
      }
      btnToggleTheme.addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; applyTheme(); });
      applyTheme();

      // ─── STATE ───
      let logs = {};
      let latestPredictions = [];
      let currentModalExportData = null;
      let currentCycleStart = null;

      const table = document.getElementById("mission-grid");
      const inpDate = document.getElementById("inp-date");
      const inpNote = document.getElementById("inp-note");
      const noteCharCount = document.getElementById("note-char-count");
      const inpDeepFocus = document.getElementById("inp-deep-focus");
      const btnEarlyWake = document.getElementById("btn-early-wake");
      const btnPlanning = document.getElementById("btn-planning");
      const btnOnTrack = document.getElementById("btn-on-track");
      const displayPts = document.getElementById("disp-pts");
      const dispDay = document.getElementById("disp-day");
      const dispPct = document.getElementById("disp-pct");

      /* ── LIVE SYNC · BroadcastChannel ── */
      const _nexusSync = (() => {
        try {
          const ch = new BroadcastChannel('nexus-sync');
          return {
            broadcast: src => ch.postMessage({ type: 'storage-update', source: src }),
            listen:    cb  => { ch.onmessage = e => { if (e.data?.type === 'storage-update') cb(); }; }
          };
        } catch { return { broadcast: () => {}, listen: () => {} }; }
      })();

      // ─── UTILS ───
      function saveToLocal() {
        localStorage.setItem("vanguard-logs", JSON.stringify(logs));
        saveCloudKey('vanguard-logs', logs);
        _nexusSync.broadcast('VANGUARD');
      }
      function loadFromLocal() { const d = localStorage.getItem("vanguard-logs"); if (d) try { logs = JSON.parse(d); } catch (e) { logs = {}; } }

      // ─── CYCLE GOALS ───
      let cycleGoals = {};
      function saveCycleGoals() {
        localStorage.setItem("vanguard-cycle-goals", JSON.stringify(cycleGoals));
        saveCloudKey('vanguard-cycle-goals', cycleGoals);
      }
      function loadCycleGoals() { try { cycleGoals = JSON.parse(localStorage.getItem("vanguard-cycle-goals") || "{}"); } catch { cycleGoals = {}; } }
      function updateCycleGoalInput() {
        const csKey = formatPSTDate(currentCycleStart);
        const csEnd = getCycleEnd(currentCycleStart);
        const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        document.getElementById("goal-cycle-label").textContent =
          `${mo[currentCycleStart.getMonth()]} ${currentCycleStart.getDate()} – ${mo[csEnd.getMonth()]} ${csEnd.getDate()}`;
        const val = cycleGoals[csKey] || "";
        document.getElementById("inp-cycle-goal").value = val;
        const cc = document.getElementById("goal-char-count");
        cc.textContent = `${val.length} / 150`;
        cc.classList.toggle("warn", val.length > 120);
      }
      function getPSTDate() { return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })); }
      function formatPSTDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
      function formatHumanReadable(dateObj) { return dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); }
      function formatDateRange(start, end) {
        const sM = start.toLocaleDateString("en-US",{month:"short"}), sD = String(start.getDate()).padStart(2,"0");
        const eM = end.toLocaleDateString("en-US",{month:"short"}), eD = String(end.getDate()).padStart(2,"0");
        const yr = end.getFullYear();
        if (sM === eM && start.getFullYear() === end.getFullYear()) return `${sM} ${sD} — ${eD}, ${yr}`;
        else if (start.getFullYear() === end.getFullYear()) return `${sM} ${sD} — ${eM} ${eD}, ${yr}`;
        else return `${sM} ${sD}, ${start.getFullYear()} — ${eM} ${eD}, ${yr}`;
      }

      // ─── CYCLE LOGIC ─── starts Apr 1, 2026 with 10-day cycles (Cycle 1=Apr 1–10, Cycle 2=Apr 11–20, …)
      function getCycleStart(pstDate) {
        const d = pstDate.getDate();
        const startDay = d <= 10 ? 1 : d <= 20 ? 11 : 21;
        return new Date(pstDate.getFullYear(), pstDate.getMonth(), startDay);
      }
      function getCycleEnd(cs) {
        const d = cs.getDate();
        if (d === 1)  return new Date(cs.getFullYear(), cs.getMonth(), 10);
        if (d === 11) return new Date(cs.getFullYear(), cs.getMonth(), 20);
        return new Date(cs.getFullYear(), cs.getMonth() + 1, 0); // last day of month
      }
      function getCycleDays(cs) {
        const ce = getCycleEnd(cs);
        return Math.round((Date.UTC(ce.getFullYear(), ce.getMonth(), ce.getDate()) -
                           Date.UTC(cs.getFullYear(), cs.getMonth(), cs.getDate())) / 86400000) + 1;
      }
      function getCycleNumber(cs) {
        return cs.getDate() <= 10 ? 1 : cs.getDate() <= 20 ? 2 : 3;
      }
      function shiftCycle(dir) {
        const cs = currentCycleStart, d = cs.getDate();
        let s;
        if (dir === 1) {
          if (d === 1)       s = new Date(cs.getFullYear(), cs.getMonth(), 11);
          else if (d === 11) s = new Date(cs.getFullYear(), cs.getMonth(), 21);
          else               s = new Date(cs.getFullYear(), cs.getMonth() + 1, 1);
        } else {
          if (d === 21)      s = new Date(cs.getFullYear(), cs.getMonth(), 11);
          else if (d === 11) s = new Date(cs.getFullYear(), cs.getMonth(), 1);
          else               s = new Date(cs.getFullYear(), cs.getMonth() - 1, 21);
        }
        currentCycleStart = s; renderGrid();
      }
      function jumpToToday() { currentCycleStart = getCycleStart(getPSTDate()); renderGrid(); }

      function getCalculatedScoreForDate(dateStr) {
        let score = 0;
        Object.values(logs[dateStr]?.missions || {}).forEach((s) => { if (s === "completed") score += 1; if (s === "partial") score += 0.5; });
        return score;
      }
      function getIntensityColor(score) {
        if (score === 0) return "transparent";
        if (score < 2.5) return "var(--rose)";
        if (score < 4.5) return "var(--gold)";
        if (score < 6.0) return "var(--cyan)";
        return "var(--green)";
      }

      // ─── WEEK NUMBER (US Sunday-based) ───
      function isoWeekNum(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayOfWeek = d.getUTCDay();
        const weekStart = new Date(d);
        weekStart.setUTCDate(d.getUTCDate() - dayOfWeek);
        const jan1 = new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 1));
        const jan1Day = jan1.getUTCDay();
        const week1Start = new Date(jan1);
        week1Start.setUTCDate(jan1.getUTCDate() - jan1Day);
        const diff = weekStart - week1Start;
        return Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1;
      }

      // ─── AI PREDICTION (rolling 14-day pattern learning) ───
      function calculateAI_Predictions() {
        const today = getPSTDate();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomDow = tomorrow.getDay();
        const todayStr = formatPSTDate(today);

        // Build rolling 14-day window (past days only, not today)
        const window14 = [];
        for (let i = 1; i <= 14; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          window14.push(formatPSTDate(d));
        }
        const logged14 = window14.filter(ds => logs[ds]);

        let stats = [];

        MISSIONS.forEach((m) => {
          // 14-day base rate (completed=1, partial=0.5)
          let baseSum = 0;
          logged14.forEach(ds => {
            const st = logs[ds]?.missions?.[m.id];
            if (st === "completed") baseSum += 1;
            else if (st === "partial") baseSum += 0.5;
          });
          const baseRate = logged14.length > 0 ? baseSum / logged14.length : null;

          // Day-of-week rate within the 14-day window
          const dowDays = logged14.filter(ds => {
            const [y, mo, d] = ds.split("-").map(Number);
            return new Date(y, mo - 1, d).getDay() === tomDow;
          });
          let dowSum = 0;
          dowDays.forEach(ds => {
            const st = logs[ds]?.missions?.[m.id];
            if (st === "completed") dowSum += 1;
            else if (st === "partial") dowSum += 0.5;
          });
          // Require ≥2 same-DOW samples to trust the DOW rate
          const dowRate = dowDays.length >= 2 ? dowSum / dowDays.length : null;

          // Streak momentum: last 3 days (completed=1, partial=0.5)
          let streakSum = 0;
          for (let i = 1; i <= 3; i++) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const st = logs[formatPSTDate(d)]?.missions?.[m.id];
            if (st === "completed") streakSum += 1;
            else if (st === "partial") streakSum += 0.5;
          }
          const streakRate = streakSum / 3;

          // Today's logged state carries forward
          const todaySt = logs[todayStr]?.missions?.[m.id];
          const todayBonus = todaySt === "completed" ? 0.12 : todaySt === "partial" ? 0.06 : 0;

          // Weighted combination — no random variance
          let prob;
          if (baseRate === null) {
            prob = 0.5; // neutral when no data
          } else {
            const effectiveDow = dowRate !== null ? dowRate : baseRate;
            prob = effectiveDow * 0.50 + baseRate * 0.28 + streakRate * 0.15 + todayBonus * 0.07;
          }
          prob = Math.min(0.97, Math.max(0.03, prob));

          // Confidence tier based on available sample size
          const confidence = logged14.length >= 10 ? "high" : logged14.length >= 5 ? "med" : "low";

          stats.push({ mission: m, prob: prob * 100, confidence, samples: logged14.length });
        });

        stats.sort((a, b) => b.prob - a.prob);
        latestPredictions = stats;
        if (!logs[todayStr]) logs[todayStr] = { missions: {} };
        logs[todayStr].predictions = stats.map((s) => ({ id: s.mission.id, prob: s.prob }));
        renderPredictionUI(stats.slice(0, 3));
      }

      function renderPredictionUI(top3) {
        const container = document.getElementById("prediction-grid"); let html = "";
        const confLabel = { high: "●●●", med: "●●○", low: "●○○" };
        const confColor = { high: "var(--green)", med: "var(--gold)", low: "var(--text-4)" };
        top3.forEach((item) => {
          const m = item.mission, pct = Math.round(item.prob);
          const badge = `<span style="font-size:10px;font-weight:700;color:${confColor[item.confidence]};letter-spacing:1px;margin-left:6px;" title="${item.samples} days of data">${confLabel[item.confidence]}</span>`;
          html += `<div class="pred-card" style="--m-color:${m.color};--m-rgb:${m.rgb}">
            <div class="pred-card-top">
              <div class="pred-info"><div class="pred-icon"><i class="fa-solid ${m.icon}"></i></div><span class="pred-name">${m.name}${badge}</span></div>
              <div class="pred-pct-text">${pct}%</div>
            </div>
            <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
        });
        container.innerHTML = html;
      }

      // ─── CYCLE EFFICIENCY (calendar month: Seg1=days1-10, Seg2=days11-20, Seg3=days21-end) ───
      function getCycleScores(year, month) {
        // month is 1-based
        const daysInMonth = new Date(year, month, 0).getDate();
        let parts = [0, 0, 0], total = 0;
        for (let dd = 1; dd <= daysInMonth; dd++) {
          const ds = `${year}-${String(month).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
          const score = getCalculatedScoreForDate(ds);
          const seg = dd <= 10 ? 0 : dd <= 20 ? 1 : 2;
          parts[seg] += score;
          total += score;
        }
        return { parts, total, daysInMonth };
      }

      function updateEfficiencyWidget() {
        if (!currentCycleStart) return;

        // Derive calendar month from currentCycleStart
        const cycleYear = currentCycleStart.getFullYear();
        const cycleMonth = currentCycleStart.getMonth() + 1; // 1-based

        const curScores = getCycleScores(cycleYear, cycleMonth);
        const daysInMonth = curScores.daysInMonth;

        // Previous calendar month
        const prevDate = new Date(cycleYear, cycleMonth - 2, 1);
        const prevScores = getCycleScores(prevDate.getFullYear(), prevDate.getMonth() + 1);

        const container = document.getElementById("efficiency-grid"); let html = "";

        // Determine which segment today falls in (only if viewing the current month)
        const today = getPSTDate();
        const isCurrentMonth = (today.getFullYear() === cycleYear && today.getMonth() + 1 === cycleMonth);
        const todayDay = isCurrentMonth ? today.getDate() : -1;
        const curSeg = todayDay > 0 ? (todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2) : -1;

        const segStarts = [1, 11, 21];
        const segEnds = [10, 20, daysInMonth];

        for (let i = 0; i < 3; i++) {
          const start = segStarts[i];
          const end = segEnds[i];
          const segDays = end - start + 1;
          const maxPts = MISSIONS.length * segDays;

          const pts = curScores.parts[i].toFixed(1);
          const pct = ((curScores.parts[i] / maxPts) * 100).toFixed(1);
          const diff = (curScores.parts[i] - prevScores.parts[i]).toFixed(1);
          const ti = parseFloat(diff) > 0 ? "fa-arrow-up" : parseFloat(diff) < 0 ? "fa-arrow-down" : "fa-minus";
          const tc = parseFloat(diff) > 0 ? "var(--green)" : parseFloat(diff) < 0 ? "var(--rose)" : "var(--text-3)";
          const ds = parseFloat(diff) > 0 ? "+" : "";
          const theme = SEG_THEMES[i]; const isCur = i === curSeg;
          const badge = isCur ? `<span style="font-size:10px;background:${theme.color};color:white;padding:2px 6px;border-radius:4px;margin-left:8px;">NOW</span>` : "";
          const cardStyle = isCur ? `--m-color:${theme.color};--m-rgb:${theme.rgb};border-color:var(--border-2);box-shadow:var(--shadow-sm);` : `--m-color:${theme.color};--m-rgb:${theme.rgb};`;

          html += `<div class="pred-card clickable-card" style="${cardStyle}" onclick="openDetailModal('seg',${i})">
            <div class="pred-card-top">
              <div class="pred-info"><span class="pred-name" style="display:flex;align-items:center;color:${theme.color}">${theme.name}${badge}</span></div>
              <div class="pred-pct-text">${pct}%</div>
            </div>
            <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-top:-4px;">Days ${start}–${end}</div>
            <div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;margin-top:4px;">
              <span>${pts} / ${maxPts} pts</span>
              <span style="color:${tc}"><i class="fa-solid ${ti}"></i> ${ds}${diff} vs prev</span>
            </div>
            <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
        }

        const totalMaxPts = MISSIONS.length * daysInMonth;
        const curTotalPct = ((curScores.total / totalMaxPts) * 100).toFixed(1);
        const prevTotalMaxPts = MISSIONS.length * prevScores.daysInMonth;
        const prevTotalPct = ((prevScores.total / prevTotalMaxPts) * 100).toFixed(1);
        const od = (parseFloat(curTotalPct) - parseFloat(prevTotalPct)).toFixed(1);
        const ot = parseFloat(od) > 0 ? "fa-arrow-trend-up" : parseFloat(od) < 0 ? "fa-arrow-trend-down" : "fa-minus";
        const oc = parseFloat(od) > 0 ? "var(--green)" : parseFloat(od) < 0 ? "var(--rose)" : "var(--text-3)";
        const os = parseFloat(od) > 0 ? "+" : "";

        html += `<div class="pred-card clickable-card" style="--m-color:${OVERALL_THEME.color};--m-rgb:${OVERALL_THEME.rgb};" onclick="openDetailModal('overall',null)">
          <div class="pred-card-top">
            <div class="pred-info"><span class="pred-name" style="color:${OVERALL_THEME.color};">${OVERALL_THEME.name}</span></div>
            <div class="pred-pct-text">${curTotalPct}%</div>
          </div>
          <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-top:-4px;">Days 1–${daysInMonth}</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;margin-top:4px;">
            <span>${curScores.total.toFixed(1)} / ${totalMaxPts} pts</span>
            <span style="color:${oc}"><i class="fa-solid ${ot}"></i> ${os}${od}%</span>
          </div>
          <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${curTotalPct}%"></div></div>
        </div>`;

        container.innerHTML = html;
      }

      // ─── CALENDAR WIDGET: 3 sections of 10 days per current month ───
      function updateCalendarWidget(dateStr) {
        const [y, m] = dateStr.split("-").map(Number);
        const daysInMonth = new Date(y, m, 0).getDate(); // 28/30/31
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        document.getElementById("cal-month-title").innerText = `${monthNames[m-1]} ${y}`;
        const lastCycleDays = daysInMonth - 20;
        document.getElementById("cal-subtitle").innerText = `${daysInMonth}-day month · 10 · 10 · ${lastCycleDays}`;

        // Compute current day in month
        const today = getPSTDate();
        const todayStr = formatPSTDate(today);
        const todayDay = (y === today.getFullYear() && m === today.getMonth()+1) ? today.getDate() : -1;

        // Scores for each section
        function secScore(start10, end10) {
          let s = 0;
          for (let dd = start10; dd <= Math.min(end10, daysInMonth); dd++) {
            const ds = `${y}-${String(m).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
            s += getCalculatedScoreForDate(ds);
          }
          return s.toFixed(1);
        }

        // Determine which section today falls in
        const todaySec = todayDay > 0 ? (todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2) : -1;

        let html = "";
        for (let sec = 0; sec < 3; sec++) {
          const start = sec * 10 + 1;
          const end = Math.min(start + 9, daysInMonth);
          const isActiveSec = sec === todaySec;
          const score = secScore(start, end);
          const maxSec = MISSIONS.length * (end - start + 1);
          const pct = maxSec > 0 ? ((parseFloat(score) / maxSec) * 100).toFixed(0) : 0;

          html += `<div class="cal-section${isActiveSec ? ' active-section' : ''}">`;
          html += `<div class="cal-section-label">Days ${start}–${end}</div>`;
          html += `<div class="cal-bricks">`;

          for (let dd = start; dd <= end; dd++) {
            const dateObj = new Date(y, m-1, dd);
            const isSun = dateObj.getDay() === 0;
            const isTod = dd === todayDay;
            const isPast = dd < todayDay;
            let cls = "cal-brick";
            if (isTod) cls += " today";
            else if (isPast) cls += " past";
            else cls += " future";
            if (isSun) cls += " sunday";
            html += `<div class="${cls}" title="${shortMonths[m-1]} ${dd}">${dd}</div>`;
          }

          // Fill empty slots if section has fewer than 10 days (last section of 28-day month)
          for (let dd = end + 1; dd < start + 10 && dd > daysInMonth; dd++) {
            html += `<div class="cal-brick" style="opacity:0;pointer-events:none;"></div>`;
          }

          html += `</div>`;
          html += `<div class="cal-section-range">${shortMonths[m-1]} ${String(start).padStart(2,"0")} → ${String(end).padStart(2,"0")}</div>`;
          html += `<div class="cal-section-score">${score} pts · ${pct}%</div>`;
          html += `</div>`;
        }
        document.getElementById("cal-sections").innerHTML = html;
      }

      // ─── MONTHLY PROGRESS ───
      function updateMonthProgress(dateStr) {
        const [y, m, d] = dateStr.split("-").map(Number), ad = new Date(y, m-1, d);
        const mon = ad.getMonth(), yr = ad.getFullYear(), day = ad.getDate();
        const total = new Date(yr, mon+1, 0).getDate();
        const full = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const short = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        document.getElementById("month-progress-sub").innerText = `${full[mon]} ${yr}`;
        document.getElementById("month-start-label").innerText = `${short[mon]} 01`;
        document.getElementById("month-end-label").innerText = `${short[mon]} ${total}`;
        document.getElementById("month-current-day").innerText = day;
        document.getElementById("month-total-days").innerText = total;
        let html = "";
        for (let i = 1; i <= total; i++) {
          let cls = "month-brick";
          const date = new Date(yr, mon, i);
          if (date.getDay() === 0) cls += " is-sunday";
          if (i < day) cls += " filled"; else if (i === day) cls += " filled today";
          html += `<div class="${cls}" title="${short[mon]} ${i}"></div>`;
        }
        document.getElementById("month-bricks").innerHTML = html;

      }

      // ─── CURRENT WEEK WIDGET ───
      function updateWeekWidget(dateStr) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const today = new Date(y, m - 1, d);
        const dow = today.getDay(); // 0=Sun … 6=Sat
        // Week starts Sunday; offset so Sun=0
        const startOffset = -dow;
        const weekStart = new Date(today); weekStart.setDate(today.getDate() + startOffset);
        const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];
        const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let cells = "";
        for (let i = 0; i < 7; i++) {
          const dt = new Date(weekStart); dt.setDate(weekStart.getDate() + i);
          const isSun = dt.getDay() === 0;
          const isPast = dt < today;
          const isToday = dt.toDateString() === today.toDateString();
          let cls = "week-cell";
          if (isSun)   cls += " is-sun";
          if (isPast)  cls += " past";
          if (isToday) cls += " today";
          cells += `<div class="${cls}" title="${monthShort[dt.getMonth()]} ${dt.getDate()}">
            <div class="week-cell-dot">${dt.getDate()}</div>
            <div class="week-cell-name">${dayNames[i]}</div>
          </div>`;
        }
        const label = `${monthShort[weekStart.getMonth()]} ${weekStart.getDate()} – ${monthShort[new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+6).getMonth()]} ${new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+6).getDate()}`;
        document.getElementById("week-widget-label").innerText = label;
        document.getElementById("week-cells").innerHTML = cells;
      }

      // ─── MOMENTUM ───
      function getDailyMomentumValue(dateStr) {
        const score = getCalculatedScoreForDate(dateStr);
        if (score <= 0) return 0; if (score >= MISSIONS.length) return 1; return 0.5;
      }
      function getMomentumCoefficient() {
        const today = getPSTDate(); let weightedSum = 0, weightTotal = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const val = getDailyMomentumValue(formatPSTDate(d)), weight = 7 - i;
          weightedSum += val * weight; weightTotal += weight;
        }
        return weightTotal > 0 ? weightedSum / weightTotal : 0;
      }

      // ─── PERFECT DAY / RECOVERY ───
      function isPerfectDay(dateStr) {
        const score = getCalculatedScoreForDate(dateStr);
        if (score > 5.0) return true;
        const dayLog = logs[dateStr]; if (!dayLog || !dayLog.missions) return false;
        return Object.values(dayLog.missions).filter((s) => s === "completed" || s === "partial").length === MISSIONS.length;
      }
      function getPerfectDayStreak() {
        const today = getPSTDate(); let streak = 0; let checkDate = new Date(today);
        while (true) { const ds = formatPSTDate(checkDate); if (isPerfectDay(ds)) { streak++; checkDate.setDate(checkDate.getDate()-1); } else break; }
        return streak;
      }
      function getRecoveryRate() {
        const loggedDates = Object.keys(logs).sort(); if (loggedDates.length < 2) return 0;
        let recoveryTimes = [], lastBreakDate = null;
        for (let i = 0; i < loggedDates.length; i++) {
          const dateStr = loggedDates[i], isPerfect = isPerfectDay(dateStr);
          if (!isPerfect) { lastBreakDate = new Date(dateStr); }
          else if (lastBreakDate) { recoveryTimes.push(Math.ceil((new Date(dateStr) - lastBreakDate) / 86400000)); lastBreakDate = null; }
        }
        if (recoveryTimes.length === 0) return 0;
        return Math.round((recoveryTimes.reduce((a,b) => a+b, 0) / recoveryTimes.length) * 10) / 10;
      }

      // ─── MODAL ───
      function getPeriodDetailStats(startD, daysCount) {
        let stats = { score: 0, maxScore: daysCount * MISSIONS.length, missions: {}, focus: 0, early: 0, plan: 0 };
        MISSIONS.forEach((m) => (stats.missions[m.id] = 0));
        for (let i = 0; i < daysCount; i++) {
          let d = new Date(startD); d.setDate(d.getDate() + i);
          let ds = formatPSTDate(d), log = logs[ds] || {}, ml = log.missions || {};
          stats.score += getCalculatedScoreForDate(ds);
          stats.focus += parseFloat(log.deepFocus || 0);
          if (log.earlyWake) stats.early++; if (log.planning) stats.plan++;
          MISSIONS.forEach((m) => { if (ml[m.id] === "completed") stats.missions[m.id] += 1; else if (ml[m.id] === "partial") stats.missions[m.id] += 0.5; });
        }
        return stats;
      }

      function openDetailModal(type, index) {
        const modal = document.getElementById("stats-modal"), card = document.getElementById("modal-card-element");
        // Use calendar month derived from currentCycleStart
        const cycleYear = currentCycleStart.getFullYear();
        const cycleMonth = currentCycleStart.getMonth() + 1; // 1-based
        const daysInMonth = new Date(cycleYear, cycleMonth, 0).getDate();
        const segStarts = [1, 11, 21];
        const segEnds = [10, 20, daysInMonth];
        let startD = new Date(cycleYear, cycleMonth - 1, 1), days = daysInMonth, title = "Cycle Insights", accent = OVERALL_THEME.color;
        if (type === "seg") {
          startD = new Date(cycleYear, cycleMonth - 1, segStarts[index]);
          days = segEnds[index] - segStarts[index] + 1;
          title = `${SEG_THEMES[index].name} Insights`; accent = SEG_THEMES[index].color;
        }
        card.style.setProperty("--modal-accent", accent);
        let endD = new Date(startD); endD.setDate(endD.getDate() + days - 1);
        document.getElementById("modal-title-text").innerText = title;
        document.getElementById("modal-sub-text").innerText = formatDateRange(startD, endD);
        let stats = getPeriodDetailStats(startD, days);
        currentModalExportData = { title, dateRange: formatDateRange(startD, endD), stats, days };

        let html = `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-inset);padding:14px 18px;border-radius:var(--r-md);border:1px solid var(--border-1);">
          <span style="font-weight:700;color:var(--text-2);text-transform:uppercase;font-size:12px;">Total Score</span>
          <span style="font-size:1.9rem;font-weight:800;color:${accent};line-height:1;">${stats.score.toFixed(1)}<span style="font-size:1rem;color:var(--text-3);font-weight:600"> / ${stats.maxScore}</span></span>
        </div>`;

        MISSIONS.forEach((m) => {
          let val = stats.missions[m.id], pct = (val / days) * 100;
          html += `<div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;color:var(--text-2);margin-bottom:7px;">
              <span><i class="fa-solid ${m.icon}" style="color:${m.color};margin-right:8px;width:14px;text-align:center;"></i>${m.name}</span>
              <span>${val} <span style="color:var(--text-3);font-weight:500">/ ${days}</span></span>
            </div>
            <div class="pred-bar-bg"><div class="pred-bar-fill" style="width:${pct}%;background:${m.color};"></div></div>
          </div>`;
        });

        html += `<div style="display:flex;gap:10px;margin-top:6px;padding-top:18px;border-top:1px solid var(--border-1);">
          <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);">
            <div style="font-size:1.6rem;font-weight:800;color:var(--cyan);">${stats.focus.toFixed(1)}h</div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Deep Focus</div>
          </div>
          <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);">
            <div style="font-size:1.6rem;font-weight:800;color:var(--green);">${stats.early}</div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Early Wakes</div>
          </div>
          <div style="flex:1;text-align:center;background:var(--bg-inset);padding:14px 8px;border-radius:var(--r-md);border:1px solid var(--border-1);">
            <div style="font-size:1.6rem;font-weight:800;color:var(--violet);">${stats.plan}</div>
            <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-top:4px;text-transform:uppercase;">Days Planned</div>
          </div>
        </div>`;

        document.getElementById("modal-body-content").innerHTML = html;
        modal.classList.add("active");
      }

      function closeDetailModal() { document.getElementById("stats-modal").classList.remove("active"); currentModalExportData = null; }
      function exportModalCSV() {
        if (!currentModalExportData) return;
        const { title, dateRange, stats, days } = currentModalExportData;
        let csv = `Report,"${title}"\nPeriod,"${dateRange}"\n\nMetric,Value\nPerformance Score,${stats.score} / ${stats.maxScore}\nTotal Deep Focus (hrs),${stats.focus.toFixed(1)}\nTotal Early Wakes,${stats.early}\nTotal Days Planned,${stats.plan}\n\nMission Name,Completions,Possible Days\n`;
        MISSIONS.forEach((m) => { csv += `"${m.name}",${stats.missions[m.id]},${days}\n`; });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a");
        a.href = url; a.download = `vanguard_${title.replace(/\s+/g,"_").toLowerCase()}_stats.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      document.getElementById("stats-modal").addEventListener("click", closeDetailModal);

      // ─── WEEK NUMBER BAR (shows 3 full Sun–Sat weeks with nav) ───
      let weekBarOffset = 0; // offset in weeks from the first upcoming week

      function updateWeekNumberBar() {
        const bar = document.getElementById("week-number-bar");
        const today = getPSTDate();
        const fmt = (d) => String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0") + "/" + String(d.getFullYear()).slice(-2);
        // Base: start of next week (next Sunday)
        const daysUntilNextSunday = today.getDay() === 0 ? 7 : 7 - today.getDay();
        const base = new Date(today);
        base.setDate(today.getDate() + daysUntilNextSunday);
        base.setHours(0, 0, 0, 0);
        // Apply offset
        base.setDate(base.getDate() + weekBarOffset * 7);
        let html = "";
        for (let i = 0; i < 3; i++) {
          const weekStart = new Date(base);
          weekStart.setDate(base.getDate() + i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const wn = isoWeekNum(weekStart);
          if (i > 0) html += '<div class="week-number-divider"></div>';
          html += `<span class="week-number-badge">Week ${wn}</span><span class="week-number-range">${fmt(weekStart)} - ${fmt(weekEnd)}</span>`;
        }
        bar.innerHTML = html;
        document.getElementById("week-bar-prev").disabled = weekBarOffset === 0;
      }

      document.getElementById("week-bar-prev").addEventListener("click", () => {
        if (weekBarOffset > 0) { weekBarOffset -= 3; if (weekBarOffset < 0) weekBarOffset = 0; updateWeekNumberBar(); }
      });
      document.getElementById("week-bar-next").addEventListener("click", () => {
        weekBarOffset += 3; updateWeekNumberBar();
      });

      // ─── RENDER GRID ───
      function renderGrid() {
        const dates = [], start = new Date(currentCycleStart);
        const _cycleDays = getCycleDays(currentCycleStart);
        for (let i = 0; i < _cycleDays; i++) { const d = new Date(start); d.setDate(d.getDate() + i); dates.push(d); }
        const todayStr = formatPSTDate(getPSTDate());
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        updateWeekNumberBar();

        const s = dates[0], e = dates[dates.length-1];
        const startMonth = months[s.getMonth()], endMonth = months[e.getMonth()];
        const cycleNum = getCycleNumber(currentCycleStart);
        const rangeStr = startMonth === endMonth
          ? `<span style="color:var(--green)">${startMonth} ${s.getDate()}</span> – <span style="color:var(--rose)">${e.getDate()}</span>`
          : `<span style="color:var(--green)">${startMonth} ${s.getDate()}</span> – <span style="color:var(--rose)">${endMonth} ${e.getDate()}</span>`;
        document.getElementById("cycle-label").innerHTML = `<span class="cycle-number-badge">Cycle ${cycleNum}</span> <span style="color:var(--text-4);font-weight:500;font-size:0.95rem;">·</span> ${rangeStr}`;
        document.getElementById("cycle-range").innerText = `${formatHumanReadable(s)} — ${formatHumanReadable(e)}`;

        let html = `<thead><tr><th class="th-mission">Objectives</th>`;
        dates.forEach((d, index) => {
          const ds = formatPSTDate(d), cls = [];
          if (ds === todayStr) cls.push("col-today");
          if (d.getDay() === 0) cls.push("col-sunday");
          html += `<th class="${cls.join(" ")}"><div class="date-day-name">${d.toLocaleDateString("en-US",{weekday:"short"})}</div><div class="date-day-num">${d.getDate()}</div></th>`;
        });
        html += `</tr></thead><tbody><tr class="intensity-row"><td class="th-mission"><span style="font-weight:700;color:var(--text-3);text-transform:uppercase;font-size:11px;">Effort Level</span></td>`;
        dates.forEach((d) => {
          const ds = formatPSTDate(d), cls = [];
          if (ds === todayStr) cls.push("col-today"); if (d.getDay() === 0) cls.push("col-sunday");
          const score = getCalculatedScoreForDate(ds), c = getIntensityColor(score);
          html += `<td class="${cls.join(" ")}"><div class="intensity-score-text" style="color:${c};">${score > 0 ? score.toFixed(1) : ""}</div><div class="intensity-bar" style="background:${score > 0 ? c : "transparent"};"></div></td>`;
        });
        html += `</tr>`;

        MISSIONS.forEach((m) => {
          html += `<tr class="mission-row" style="--m-color:${m.color};--m-rgb:${m.rgb}"><td class="th-mission"><div class="mission-info"><div class="mission-icon"><i class="fa-solid ${m.icon}"></i></div><div class="mission-text"><span class="mission-name">${m.name}</span><span class="mission-spec">${m.spec}</span></div></div></td>`;
          dates.forEach((d) => {
            const ds = formatPSTDate(d), cls = ["cell-action"];
            if (ds === todayStr) cls.push("col-today"); if (d.getDay() === 0) cls.push("col-sunday");
            html += `<td class="${cls.join(" ")}" data-date="${ds}" data-mid="${m.id}" onclick="toggleMission(this)"></td>`;
          });
          html += `</tr>`;
        });

        table.innerHTML = html + "</tbody>";
        updateVisuals(); updateEfficiencyWidget(); updateStrategicInsights();
        // Update calendar for current date
        updateCalendarWidget(inpDate.value || formatPSTDate(getPSTDate()));
        updateCycleGoalInput();
        checkCycleSummary();
      }

      // ─── CYCLE SUMMARY CARD ───
      function getPrevCycleStart(cs) {
        const d = cs.getDate();
        if (d === 1)  return new Date(cs.getFullYear(), cs.getMonth() - 1, 21);
        if (d === 11) return new Date(cs.getFullYear(), cs.getMonth(), 1);
        return new Date(cs.getFullYear(), cs.getMonth(), 11);
      }

      function checkCycleSummary() {
        const card = document.getElementById("cycle-summary-card");
        const body = document.getElementById("csc-body");
        if (!card || !body) return;

        const today   = getPSTDate();
        const csEnd   = getCycleEnd(currentCycleStart);
        const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const endMs   = Date.UTC(csEnd.getFullYear(), csEnd.getMonth(), csEnd.getDate());

        // Only show for fully completed cycles
        if (todayMs <= endMs) { card.style.display = "none"; return; }

        const dismissKey = `csc-dismissed-${formatPSTDate(currentCycleStart)}`;
        if (localStorage.getItem(dismissKey) === "1") { card.style.display = "none"; return; }

        // Build date list for this cycle
        const nDays = getCycleDays(currentCycleStart);
        const dates = [];
        for (let i = 0; i < nDays; i++) {
          const d = new Date(currentCycleStart.getFullYear(), currentCycleStart.getMonth(), currentCycleStart.getDate() + i);
          dates.push(formatPSTDate(d));
        }

        // Current cycle stats
        let cycleScore = 0, bestScore = -1, bestDate = null, focusTotal = 0;
        const mCounts = {};
        MISSIONS.forEach(m => mCounts[m.id] = 0);
        dates.forEach(ds => {
          const s = getCalculatedScoreForDate(ds);
          cycleScore += s;
          if (s > bestScore) { bestScore = s; bestDate = ds; }
          focusTotal += parseFloat(logs[ds]?.deepFocus || 0);
          Object.entries(logs[ds]?.missions || {}).forEach(([mid, st]) => {
            mCounts[mid] = (mCounts[mid] || 0) + (st === "completed" ? 1 : st === "partial" ? 0.5 : 0);
          });
        });

        // Previous cycle stats
        const prevCs   = getPrevCycleStart(currentCycleStart);
        const prevDays = getCycleDays(prevCs);
        let prevScore = 0;
        const prevCounts = {};
        MISSIONS.forEach(m => prevCounts[m.id] = 0);
        for (let i = 0; i < prevDays; i++) {
          const d = new Date(prevCs.getFullYear(), prevCs.getMonth(), prevCs.getDate() + i);
          const ds = formatPSTDate(d);
          prevScore += getCalculatedScoreForDate(ds);
          Object.entries(logs[ds]?.missions || {}).forEach(([mid, st]) => {
            prevCounts[mid] = (prevCounts[mid] || 0) + (st === "completed" ? 1 : st === "partial" ? 0.5 : 0);
          });
        }

        // Mission with biggest improvement / biggest drop
        let bestM = null, bestMDelta = -Infinity, worstM = null, worstMDelta = Infinity;
        MISSIONS.forEach(m => {
          const delta = (mCounts[m.id] || 0) - (prevCounts[m.id] || 0);
          if (delta > bestMDelta)  { bestMDelta  = delta;  bestM  = m; }
          if (delta < worstMDelta) { worstMDelta = delta;  worstM = m; }
        });

        const diff    = cycleScore - prevScore;
        const diffStr = diff === 0 ? "=" : (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1));
        const diffCls = diff > 0 ? "csc-up" : diff < 0 ? "csc-down" : "csc-same";
        const bestDateLabel = bestDate
          ? new Date(bestDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—";

        const goalText = cycleGoals[formatPSTDate(currentCycleStart)] || "";
        body.innerHTML = `
          <div class="csc-goal-row">
            <div class="csc-goal-label"><i class="fa-solid fa-bullseye"></i> Cycle Goal</div>
            ${goalText
              ? `<div class="csc-goal-text">"${goalText}"</div>`
              : `<div class="csc-goal-empty">No goal was set for this cycle</div>`}
          </div>
          <div class="csc-stat">
            <div class="csc-stat-label">Cycle Score</div>
            <div class="csc-stat-value">${cycleScore.toFixed(1)}</div>
            <div class="csc-stat-sub">of ${nDays * 7} max</div>
          </div>
          <div class="csc-stat">
            <div class="csc-stat-label">vs Last Cycle</div>
            <div class="csc-stat-value ${diffCls}">${diffStr}</div>
            <div class="csc-stat-sub">prev ${prevScore.toFixed(1)}</div>
          </div>
          <div class="csc-stat">
            <div class="csc-stat-label">Best Day</div>
            <div class="csc-stat-value" style="font-size:13px">${bestDateLabel}</div>
            <div class="csc-stat-sub">${bestScore > 0 ? bestScore.toFixed(1) + " pts" : "—"}</div>
          </div>
          <div class="csc-stat">
            <div class="csc-stat-label">Focus Hours</div>
            <div class="csc-stat-value">${focusTotal.toFixed(1)}<span style="font-size:10px;font-weight:500"> h</span></div>
            <div class="csc-stat-sub">Deep Caliber</div>
          </div>
          ${bestM && bestMDelta > 0 ? `
          <div class="csc-stat">
            <div class="csc-stat-label">Improved</div>
            <div class="csc-stat-value csc-up" style="font-size:11px;line-height:1.3">${bestM.name.split(" ")[0]}</div>
            <div class="csc-stat-sub"><span class="csc-up">+${bestMDelta.toFixed(1)}</span> vs prev</div>
          </div>` : ""}
          ${worstM && worstMDelta < 0 ? `
          <div class="csc-stat">
            <div class="csc-stat-label">Needs Work</div>
            <div class="csc-stat-value csc-down" style="font-size:11px;line-height:1.3">${worstM.name.split(" ")[0]}</div>
            <div class="csc-stat-sub"><span class="csc-down">${worstMDelta.toFixed(1)}</span> vs prev</div>
          </div>` : ""}
        `;

        card.style.display = "";
        document.getElementById("csc-dismiss").onclick = () => {
          localStorage.setItem(dismissKey, "1");
          card.style.display = "none";
        };
      }

      // ─── STRATEGIC INSIGHTS ───
      function updateStrategicInsights() {
        const loggedDates = Object.keys(logs).sort(); const container = document.getElementById("strategic-insights-grid");
        if (!container) return;
        if (loggedDates.length === 0) { container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-4);font-weight:600;">Track a few days to unlock insights.</div>'; return; }
        const n = loggedDates.length;

        const allScores = loggedDates.map((d) => getCalculatedScoreForDate(d));
        const avgScore = (allScores.reduce((a,b) => a+b, 0) / n).toFixed(2);
        const maxScore = Math.max(...allScores);
        const totalPts = allScores.reduce((a,b) => a+b, 0).toFixed(1);

        const perfectStreak = getPerfectDayStreak();
        const perfectDays = loggedDates.filter((d) => isPerfectDay(d)).length;
        const recoveryRate = getRecoveryRate();

        let earlyScores = [], noEarlyScores = [];
        loggedDates.forEach((d) => { const s = getCalculatedScoreForDate(d); if (logs[d]?.earlyWake) earlyScores.push(s); else noEarlyScores.push(s); });
        const avgEarly = earlyScores.length > 0 ? earlyScores.reduce((a,b) => a+b, 0) / earlyScores.length : 0;
        const avgNoEarly = noEarlyScores.length > 0 ? noEarlyScores.reduce((a,b) => a+b, 0) / noEarlyScores.length : 0;
        const earlyDiff = (avgEarly - avgNoEarly).toFixed(2);

        let planScores = [], noPlanScores = [];
        loggedDates.forEach((d) => { const s = getCalculatedScoreForDate(d); if (logs[d]?.planning) planScores.push(s); else noPlanScores.push(s); });
        const avgPlan = planScores.length > 0 ? planScores.reduce((a,b) => a+b, 0) / planScores.length : 0;
        const avgNoPlan = noPlanScores.length > 0 ? noPlanScores.reduce((a,b) => a+b, 0) / noPlanScores.length : 0;
        const planDiff = (avgPlan - avgNoPlan).toFixed(2);

        let onTrackScores = [], offTrackScores = [];
        loggedDates.forEach((d) => { const s = getCalculatedScoreForDate(d); const ot = logs[d]?.onTrack; if (ot === "full" || ot === "partial") onTrackScores.push(s); else offTrackScores.push(s); });
        const avgOnTrack = onTrackScores.length > 0 ? onTrackScores.reduce((a,b) => a+b, 0) / onTrackScores.length : 0;
        const avgOffTrack = offTrackScores.length > 0 ? offTrackScores.reduce((a,b) => a+b, 0) / offTrackScores.length : 0;
        const onTrackDiff = (avgOnTrack - avgOffTrack).toFixed(2);

        const totalFocus = loggedDates.reduce((s,d) => s + parseFloat(logs[d]?.deepFocus || 0), 0);
        const avgFocus = (n > 0 ? totalFocus / n : 0).toFixed(1);

        let correctPredictions = 0, totalPredictions = 0;
        loggedDates.forEach((d) => {
          const preds = logs[d]?.predictions; if (!preds) return;
          preds.forEach((p) => { totalPredictions++; if ((logs[d]?.missions?.[p.id] === "completed") === p.prob >= 50) correctPredictions++; });
        });
        const accuracyPct = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;

        const missionStats = MISSIONS.map((m) => {
          let comp = 0, part = 0, streak = 0, curStreak = 0;
          loggedDates.forEach((d) => { const st = logs[d]?.missions?.[m.id]; if (st === "completed") comp++; else if (st === "partial") part++; });
          const sorted = loggedDates.filter((d) => logs[d]?.missions?.[m.id] === "completed");
          for (let i = 0; i < sorted.length; i++) {
            if (i === 0) { curStreak = 1; streak = 1; continue; }
            if (Math.round((new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000) === 1) { curStreak++; streak = Math.max(streak, curStreak); } else curStreak = 1;
          }
          return { ...m, comp, part, streak, compPct: n > 0 ? Math.round((comp / n) * 100) : 0 };
        }).sort((a,b) => b.compPct - a.compPct);

        const dowSums = {0:0,1:0,2:0,3:0,4:0,5:0,6:0}, dowCounts = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
        loggedDates.forEach((d) => { const [y,mo,dy] = d.split("-").map(Number); const dow = new Date(y,mo-1,dy).getDay(); dowSums[dow] += getCalculatedScoreForDate(d); dowCounts[dow]++; });
        const dowAvgs = Array.from({length:7},(_,i) => dowCounts[i] > 0 ? (dowSums[i]/dowCounts[i]).toFixed(1) : "—");
        const dowMax = Math.max(...Array.from({length:7},(_,i) => dowCounts[i] > 0 ? dowSums[i]/dowCounts[i] : 0));
        const dowNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const dowColors = ["var(--rose)","var(--cyan)","var(--green)","var(--accent)","var(--gold)","var(--violet)","var(--teal)"];

        const momentum = (getMomentumCoefficient() * 100).toFixed(0);
        const activeDays = allScores.filter((s) => s > 0).length;
        const consistencyPct = n > 0 ? Math.round((activeDays / n) * 100) : 0;

        function siMini(color, label, val, sub) {
          return `<div class="si-mini-card">
            <div class="si-mini-label" style="color:${color};"><i class="fa-solid fa-chart-pie"></i> ${label}</div>
            <div class="si-mini-val" style="color:var(--text-1)">${val}</div>
            <div class="si-mini-sub">${sub}</div>
          </div>`;
        }

        let html = "";
        html += `<div class="si-section-title">Core Performance</div><div class="si-grid-4">`;
        html += siMini("var(--accent)", "Avg Daily Score", avgScore + " pts", `Over ${n} logged days`);
        html += siMini("var(--green)", "Total Points", totalPts + " pts", `${n} days tracked`);
        html += siMini("var(--cyan)", "Perfect Day Streak", perfectStreak + " days", `${perfectDays} perfect days all-time`);
        html += siMini("var(--teal)", "Recovery Rate", recoveryRate + " days", "Avg days back to perfect");
        html += `</div>`;

        html += `<div class="si-section-title">Habit Correlations</div><div class="si-grid-4">`;
        html += siMini("var(--gold)", "Early Wake Effect", (parseFloat(earlyDiff) > 0 ? "+" : "") + earlyDiff + " pts", `Early avg: ${avgEarly.toFixed(1)}`);
        html += siMini("var(--violet)", "Planning Impact", (parseFloat(planDiff) > 0 ? "+" : "") + planDiff + " pts", `Planned avg: ${avgPlan.toFixed(1)}`);
        html += siMini("var(--amber)", "On-Track Impact", (parseFloat(onTrackDiff) > 0 ? "+" : "") + onTrackDiff + " pts", `On-track avg: ${avgOnTrack.toFixed(1)}`);
        html += siMini("var(--cyan)", "Deep Focus Total", totalFocus.toFixed(1) + " h", `Avg ${avgFocus}h/day`);
        html += `</div>`;

        html += `<div class="si-section-title">Momentum & Consistency</div><div class="si-grid-4">`;
        html += siMini("var(--green)", "Momentum Index", momentum + "%", "Weighted recent performance");
        html += siMini("var(--cyan)", "Consistency", consistencyPct + "%", `${activeDays} active days`);
        html += siMini("var(--gold)", "Best Single Day", maxScore + " pts", "All-time highest");
        html += siMini("var(--rose)", "AI Accuracy", accuracyPct + "%", `${correctPredictions} correct predictions`);
        html += `</div>`;

        html += `<div class="si-section-title">Mission Completion Rates</div><div class="si-grid-7">`;
        missionStats.forEach((m) => {
          html += `<div class="si-mission-card" style="--m-color:${m.color};--m-rgb:${m.rgb}">
            <div class="si-mission-top">
              <div class="si-mission-icon"><i class="fa-solid ${m.icon}"></i></div>
              <div class="si-mission-pct">${m.compPct}%</div>
            </div>
            <div class="si-mission-name">${m.name}</div>
            <div class="pred-bar-bg" style="height:4px;"><div class="pred-bar-fill" style="width:${m.compPct}%;"></div></div>
            <div style="font-size:12px;font-weight:600;color:var(--text-3);display:flex;justify-content:space-between;">
              <span>${m.comp} done</span><span style="color:var(--gold)">🔥${m.streak}</span>
            </div>
          </div>`;
        });
        html += `</div>`;

        html += `<div class="si-section-title">Day-of-Week Averages</div>`;
        html += `<div class="pred-card" style="--m-color:var(--accent);--m-rgb:79, 70, 229;"><div class="dow-grid">`;
        for (let i = 0; i < 7; i++) {
          const val = dowCounts[i] > 0 ? dowSums[i] / dowCounts[i] : 0;
          const heightPct = dowMax > 0 ? Math.round((val / dowMax) * 100) : 0;
          html += `<div class="dow-cell">
            <div class="dow-label">${dowNames[i]}</div>
            <div class="dow-bar-wrap"><div class="dow-bar-fill" style="height:${heightPct}%;background:${dowColors[i]};"></div></div>
            <div class="dow-val">${dowAvgs[i]}</div>
          </div>`;
        }
        html += `</div></div>`;

        container.innerHTML = html;
      }

      // ─── STREAK ───
      function getStreakLength(mid, checkDate) {
        if (logs[formatPSTDate(checkDate)]?.missions?.[mid] !== "completed") return 0;
        let len = 1, back = new Date(checkDate), fwd = new Date(checkDate);
        while (logs[formatPSTDate(new Date(back.setDate(back.getDate()-1)))]?.missions?.[mid] === "completed") len++;
        while (logs[formatPSTDate(new Date(fwd.setDate(fwd.getDate()+1)))]?.missions?.[mid] === "completed") len++;
        return len;
      }

      function toggleMission(el) {
        const date = el.dataset.date, mid = el.dataset.mid;
        if (!logs[date]) logs[date] = { missions: {} }; if (!logs[date].missions) logs[date].missions = {};
        const cur = logs[date].missions[mid];
        logs[date].missions[mid] = !cur ? "partial" : cur === "partial" ? "completed" : null;
        if (!logs[date].missions[mid]) delete logs[date].missions[mid];
        saveToLocal(); renderGrid();
        if (inpDate.value !== date) inpDate.value = date;
        updateDailyWidgets(date); updateInsights(); calculateAI_Predictions();
      }

      function updateVisuals() {
        document.querySelectorAll(".cell-action").forEach((el) => {
          const ds = el.dataset.date, mid = el.dataset.mid, st = logs[ds]?.missions?.[mid];
          const [y,m,d] = ds.split("-").map(Number);
          el.classList.toggle("streak-line", getStreakLength(mid, new Date(y,m-1,d)) > 6);
          let html = `<div class="status-mark st-none"></div>`;
          if (st === "partial") html = `<div class="status-mark st-part"></div>`;
          if (st === "completed") html = `<div class="status-mark st-done"><i class="fa-solid fa-check"></i></div>`;
          el.innerHTML = html;
        });
      }

      // ─── DAILY WIDGETS ───
      function updateDailyWidgets(dateStr) {
        const score = getCalculatedScoreForDate(dateStr);
        displayPts.innerText = score.toFixed(1);
        displayPts.style.color = score === 0 ? "var(--text-3)" : getIntensityColor(score);

        if (inpDate.value === dateStr) {
          const noteVal = logs[dateStr]?.note || "";
          inpNote.value = noteVal;
          noteCharCount.textContent = `${noteVal.length} / 200`;
          noteCharCount.classList.toggle("warn", noteVal.length > 170);
          const energy = logs[dateStr]?.energy || null;
          ["low","medium","high"].forEach(lvl => {
            document.getElementById(`btn-energy-${lvl}`).className =
              `energy-btn${energy === lvl ? ` active-${lvl}` : ""}`;
          });
          inpDeepFocus.value = logs[dateStr]?.deepFocus || "";
          const isEarly = !!logs[dateStr]?.earlyWake;
          btnEarlyWake.classList.toggle("active", isEarly);
          btnEarlyWake.innerHTML = isEarly ? '<i class="fa-solid fa-check"></i> Early Wake Up' : '<i class="fa-regular fa-clock"></i> Early Wake Up';
          const isPlan = !!logs[dateStr]?.planning;
          btnPlanning.classList.toggle("active-planning", isPlan);
          btnPlanning.innerHTML = isPlan ? '<i class="fa-solid fa-check"></i> Planned' : '<i class="fa-solid fa-calendar-plus"></i> Planning';
          const ot = logs[dateStr]?.onTrack;
          btnOnTrack.classList.remove("active-ontrack-partial","active-ontrack-full");
          if (ot === "partial") { btnOnTrack.classList.add("active-ontrack-partial"); btnOnTrack.innerHTML = '<i class="fa-solid fa-minus"></i> &lt; 50% On Track'; }
          else if (ot === "full") { btnOnTrack.classList.add("active-ontrack-full"); btnOnTrack.innerHTML = '<i class="fa-solid fa-check-double"></i> &gt; 50% On Track'; }
          else { btnOnTrack.innerHTML = '<i class="fa-solid fa-route"></i> On Track?'; }
        }
        updateMonthProgress(dateStr);
        updateWeekWidget(dateStr);
        updateCalendarWidget(dateStr);
        updateMissionRing(dateStr);
      }

      // ─── MISSION RING ───
      function updateMissionRing(dateStr) {
        const svg    = document.getElementById("ring-svg");
        const barsEl = document.getElementById("ring-bars");
        if (!svg || !barsEl) return;

        const missions = (logs[dateStr] || {}).missions || {};

        // Clear previous orbital elements
        svg.querySelectorAll(".orbital-track, .orbital-arc").forEach(s => s.remove());

        // 7 concentric rings, outermost = m1, innermost = m7
        const CX = 60, CY = 60, SW = 4;
        const RADII = [55, 48, 41, 34, 27, 20, 13];

        let totalScore = 0;

        MISSIONS.forEach((m, i) => {
          const r = RADII[i];
          const C = 2 * Math.PI * r;
          const status = missions[m.id] || null;
          const isCompleted = status === "completed";
          const isPartial   = status === "partial";
          if (isCompleted) totalScore += 1;
          else if (isPartial) totalScore += 0.5;

          // Ghost track (always visible)
          const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          track.setAttribute("class", "orbital-track");
          track.setAttribute("cx", CX); track.setAttribute("cy", CY); track.setAttribute("r", r);
          track.setAttribute("stroke", m.color); track.setAttribute("stroke-width", SW);
          track.setAttribute("fill", "none"); track.setAttribute("opacity", "0.1");
          svg.appendChild(track);

          if (!isCompleted && !isPartial) return;

          const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          arc.setAttribute("class", `orbital-arc ${isCompleted ? "completed" : "partial"}`);
          arc.setAttribute("cx", CX); arc.setAttribute("cy", CY); arc.setAttribute("r", r);
          arc.setAttribute("stroke", m.color); arc.setAttribute("stroke-width", SW);
          arc.setAttribute("fill", "none");

          if (isCompleted) {
            // Full glowing ring
            arc.setAttribute("stroke-dasharray", `${C} 0`);
            arc.setAttribute("stroke-dashoffset", "0");
            arc.style.filter = `drop-shadow(0 0 5px ${m.color})`;
          } else {
            // Half arc, centered at 12 o'clock (top)
            const half = C / 2;
            arc.setAttribute("stroke-dasharray", `${half} ${half}`);
            arc.setAttribute("stroke-dashoffset", `${-half / 2}`);
          }
          svg.appendChild(arc);
        });

        // Progress bar legend
        barsEl.innerHTML = "";
        MISSIONS.forEach(m => {
          const status  = missions[m.id] || null;
          const fillPct = status === "completed" ? 100 : status === "partial" ? 50 : 0;
          const glow    = fillPct === 100 ? `box-shadow:0 0 5px ${m.color}55` : "";
          const sym     = fillPct === 100 ? "✓" : fillPct === 50 ? "½" : "–";
          const symColor = fillPct > 0 ? m.color : "var(--text-4)";
          const row = document.createElement("div");
          row.className = "ring-bar-row";
          row.title = `${m.name}: ${status || "—"}`;
          row.innerHTML = `
            <i class="fa-solid ${m.icon} ring-bar-icon" style="color:${m.color}${fillPct === 0 ? ";opacity:0.3" : ""}"></i>
            <div class="ring-bar-track">
              <div class="ring-bar-fill" style="width:${fillPct}%;background:${m.color};${glow}"></div>
            </div>
            <span class="ring-bar-status" style="color:${symColor}">${sym}</span>
          `;
          barsEl.appendChild(row);
        });
      }

      function calcYearProgress(nowDate) {
        const start = new Date(nowDate.getFullYear(), 0, 0); const doy = Math.floor((nowDate - start) / 86400000);
        const yr = nowDate.getFullYear(); const total = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0 ? 366 : 365;
        const pct = ((doy / total) * 100).toFixed(1);
        dispDay.innerText = doy; dispPct.innerText = pct;
      }

      function calcCycleProgress(nowDate) {
        const cs = getCycleStart(nowDate);
        const cycleNum = getCycleNumber(cs);
        const totalDays = getCycleDays(cs);

        const utcNow = Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
        const utcCS  = Date.UTC(cs.getFullYear(), cs.getMonth(), cs.getDate());
        let days = Math.max(1, Math.min(Math.floor((utcNow - utcCS) / 86400000) + 1, totalDays));
        const pct = ((days / totalDays) * 100).toFixed(1);

        const ce = getCycleEnd(cs);
        const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const sm = mo[cs.getMonth()], em = mo[ce.getMonth()];
        const rangeStr = sm === em
          ? `${sm} ${cs.getDate()}–${ce.getDate()}`
          : `${sm} ${cs.getDate()} – ${em} ${ce.getDate()}`;


      }


      function updateInsights() {
        const ds = {0:0,1:0,2:0,3:0,4:0,5:0,6:0}, dc = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
        for (const dateStr in logs) {
          const score = getCalculatedScoreForDate(dateStr);
          if (score > 0) { const [y,m,d] = dateStr.split("-").map(Number); const day = new Date(y,m-1,d).getDay(); ds[day] += score; dc[day]++; }
        }
        let bestDay = -1, maxAvg = -1;
        for (let i = 0; i < 7; i++) if (dc[i] > 0 && ds[i]/dc[i] > maxAvg) { maxAvg = ds[i]/dc[i]; bestDay = i; }
        document.getElementById("disp-best-day").innerText = bestDay > -1 ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][bestDay] : "—";

        const ls = {}, tc = {}; MISSIONS.forEach((m) => { ls[m.id] = 0; tc[m.id] = 0; });
        for (const m of MISSIONS) {
          const dates = Object.keys(logs).filter((d) => logs[d]?.missions?.[m.id] === "completed").sort();
          tc[m.id] = dates.length; let maxS = 0, curS = 0;
          for (let i = 0; i < dates.length; i++) {
            if (i === 0) { curS = 1; maxS = 1; continue; }
            if (Math.round((new Date(dates[i]) - new Date(dates[i-1])) / 86400000) === 1) { curS++; maxS = Math.max(maxS, curS); } else curS = 1;
          }
          ls[m.id] = maxS;
        }
        const ss = Object.entries(ls).sort((a,b) => b[1]-a[1]);
        document.getElementById("lbl-best").innerText = ss[0][1] > 0 ? MISSIONS.find((m) => m.id === ss[0][0]).name : "—";
        const sc2 = Object.entries(tc).sort((a,b) => a[1]-b[1]);
        document.getElementById("lbl-worst").innerText = sc2.length > 0 ? MISSIONS.find((m) => m.id === sc2[0][0]).name : "—";
        updateEnergyCorrelation();
      }

      function updateEnergyCorrelation() {
        const groups = { low: [], medium: [], high: [] };
        Object.entries(logs).forEach(([date, log]) => {
          if (!log?.energy || !groups[log.energy]) return;
          groups[log.energy].push(getCalculatedScoreForDate(date));
        });
        const fmt = arr => arr.length
          ? `${(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1)} pts (${arr.length}d)`
          : "—";
        document.getElementById("energy-corr-high").textContent = fmt(groups.high);
        document.getElementById("energy-corr-med").textContent  = fmt(groups.medium);
        document.getElementById("energy-corr-low").textContent  = fmt(groups.low);
      }

      // ─── KEYBOARD SHORTCUTS ───
      let _plusCount = 0, _plusTimer = null;
      const shortcutsModal = document.getElementById("shortcuts-modal");
      const btnShowShortcuts = document.getElementById("btn-show-shortcuts");
      const btnCloseShortcuts = document.getElementById("btn-close-shortcuts");

      function toggleShortcuts() {
        shortcutsModal.classList.toggle("active");
      }
      btnShowShortcuts.addEventListener("click", toggleShortcuts);
      btnCloseShortcuts.addEventListener("click", () => shortcutsModal.classList.remove("active"));
      shortcutsModal.addEventListener("click", () => shortcutsModal.classList.remove("active"));

      document.addEventListener("keydown", (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        // Close modals on Esc
        if (e.key === "Escape") {
          shortcutsModal.classList.remove("active");
          const statsModal = document.getElementById("stats-modal");
          if (statsModal) statsModal.classList.remove("active");
        }

        if (e.key === "?") { toggleShortcuts(); e.preventDefault(); }
        if (e.key === "m" || e.key === "M") window.location.href = "Mastery.html";
        if (e.key === "n" || e.key === "N") window.location.href = "index.html";
        if (e.key === "t" || e.key === "T") jumpToToday();
        if (e.key === "ArrowLeft")  shiftCycle(-1);
        if (e.key === "ArrowRight") shiftCycle(1);

        if (e.key === "d" || e.key === "D") { theme = theme === "dark" ? "light" : "dark"; applyTheme(); }
        if (e.key === "s" || e.key === "S") { sidebarCollapsed = !sidebarCollapsed; localStorage.setItem("matrix-sidebar-collapsed", sidebarCollapsed); applySidebarState(); }
        if (e.key === "h" || e.key === "H") { widgetsHidden = !widgetsHidden; localStorage.setItem("matrix-widgets-hidden", widgetsHidden); applyWidgetsState(); }
        if (e.key === "+") {
          _plusCount = (_plusCount || 0) + 1;
          clearTimeout(_plusTimer);
          _plusTimer = setTimeout(() => {
            const date = inpDate.value;
            if (!logs[date]) logs[date] = { missions: {} };
            if (_plusCount === 1)      logs[date].onTrack = "partial";
            else if (_plusCount === 2) logs[date].onTrack = "full";
            else                       delete logs[date].onTrack;
            _plusCount = 0;
            saveToLocal(); updateDailyWidgets(date);
            const btn = document.getElementById("btn-on-track");
            if (btn) { btn.style.transition = "box-shadow 0.2s"; btn.style.boxShadow = "0 0 0 3px var(--accent)"; setTimeout(() => { btn.style.boxShadow = ""; }, 900); }
          }, 400);
        }
        if (e.key === "p" || e.key === "P") {
          btnPlanning.click();
          btnPlanning.scrollIntoView({ behavior: "smooth", block: "center" });
          btnPlanning.style.transition = "box-shadow 0.2s";
          btnPlanning.style.boxShadow = "0 0 0 3px var(--accent)";
          setTimeout(() => { btnPlanning.style.boxShadow = ""; }, 900);
        }
        if (e.key === "e" || e.key === "E") {
          btnEarlyWake.click();
          btnEarlyWake.scrollIntoView({ behavior: "smooth", block: "center" });
          btnEarlyWake.style.transition = "box-shadow 0.2s";
          btnEarlyWake.style.boxShadow = "0 0 0 3px var(--accent)";
          setTimeout(() => { btnEarlyWake.style.boxShadow = ""; }, 900);
        }
        if (e.key === "o" || e.key === "O") {
          const btn = document.getElementById("btn-on-track");
          if (btn) {
            btn.scrollIntoView({ behavior: "smooth", block: "center" });
            btn.style.transition = "box-shadow 0.2s";
            btn.style.boxShadow = "0 0 0 3px var(--accent)";
            setTimeout(() => { btn.style.boxShadow = ""; }, 1200);
          }
        }
        if (e.key === "a" || e.key === "A") {
          const note = document.getElementById("inp-note");
          if (note) { note.focus(); note.select(); e.preventDefault(); }
        }
        if (e.key === "i" || e.key === "I") {
          const siw = document.getElementById("strategic-insights-widget");
          if (siw) {
            siw.scrollIntoView({ behavior: "smooth", block: "start" });
            siw.style.transition = "box-shadow 0.2s";
            siw.style.boxShadow = "0 0 0 3px var(--accent)";
            setTimeout(() => { siw.style.boxShadow = ""; }, 1200);
          }
        }

        const num = parseInt(e.key);
        if (num >= 1 && num <= MISSIONS.length) {
          const mid = MISSIONS[num - 1].id;
          const date = inpDate.value;
          const cell = table.querySelector(`td[data-date="${date}"][data-mid="${mid}"]`);
          if (cell) toggleMission(cell);
        }
      });

      // ─── EVENTS ───
      inpDate.addEventListener("change", (e) => updateDailyWidgets(e.target.value));
      ["low","medium","high"].forEach(lvl => {
        document.getElementById(`btn-energy-${lvl}`).addEventListener("click", () => {
          const date = inpDate.value;
          if (!logs[date]) logs[date] = { missions: {} };
          logs[date].energy = logs[date].energy === lvl ? undefined : lvl;
          if (!logs[date].energy) delete logs[date].energy;
          saveToLocal();
          updateDailyWidgets(date);
          updateEnergyCorrelation();
        });
      });

      inpNote.addEventListener("input", (e) => {
        const val = e.target.value;
        noteCharCount.textContent = `${val.length} / 200`;
        noteCharCount.classList.toggle("warn", val.length > 170);
        if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} };
        if (val.trim()) logs[inpDate.value].note = val;
        else delete logs[inpDate.value].note;
        saveToLocal();
      });
      inpDeepFocus.addEventListener("input", (e) => { if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }; logs[inpDate.value].deepFocus = e.target.value; saveToLocal(); });
      btnEarlyWake.addEventListener("click", () => {
        if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} };
        logs[inpDate.value].earlyWake = !logs[inpDate.value].earlyWake;
        saveToLocal();
        // ── sync Early Wake Up ↔ Mastery ──
        try {
          const _dk = inpDate.value;
          const _mData = JSON.parse(localStorage.getItem('mastery_data') || '{}');
          _mData[_dk] = _mData[_dk] || [];
          if (logs[_dk].earlyWake) { if (!_mData[_dk].includes('wakeup')) _mData[_dk].push('wakeup'); }
          else { const _i = _mData[_dk].indexOf('wakeup'); if (_i > -1) _mData[_dk].splice(_i, 1); }
          localStorage.setItem('mastery_data', JSON.stringify(_mData));
          saveCloudKey('mastery_data', _mData);
          _nexusSync.broadcast('VANGUARD');
        } catch(e) {}
        updateDailyWidgets(inpDate.value);
      });
      btnPlanning.addEventListener("click", () => { if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }; logs[inpDate.value].planning = !logs[inpDate.value].planning; saveToLocal(); updateDailyWidgets(inpDate.value); });
      btnOnTrack.addEventListener("click", () => {
        if (!logs[inpDate.value]) logs[inpDate.value] = { missions: {} }; let s = logs[inpDate.value].onTrack;
        if (!s) logs[inpDate.value].onTrack = "partial"; else if (s === "partial") logs[inpDate.value].onTrack = "full"; else delete logs[inpDate.value].onTrack;
        saveToLocal(); updateDailyWidgets(inpDate.value);
      });

      document.getElementById("btn-prev").addEventListener("click", () => shiftCycle(-1));
      document.getElementById("btn-next").addEventListener("click", () => shiftCycle(1));
      document.getElementById("btn-today").addEventListener("click", jumpToToday);


      document.getElementById("btn-export-predictions").addEventListener("click", () => {
        if (!latestPredictions?.length) { alert("No prediction data."); return; }
        let csv = "Mission Name,Probability (%)\n";
        latestPredictions.forEach((i) => { csv += `"${i.mission.name}",${Math.round(i.prob)}\n`; });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }), url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `vanguard_predictions.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });


      document.getElementById("inp-cycle-goal").addEventListener("input", (e) => {
        const val = e.target.value;
        const csKey = formatPSTDate(currentCycleStart);
        const cc = document.getElementById("goal-char-count");
        cc.textContent = `${val.length} / 150`;
        cc.classList.toggle("warn", val.length > 120);
        if (val.trim()) cycleGoals[csKey] = val;
        else delete cycleGoals[csKey];
        saveCycleGoals();
      });

      // ─── INIT ───
      (async () => {
        try {
          const _mod = await import('./appwrite-sync.js');
          const _user = await _mod.getCurrentUser();
          if (!_user) { location.href = 'index.html'; return; }
          saveCloudKey = _mod.saveCloudKey;
          await _mod.ensureCloudDefaults();
          await _mod.bootstrapCloudToLocal();
        } catch(e) {}

        loadFromLocal();
        loadCycleGoals();

        // ── sync Early Wake Up from Mastery on load ──
        try {
          const _mData = JSON.parse(localStorage.getItem('mastery_data') || '{}');
          const _todayStr = formatPSTDate(getPSTDate());
          if ((_mData[_todayStr] || []).includes('wakeup') && !logs[_todayStr]?.earlyWake) {
            if (!logs[_todayStr]) logs[_todayStr] = { missions: {} };
            logs[_todayStr].earlyWake = true;
            saveToLocal();
          }
        } catch(e) {}

        const pstNow = getPSTDate();
        currentCycleStart = getCycleStart(pstNow);
        inpDate.value = formatPSTDate(pstNow);
        updateDailyWidgets(inpDate.value);
        calcYearProgress(pstNow);
        calcCycleProgress(pstNow);
        renderGrid();
        updateInsights();
        calculateAI_Predictions();
        _nexusSync.listen(() => { loadFromLocal(); renderGrid(); });
      })();