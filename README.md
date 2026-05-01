# ⚡ NEXUS · COMMAND HUB

> 🎯 **Your unified personal operating system** — daily execution, ritual mastery, and strategic life analytics, all in one place.

NEXUS is a **hash-router SPA** built for discipline, performance, and mission progress. No full page reloads — instant transitions between three interconnected command modules, all guarded by Appwrite authentication and cached for offline use.

---

## 🧭 Architecture

```text
⚡ index.html  ←  Single shell — SPA entry point
      │
      ├── 🔐 Auth Overlay     always in DOM, zero-latency sign-in
      ├── 🔄 js/router.js     hash routing · in-memory auth cache · realtime
      │         │
      │         ├── #          → 🏠 js/views/nexus.js
      │         ├── #vanguard  → 🛡️ js/views/vanguard.js
      │         └── #mastery   → 🎯 js/views/mastery.js
      │
      └── 🎨 CSS              all four sheets loaded upfront
                              inactive views → media="not all"
```

**Zero round-trips** after first auth. Navigate between all three views at the speed of `import()`.

---

## 🧩 Core Modules

### 🏠 NEXUS Hub — `#`

The central command layer. Live clock, day countdown, monthly cycle progress, weekly planning/tracking panels, readiness score, and the full system overview. Entry point for all connected modules.

### 🎯 Mastery — `#mastery`

The daily ritual engine. 8 daily disciplines tracked with streaks, perfect days, energy levels, and a calendar brick wall. Cross-syncs ritual completions ↔ Vanguard missions in real time via BroadcastChannel.

### 🛡️ Vanguard — `#vanguard`

The strategic intelligence layer. Cycle analytics, AI-assisted forecasting, mission scoring, deep work tracking, efficiency breakdowns, and long-range performance patterns. Full keyboard-command interface.

---

## ✨ Features

| Feature | Detail |
| --- | --- |
| ⚡ **Instant navigation** | Hash-router SPA — no page reloads between views |
| 🔐 **Auth guard** | Appwrite-backed session, cached in memory after first check |
| 🌐 **Realtime sync** | Appwrite Realtime + BroadcastChannel for cross-view state |
| 📴 **Offline support** | Service worker caches all assets after first visit |
| ⏱️ **Live day clock** | Real-time countdown to midnight + day progress bar |
| 🔥 **Streak engine** | Current / best streak, perfect days, 7-day rolling avg |
| 🧠 **Energy tagging** | Log daily energy level; syncs across Mastery ↔ Vanguard |
| 🤖 **AI forecasting** | Cycle prediction and efficiency analytics in Vanguard |
| ⌨️ **Keyboard nav** | Full shortcut layer in every view — no mouse required |
| 🎉 **Confetti** | One-time celebration on 8/8 perfect ritual days |

---

## 🏋️ The 8 Daily Rituals

Mastery tracks these disciplines every day, building streaks and measuring consistency:

| # | Ritual | Mission |
| --- | --- | --- |
| `1` | ✍️ **English** | Create opportunities · global voice |
| `2` | 💰 **Green Money** | Build abundant future · financial fortress |
| `3` | 💪 **Fitness** | Forge elite body · sculpted physique |
| `4` | 📚 **Reading** | Intellectual feast · expand knowledge |
| `5` | 🧠 **Learning** | Cyber learning · build & grow daily |
| `6` | 🌅 **Wake Early** | Prime day launch · win the morning |
| `7` | 🌱 **Sugar-Free** | Virtue cultivator · replace bad input |
| `8` | 🚫 **Bad Habit** | Override bad habit · build character |

---

## ⌨️ Keyboard Shortcuts

### 🏠 Nexus Hub

| Key | Action |
| --- | --- |
| `V` | → Vanguard |
| `M` | → Mastery |

### 🎯 Mastery

| Key | Action |
| --- | --- |
| `1`–`8` | Toggle ritual |
| `L` / `M` / `H` | Set energy Low / Medium / High |
| `D` | Scroll to ritual grid |
| `P` | Scroll to top |
| `C` | Jump calendar to today |
| `N` | → Nexus |
| `V` | → Vanguard |
| `Esc` | Close day modal |

### 🛡️ Vanguard

| Key | Action |
| --- | --- |
| `N` | → Nexus |
| `Esc` | Close modal |

---

## 📊 What You Can Measure

### 🏠 Hub

- 🕐 Live day timer & clock
- 📅 Monthly cycle progress
- ↕️ Delta vs yesterday
- 📋 Weekly plan / track / on-track stats
- 💚 Readiness score & system health

### 🎯 Mastery

- ✅ Daily ritual completion (8/8)
- 🔥 Current & best streak
- 🏆 Perfect days (all-time)
- 📊 7-day rolling average
- 🌟 Lifetime mastery score
- 🗓️ Calendar brick wall (month view with day modal)
- ⚡ Energy level log

### 🛡️ Vanguard

- 🎯 Today's mission score
- 📈 Year-to-date progress
- 🧩 Deep work hours
- 🗒️ Daily notes & strategic inputs
- 🌄 Early wake toggle (synced ↔ Mastery)
- 🤖 AI forecast & cycle efficiency

---

## 🗂️ Project Structure

```text
nexus/
├── 📄 index.html              SPA shell — single entry point
├── 📄 offline.html            Offline fallback page
├── 📄 sw.js                   Service worker — caches all assets
├── 📄 vite.config.js          Build config (single entry)
│
├── 🎨 css/
│   ├── index.css              Nexus hub styles
│   ├── vanguard.css           Vanguard styles
│   ├── mastery.css            Mastery styles (Rolls-Royce edition)
│   └── auth.css               Auth overlay styles
│
└── ⚙️ js/
    ├── router.js              Hash router · auth guard · overlay wiring
    ├── storage.js             Shared globals (todayKey, escapeHtml, trapFocus, nexusSync)
    ├── appwrite-sync.js       Auth · cloud sync · realtime subscription
    ├── config.js              Appwrite project config
    └── views/
        ├── nexus.js           🏠 Hub view module
        ├── vanguard.js        🛡️ Vanguard view module
        └── mastery.js         🎯 Mastery view module
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| 🏗️ **Framework** | Vanilla JS SPA — hash router, dynamic `import()`, view lifecycle |
| ☁️ **Auth & Sync** | [Appwrite](https://appwrite.io) — sessions, realtime, cloud storage |
| ⚡ **Build** | [Vite 5](https://vitejs.dev) — code splitting, single entry |
| 🎨 **Fonts** | Inter · Outfit · JetBrains Mono · Plus Jakarta Sans · Cormorant Garamond |
| 🔣 **Icons** | Font Awesome 6.5 |
| 📴 **Offline** | Service Worker — cache-first strategy |
| 💾 **Storage** | `localStorage` (primary) + Appwrite cloud (sync) |
| 🔁 **Cross-tab** | BroadcastChannel for live cross-view state updates |

---

## 🚀 Getting Started

### Development

```bash
npm install
npm run dev        # → http://localhost:5173
```

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the build locally
```

### Other Commands

```bash
npm run lint       # ESLint on js/
npm run format     # Prettier on all JS/HTML/CSS
```

> ⚠️ **Must run via HTTP server** — sign-in requires `http://` not `file://`.  
> Quick fallback: `python3 -m http.server 8080`

---

## 🔐 Auth & Access

Authentication is handled by Appwrite. On first load the router checks session state once and caches it in memory — all subsequent view transitions are instant with zero auth round-trips.

- **Protected routes:** `#vanguard`, `#mastery` — unauthenticated users are redirected to `#`
- **Public route:** `#` (nexus hub) — sign-in overlay is shown until authenticated
- **Rate limiting:** 5 failed attempts triggers a 60-second lockout with countdown

---

## 📌 Status

🚧 **Personal high-performance operating system** — in active development

---

*⚡ Built for discipline, clarity, and momentum — turning daily actions into measurable long-term progress.*
