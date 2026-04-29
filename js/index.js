/* ══════════════════════════════════════════════════════
   NEXUS — Logic Kernel (Preserved functionality, updated colors)
══════════════════════════════════════════════════════ */

      let saveCloudKey = () => Promise.resolve();

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

      function showNexusToast(msg, isError = false) {
        const toast = document.getElementById('nexusToast');
        toast.textContent = msg;
        toast.style.borderColor = isError ? 'rgba(244,63,94,0.5)' : 'rgba(56,189,248,0.4)';
        toast.style.color       = isError ? '#f87171'             : '#38bdf8';
        toast.style.boxShadow   = isError
          ? '0 0 24px rgba(244,63,94,0.18), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 0 24px rgba(56,189,248,0.18), 0 8px 32px rgba(0,0,0,0.4)';
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
      }

      function todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }

      function safeJSON(key, fallback = null) {
        try {
          return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } catch {
          return fallback;
        }
      }

      function updateClock() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diffMs = midnight - now;
        const totalSec = Math.floor(diffMs / 1000);
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = totalSec % 60;
        const pad = n => String(n).padStart(2, "0");
        document.getElementById("clockH").textContent = pad(hh);
        document.getElementById("clockM").textContent = pad(mm);
        document.getElementById("clockS").textContent = pad(ss);
        const elapsedSec = 86400 - totalSec;
        document.getElementById("clockBarFill").style.width =
          ((elapsedSec / 86400) * 100).toFixed(2) + "%";

        // Day Timer (current time)
        const h12 = now.getHours() % 12 || 12;
        const ampm = now.getHours() < 12 ? "AM" : "PM";
        document.getElementById("dtH").textContent = pad(h12);
        document.getElementById("dtM").textContent = pad(now.getMinutes());
        document.getElementById("dtS").textContent = pad(now.getSeconds());
        document.getElementById("dtBarFill").style.width =
          ((elapsedSec / 86400) * 100).toFixed(2) + "%";
        document.getElementById("dtSublabel").textContent = ampm;
      }

      function updateTimeMatrix() {
        const now = new Date();
        const year = now.getFullYear(),
          month = now.getMonth(),
          date = now.getDate();

        // Updated Colors based on theme
        let dColor;
        if (date <= 9) {
          dColor = "#38bdf8";
        } else if (date <= 19) {
          dColor = "#c084fc";
        } // Vanguard Lavender
        else {
          dColor = "#fbbf24";
        } // Mastery Amber

        const tmContainer = document.getElementById("timeMatrixContainer");
        tmContainer.style.setProperty("--date-color", dColor);

        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const monthsFull = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        document.getElementById("todayDateNum").textContent = String(
          date,
        ).padStart(2, "0");
        const dateColor = date <= 10 ? "#39ff14" : date <= 20 ? "#00cfff" : "#ff8c00";
        document.getElementById("todayDateNum").style.setProperty("color", dateColor);
        document.getElementById("todayDayName").textContent =
          days[now.getDay()];
        document.getElementById("todayMonthYear").textContent =
          `${monthsFull[month]} ${year}`;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let bricksHTML = "",
          completedDays = 0;
        for (let i = 1; i <= daysInMonth; i++) {
          let stateClass = "future";
          if (i < date) {
            stateClass = "past";
            completedDays++;
          } else if (i === date) {
            stateClass = "current";
            completedDays++;
          }
          const isSunday = new Date(year, month, i).getDay() === 0;
          const sundayClass = isSunday ? " sunday" : "";
          const brickColor = i <= 10 ? "#39ff14" : i <= 20 ? "#00cfff" : "#ff8c00";
          const brickStyle = stateClass !== "future" ? ` style="background:${brickColor};${stateClass === "current" ? `box-shadow:0 0 12px ${brickColor}66;` : "opacity:0.5;"}"` : "";
          bricksHTML += `<div class="brick ${stateClass}${sundayClass}"${brickStyle} title="${monthsFull[month]} ${i}${isSunday ? " (Sun)" : ""}"></div>`;
        }
        document.getElementById("bricksContainer").innerHTML = bricksHTML;
        const pct = Math.round((completedDays / daysInMonth) * 100);
        document.getElementById("monthProgressPct").textContent =
          `${pct}% COMPLETE`;
      }

      setInterval(() => {
        updateClock();
        if (new Date().getSeconds() === 0) updateTimeMatrix();
      }, 1000);
      updateClock();
      updateTimeMatrix();

      /* ── Ritual / Vanguard Definitions ── */
      const RITUAL_KEYS = [
        "english",
        "greenmoney",
        "fitness",
        "reading",
        "learning",
        "wakeup",
        "sugarfree",
        "badhabit",
      ];
      const RITUAL_NAMES = {
        english: "English",
        greenmoney: "Money",
        fitness: "Fitness",
        reading: "Reading",
        learning: "Learning",
        wakeup: "Wake-up",
        sugarfree: "No Sugar",
        badhabit: "Anti-Habit",
      };
      const VANGUARD_MISSIONS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
      const VANGUARD_NAMES = {
        m1: "Deep Work",
        m2: "Physical",
        m3: "Fuel",
        m4: "Knowledge",
        m5: "Linguistic",
        m6: "Mental",
        m7: "Recovery",
      };

      function readMastery() {
        const today = todayKey();
        const db = safeJSON("mastery_data", {});
        const todayRituals = Array.isArray(db[today]) ? db[today] : [];
        let streak = 0;
        const check = new Date();
        for (let i = 0; i < 365; i++) {
          const k = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, "0")}-${String(check.getDate()).padStart(2, "0")}`;
          if (!db[k] || db[k].length === 0) break;
          streak++;
          check.setDate(check.getDate() - 1);
        }
        return {
          completed: todayRituals.length,
          total: 8,
          pct: Math.round((todayRituals.length / 8) * 100),
          completedIds: todayRituals,
          streak,
          hasData: Object.keys(db).length > 0,
        };
      }

      function readVanguard() {
        const pst = new Date(
          new Date().toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
          }),
        );
        const today = `${pst.getFullYear()}-${String(pst.getMonth() + 1).padStart(2, "0")}-${String(pst.getDate()).padStart(2, "0")}`;
        const db = safeJSON("vanguard-logs", {});
        const dayLog = db[today] || {};
        const missions = dayLog.missions || {};
        const completedCount = VANGUARD_MISSIONS.filter(
          (id) => missions[id] === "completed",
        ).length;
        const partialCount = VANGUARD_MISSIONS.filter(
          (id) => missions[id] === "partial",
        ).length;
        const effectiveCompleted = completedCount + partialCount * 0.5;
        const pct = Math.round(
          (effectiveCompleted / VANGUARD_MISSIONS.length) * 100,
        );
        return {
          completed: completedCount,
          partial: partialCount,
          total: VANGUARD_MISSIONS.length,
          pct,
          earlyWake: !!dayLog.earlyWake,
          planning: !!dayLog.planning,
          onTrack: dayLog.onTrack,
          deepFocus: parseFloat(dayLog.deepFocus || 0),
          missionStatus: missions,
          hasData: Object.keys(db).length > 0,
        };
      }

      /* ══════════════════════════════════════════════════════
   RENDER LOGIC (Updated Colors)
══════════════════════════════════════════════════════ */
      function readinessLabel(pct) {
        if (pct >= 90) return "Peak Performance";
        if (pct >= 70) return "Strong Execution";
        if (pct >= 50) return "On Track";
        if (pct >= 25) return "Partial Deployment";
        if (pct > 0) return "Systems Warming";
        return "Awaiting Input";
      }

      function readinessColor(pct) {
        if (pct >= 80) return "#34d399"; // Mint Green (Success)
        if (pct >= 55) return "#fbbf24"; // Amber (Warning)
        if (pct >= 30) return "#f97316"; // Orange
        return "#f43f5e"; // Rose/Red (Danger)
      }

      function renderTripleArcs(hPct, mPct, vPct, gPct, gColor) {
        const pctEl = document.getElementById("gaugePct");
        pctEl.style.color = gColor;
        pctEl.textContent = gPct + "%";

        const fill = document.getElementById("scoreFill");
        if (fill) {
          fill.style.width = Math.min(gPct, 100) + "%";
          fill.style.background = gColor;
          fill.style.boxShadow = `0 0 8px ${gColor}80`;
        }
      }

      function renderApp() {
        const m = readMastery(),
          v = readVanguard();
        const apps = [
          { d: m, weight: 1 },
          { d: v, weight: 1 },
        ];
        const relevant = apps.filter((a) => a.d.hasData);
        const globalPct =
          relevant.length > 0
            ? Math.round(
                relevant.reduce((acc, a) => acc + a.d.pct * a.weight, 0) /
                  relevant.reduce((acc, a) => acc + a.weight, 0),
              )
            : 0;
        const color = readinessColor(globalPct);

        requestAnimationFrame(() =>
          renderTripleArcs(0, m.pct, v.pct, globalPct, color),
        );
        document.getElementById("readinessTitle").textContent =
          readinessLabel(globalPct);
        document.getElementById("readinessTitle").style.color = color;

        const miniData = [
          { label: "Mastery", pct: m.pct, color: "#fbbf24" },
          { label: "Vanguard", pct: v.pct, color: "#c084fc" },
        ];
        document.getElementById("miniBars").innerHTML = miniData
          .map(
            (b) =>
              `<div class="mini-bar-item">
      <span class="mini-bar-label">${b.label}</span>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${b.pct}%;background:${b.color};box-shadow:0 0 8px ${b.color}60;"></div>
      </div>
      <span class="mini-bar-pct" style="color:${b.color}">${b.pct}%</span>
    </div>`,
          )
          .join("");

        const totalAppsActive = relevant.filter((a) => a.d.pct > 0).length;
        const maxStreak = m.streak;
        document.getElementById("globalStats").innerHTML = `
    <div class="rs-item">
      <div class="rs-lbl">Active Apps</div>
      <div class="rs-val">${totalAppsActive}<span style="font-size:1rem;color:var(--text-dim);">/2</span></div>
    </div>
    <div class="rs-item">
      <div class="rs-lbl">Global Score</div>
      <div class="rs-val" style="color:${color}">${globalPct}<span style="font-size:1rem;opacity:0.5;">%</span></div>
    </div>
    <div class="rs-item">
      <div class="rs-lbl">Best Streak</div>
      <div class="rs-val">${maxStreak}<span style="font-size:1rem;color:var(--text-dim);">d</span></div>
    </div>`;

        const cards = [
          buildMasteryCard(m),
          buildVanguardCard(v),
        ];
        document.getElementById("appGrid").innerHTML = cards.join("");

        requestAnimationFrame(() => {
          document.querySelectorAll(".card-prog-fill[data-pct]").forEach((el) => {
            el.style.width = el.dataset.pct + "%";
          });
        });

        const now = new Date();
        document.getElementById("lastRefresh").textContent =
          `LAST SYNC: ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        updateTicker(m, v, globalPct, color);
      }

      function updateTicker(m, v, gPct, color) {
        const segments = [
          `<span class="t-accent">SYS.READINESS</span> ${gPct}%`,
          `<span class="t-sep">/</span>`,
          `<span class="t-accent">MASTERY</span> ${m.pct}% · STREAK ${m.streak}D`,
          `<span class="t-sep">/</span>`,
          `<span class="t-accent">VANGUARD</span> ${v.pct}% · FOCUS ${v.deepFocus > 0 ? v.deepFocus + "H" : "N/A"}`,
          `<span class="t-sep">/</span>`,
          `<span class="t-accent">STATUS</span> ${readinessLabel(gPct).toUpperCase()}`,
          `<span class="t-sep">/</span>`,
        ];
        const content = segments.join(" ");
        document.getElementById("tickerInner").innerHTML =
          content + " " + content;
      }


      /* ── Card Builders ── */
      function cardShell(opts, inner) {
        const openBtn = opts.file
          ? `<a href="${opts.file}" class="card-open-btn" title="Open ${opts.name}"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
          : '';
        return `<div class="app-card" style="--card-color:${opts.color};--card-rgb:${opts.rgb};">
  <div class="card-bg-glyph"><i class="${opts.icon}"></i></div>
  <div class="card-band">
    <div class="card-band-left">
      <div class="card-icon-wrap"><i class="${opts.icon}"></i></div>
      <div>
        <div class="card-title">${opts.name}</div>
        <div class="card-subtitle">${opts.sub}</div>
      </div>
    </div>
    ${openBtn}
  </div>
  ${inner}
</div>`;
      }

      function buildMasteryCard(m) {
        const opts = {
          name: "Mastery",
          sub: "Habit Rituals",
          icon: "fa-solid fa-crown",
          color: "#fbbf24",
          rgb: "251,191,36",
          file: "mastery.html",
        };
        if (!m.hasData)
          return cardShell(opts, `<div class="no-data">Data Not Found — Launch hub to initialize.</div>`);
        const chips = RITUAL_KEYS.map(
          (id) => `<span class="chip ${m.completedIds.includes(id) ? "done" : "miss"}">${RITUAL_NAMES[id]}</span>`
        ).join("");
        return cardShell(opts, `
    <div class="card-stats-row">
      <div class="card-stat">
        <div class="card-stat-num accent">${m.completed}<span style="font-size:1rem;color:var(--text-dim);font-weight:600">/${m.total}</span></div>
        <div class="card-stat-sub">Rituals</div>
      </div>
      <div class="card-stat">
        <div class="card-stat-num">${m.streak}d</div>
        <div class="card-stat-sub">Streak</div>
      </div>
      <div class="card-stat">
        <div class="card-stat-num">${m.pct}%</div>
        <div class="card-stat-sub">Complete</div>
      </div>
    </div>
    <div class="card-prog">
      <div class="card-prog-header"><span>Ritual Completion</span><span>${m.completed}/${m.total} Done</span></div>
      <div class="card-prog-bar">
        <div class="card-prog-fill" data-pct="${m.pct}" style="width:0%"></div>
      </div>
    </div>
    <div class="card-chips">${chips}</div>`);
      }

      function buildVanguardCard(v) {
        const opts = {
          name: "Vanguard",
          sub: "10-Day Cycle Operations",
          icon: "fa-solid fa-shield-halved",
          color: "#c084fc",
          rgb: "192,132,252",
          file: "vanguard.html",
        };
        if (!v.hasData)
          return cardShell(opts, `<div class="no-data">Data Not Found — Launch hub to initialize.</div>`);
        const chips = VANGUARD_MISSIONS.map((id) => {
          const st = v.missionStatus[id];
          const cls = st === "completed" || st === "partial" ? "done" : "miss";
          return `<span class="chip ${cls}">${VANGUARD_NAMES[id]}${st === "partial" ? "*" : ""}</span>`;
        }).join("");
        return cardShell(opts, `
    <div class="card-stats-row">
      <div class="card-stat">
        <div class="card-stat-num accent">${v.completed}<span style="font-size:1rem;color:var(--text-dim);font-weight:600">/${v.total}</span></div>
        <div class="card-stat-sub">Missions</div>
      </div>
      <div class="card-stat">
        <div class="card-stat-num">${v.deepFocus > 0 ? v.deepFocus + "h" : "—"}</div>
        <div class="card-stat-sub">Deep Focus</div>
      </div>
      <div class="card-stat">
        <div class="card-stat-num">${v.pct}%</div>
        <div class="card-stat-sub">Complete</div>
      </div>
    </div>
    <div class="card-prog">
      <div class="card-prog-header"><span>Mission Status</span><span>${v.completed}${v.partial ? "+" + v.partial + "p" : ""}/${v.total}</span></div>
      <div class="card-prog-bar">
        <div class="card-prog-fill" data-pct="${v.pct}" style="width:0%"></div>
      </div>
    </div>
    <div class="card-chips">
      ${chips}
      ${v.earlyWake ? `<span class="chip done">Early Wake</span>` : ""}
      ${v.planning ? `<span class="chip done">Planning</span>` : ""}
    </div>`);
      }

      /* ══════════════════════════════════════════════════════
   DAY DELTA — yesterday vs today comparison
══════════════════════════════════════════════════════ */

      function getYesterdayKey() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }

      function getYesterdayMasteryPct() {
        const yesterday = getYesterdayKey();
        const db = safeJSON("mastery_data", {});
        const rituals = Array.isArray(db[yesterday]) ? db[yesterday] : [];
        return {
          pct: Math.round((rituals.length / 8) * 100),
          hasData: !!db[yesterday],
        };
      }

      function getYesterdayVanguardPct() {
        const pst = new Date(
          new Date().toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
          }),
        );
        pst.setDate(pst.getDate() - 1);
        const yesterday = `${pst.getFullYear()}-${String(pst.getMonth() + 1).padStart(2, "0")}-${String(pst.getDate()).padStart(2, "0")}`;
        const db = safeJSON("vanguard-logs", {});
        const dayLog = db[yesterday] || {};
        const missions = dayLog.missions || {};
        const completedCount = VANGUARD_MISSIONS.filter(
          (id) => missions[id] === "completed",
        ).length;
        const partialCount = VANGUARD_MISSIONS.filter(
          (id) => missions[id] === "partial",
        ).length;
        const effectiveCompleted = completedCount + partialCount * 0.5;
        const hasData = Object.keys(dayLog).length > 0;
        return {
          pct: Math.round(
            (effectiveCompleted / VANGUARD_MISSIONS.length) * 100,
          ),
          hasData,
        };
      }

      function renderDayDelta(todayH, todayM, todayV, globalPct) {
        const yM = getYesterdayMasteryPct();
        const yV = getYesterdayVanguardPct();

        const appColors = ["#fbbf24", "#c084fc"];
        const appLabels = ["M", "V"];
        const todayPcts = [todayM.pct, todayV.pct];
        const yestPcts = [yM.pct, yV.pct];

        // Global yesterday
        const yRelevant = [yM, yV].filter((a) => a.hasData);
        const yGlobal =
          yRelevant.length > 0
            ? Math.round(
                yRelevant.reduce((acc, a) => acc + a.pct, 0) / yRelevant.length,
              )
            : null;

        const arrowEl = document.getElementById("deltaArrow");
        const pctEl = document.getElementById("deltaPct");
        const subEl = document.getElementById("deltaSub");
        const barsEl = document.getElementById("deltaBars");

        if (yGlobal === null) {
          arrowEl.textContent = "—";
          arrowEl.style.color = "var(--text-dim)";
          pctEl.textContent = "N/A";
          pctEl.style.color = "var(--text-dim)";
          subEl.innerHTML = `<div class="delta-sub-row" style="color:var(--text-dim)">No yesterday data</div>`;
          barsEl.innerHTML = "";
          return;
        }

        const delta = globalPct - yGlobal;
        const absDelta = Math.abs(delta);
        const isUp = delta > 0;
        const isFlat = delta === 0;
        const color = isFlat ? "var(--text-dim)" : isUp ? "#34d399" : "#f43f5e";

        arrowEl.textContent = isFlat ? "—" : isUp ? "↑" : "↓";
        arrowEl.style.color = color;
        pctEl.textContent = isFlat
          ? "FLAT"
          : isUp
            ? `+${absDelta}%`
            : `-${absDelta}%`;
        pctEl.style.color = color;

        subEl.innerHTML = `
    <div class="delta-sub-row">Today <span style="color:${readinessColor(globalPct)}">${globalPct}%</span></div>
    <div class="delta-sub-row">Yest. <span style="color:var(--text-muted)">${yGlobal}%</span></div>`;

        barsEl.innerHTML = [0, 1]
          .map((i) => {
            const maxH = 32;
            const tH = Math.round((todayPcts[i] / 100) * maxH);
            const yH2 = Math.round((yestPcts[i] / 100) * maxH);
            const c = appColors[i];
            return `<div class="delta-bar-col">
      <div class="delta-bar-pair">
        <div class="delta-bar-seg" style="height:${Math.max(yH2, 3)}px;background:${c};" title="Yesterday ${yestPcts[i]}%"></div>
        <div class="delta-bar-seg today" style="height:${Math.max(tH, 3)}px;background:${c};" title="Today ${todayPcts[i]}%"></div>
      </div>
      <div class="delta-bar-lbl">${appLabels[i]}</div>
    </div>`;
          })
          .join("");
      }

      function calcStreak() {
        const mData  = safeJSON('mastery_data', {});
        const vLogs  = safeJSON('vanguard-logs', {});
        let streak = 0;
        const d = new Date();
        d.setDate(d.getDate() - 1); // start from yesterday
        for (let i = 0; i < 365; i++) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const mDone = (mData[key] || []).length >= 3;
          const vEntry = vLogs[key];
          const vDone  = vEntry && Object.values(vEntry.missions || {}).filter(s => s === 'completed' || s === 'partial').length >= 3;
          if (mDone && vDone) { streak++; d.setDate(d.getDate() - 1); }
          else break;
        }
        return streak;
      }

      function renderMiniWidgets(h, m, v) {
        document.getElementById("mwMasteryStat").textContent =
          `${m.completed} / ${m.total} RITUALS`;
        document.getElementById("mwMasteryBar").style.width = m.pct + "%";
        const vLabel =
          v.partial > 0
            ? `${v.completed}+${v.partial}★ / ${v.total} MISSIONS`
            : `${v.completed} / ${v.total} MISSIONS`;
        document.getElementById("mwVanguardStat").textContent = vLabel;
        document.getElementById("mwVanguardBar").style.width = v.pct + "%";

        const streak = calcStreak();
        const STREAK_GOAL = 30;
        document.getElementById("mwStreakStat").textContent = `${streak} DAY${streak !== 1 ? 'S' : ''}`;
        document.getElementById("mwStreakBar").style.width = Math.min(Math.round((streak / STREAK_GOAL) * 100), 100) + "%";
      }

      function renderAll() {
        const m = readMastery(),
          v = readVanguard();
        const apps = [
          { d: m, weight: 1 },
          { d: v, weight: 1 },
        ];
        const relevant = apps.filter((a) => a.d.hasData);
        const globalPct =
          relevant.length > 0
            ? Math.round(
                relevant.reduce((acc, a) => acc + a.d.pct * a.weight, 0) /
                  relevant.reduce((acc, a) => acc + a.weight, 0),
              )
            : 0;
        renderApp();
        renderDayDelta(null, m, v, globalPct);
        renderMiniWidgets(null, m, v);
      }

      (async () => {
        try {
          const _mod = await import('./appwrite-sync.js');
          saveCloudKey = _mod.saveCloudKey;
          await _mod.ensureCloudDefaults();
          await _mod.bootstrapCloudToLocal();
        } catch(e) {}
        renderAll();
        setInterval(renderAll, 60000);
      })();

      /* ══════════════════════════════════════════════════════
   WEEK ACTIVITY WIDGET
══════════════════════════════════════════════════════ */

      let activeWeekTab = "planning";

      const WEEK_CONFIGS = {
        planning: { label: "Planning", color: "#38bdf8", rgb: "56,189,248"  },
        tracking: { label: "Tracking", color: "#e879f9", rgb: "232,121,249" },
        ontrack:  { label: "OnTrack",  color: "#9ca3af", rgb: "156,163,175" },
      };

      function getWeekDates(weekOffset = 0) {
        const now = new Date();
        const sun = new Date(now);
        sun.setDate(now.getDate() - now.getDay() + weekOffset * 7);
        sun.setHours(0, 0, 0, 0);
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(sun);
          d.setDate(sun.getDate() + i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          dates.push({ key, date: d });
        }
        return dates;
      }

      function isDonePlanning(dateKey) {
        const db = safeJSON("vanguard-logs", {});
        return !!(db[dateKey] && db[dateKey].planning);
      }

      function isDoneOnTrack(dateKey) {
        const vLogs = safeJSON("vanguard-logs", {});
        if (vLogs[dateKey]?.onTrack === "full") return true;
        const raw = safeJSON("streak_ontrack", []);
        if (!Array.isArray(raw)) return false;
        return raw.some(
          (item) => (typeof item === "string" ? item : item?.date) === dateKey
        );
      }

      function isDoneTracking(dateKey) {
        const raw = safeJSON("streak_timeTracking", []);
        if (!Array.isArray(raw)) return false;
        return raw.some(
          (item) => (typeof item === "string" ? item : item?.date) === dateKey
        );
      }

      function getWeekData(tab, weekOffset = 0) {
        const dates = getWeekDates(weekOffset);
        const today = todayKey();
        const checkFn =
          tab === "planning" ? isDonePlanning :
          tab === "tracking" ? isDoneTracking :
                               isDoneOnTrack;
        const days = dates.map(({ key, date }) => ({
          key,
          date,
          done: checkFn(key),
          isToday: key === today,
          isFuture: key > today,
        }));
        return { days, count: days.filter((d) => d.done).length };
      }

      function switchWeekTab(tab) {
        activeWeekTab = tab;
        ["planning", "tracking", "ontrack"].forEach((t) => {
          const id = "wtb" + t.charAt(0).toUpperCase() + t.slice(1);
          document.getElementById(id)?.classList.toggle("active", t === tab);
        });
        renderWeekPanel();
      }

      function toggleWeekDay(dateKey) {
        if (activeWeekTab === "planning") {
          const db = safeJSON("vanguard-logs", {});
          if (!db[dateKey]) db[dateKey] = {};
          db[dateKey].planning = !db[dateKey].planning;
          localStorage.setItem("vanguard-logs", JSON.stringify(db));
          saveCloudKey('vanguard-logs', db);
          _nexusSync.broadcast('NEXUS');
        } else if (activeWeekTab === "tracking") {
          const arr = safeJSON("streak_timeTracking", []);
          const list = Array.isArray(arr) ? arr : [];
          const idx = list.findIndex(
            (item) => (typeof item === "string" ? item : item?.date) === dateKey
          );
          if (idx >= 0) list.splice(idx, 1);
          else list.push(dateKey);
          localStorage.setItem("streak_timeTracking", JSON.stringify(list));
          saveCloudKey('streak_timeTracking', list);
          _nexusSync.broadcast('NEXUS');
        } else if (activeWeekTab === "ontrack") {
          const arr = safeJSON("streak_ontrack", []);
          const list = Array.isArray(arr) ? arr : [];
          const idx = list.findIndex(
            (item) => (typeof item === "string" ? item : item?.date) === dateKey
          );
          if (idx >= 0) list.splice(idx, 1);
          else list.push(dateKey);
          localStorage.setItem("streak_ontrack", JSON.stringify(list));
          saveCloudKey('streak_ontrack', list);
          _nexusSync.broadcast('NEXUS');
        }
        renderWeekPanel();
      }

      function renderWeekPanel() {
        const cfg = WEEK_CONFIGS[activeWeekTab];
        const curr = getWeekData(activeWeekTab, 0);
        const prev = getWeekData(activeWeekTab, -1);

        // Button counts for all 3
        Object.keys(WEEK_CONFIGS).forEach((tab) => {
          const d = getWeekData(tab, 0);
          const el = document.getElementById(
            "wtb" + tab.charAt(0).toUpperCase() + tab.slice(1) + "Count"
          );
          if (el) el.textContent = `${d.count}/7`;
        });

        // Panel CSS vars
        const panel = document.getElementById("weekPanel");
        panel.style.setProperty("--week-color", cfg.color);
        panel.style.setProperty("--week-rgb", cfg.rgb);

        document.getElementById("weekStatsTitle").textContent =
          `This Week · ${cfg.label}`;

        // Day grid
        const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        document.getElementById("weekDayRow").innerHTML = curr.days
          .map(
            (d) =>
              `<div class="week-day-col">
                <div class="week-day-label">${DAY_LABELS[d.date.getDay()]}</div>
                <div class="week-day-dot${d.done ? " done" : ""}${d.isToday ? " today" : ""}${d.isFuture ? " future" : ""}"
                  title="${d.key}${d.done ? " ✓" : ""}"
                  onclick="toggleWeekDay('${d.key}')"></div>
              </div>`
          )
          .join("");

        // Main stat
        const numEl = document.getElementById("weekStatNum");
        numEl.textContent = curr.count;
        numEl.style.color = cfg.color;

        // VS prev week
        const delta = curr.count - prev.count;
        const isFlat = delta === 0;
        const isUp = delta > 0;
        const deltaColor = isFlat ? "var(--text-dim)" : isUp ? "#34d399" : "#f43f5e";
        const deltaText = isFlat ? "±0 days" : isUp ? `+${delta} days` : `${delta} days`;

        const vsEl = document.getElementById("weekVsDelta");
        vsEl.textContent = deltaText;
        vsEl.style.color = deltaColor;
        document.getElementById("weekVsPrev").textContent =
          `prev week: ${prev.count}/7`;
      }

      renderWeekPanel();
      setInterval(renderWeekPanel, 60000);

      // Live sync — re-render when any other page saves
      _nexusSync.listen(() => { renderAll(); renderWeekPanel(); });

      /* ══════════════════════════════════════════════════════
   NODE PARTICLE NETWORK (Softer Style)
══════════════════════════════════════════════════════ */
      (function () {
        const canvas = document.getElementById("nodeCanvas");
        const ctx = canvas.getContext("2d");
        let W,
          H,
          nodes = [];
        const NODE_COUNT = 40;
        const MAX_DIST = 180;
        const ACCENT = "rgba(148, 163, 184,"; // Soft Slate color

        function resize() {
          W = canvas.width = window.innerWidth;
          H = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        class Node {
          constructor() {
            this.reset(true);
          }
          reset(init) {
            this.x = Math.random() * W;
            this.y = init
              ? Math.random() * H
              : Math.random() > 0.5
                ? -10
                : H + 10;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            this.r = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.4 + 0.1;
          }
          update() {
            this.x += this.vx;
            this.y += this.vy;
            if (
              this.x < -20 ||
              this.x > W + 20 ||
              this.y < -20 ||
              this.y > H + 20
            )
              this.reset(false);
          }
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = ACCENT + this.opacity + ")";
            ctx.fill();
          }
        }

        for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());

        function frame() {
          ctx.clearRect(0, 0, W, H);
          nodes.forEach((n) => {
            n.update();
            n.draw();
          });
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x,
                dy = nodes[i].y - nodes[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < MAX_DIST) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = ACCENT + (1 - dist / MAX_DIST) * 0.1 + ")";
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
          requestAnimationFrame(frame);
        }
        frame();
      })();

      document.addEventListener("keydown", (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.key === "v" || e.key === "V") window.location.href = "vanguard.html";
        if (e.key === "m" || e.key === "M") window.location.href = "mastery.html";

      });