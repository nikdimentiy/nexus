# ⚡ NEXUS Command Hub

> Your unified command hub for daily execution, habit mastery, and strategic life analytics.

NEXUS is a personal operating system built to manage discipline, performance, and mission progress from one place. It combines a central dashboard, a ritual-tracking system, and a strategic analytics layer into a single experience.

## 🧭 Overview

NEXUS is designed around three connected systems: the main command hub, the daily mastery interface, and the Vanguard analytics module. Together they provide visibility into daily execution, weekly consistency, streaks, readiness, forecasting, and long-range performance patterns.

## 🧩 Core Modules

### 🏠 NEXUS Hub
The main dashboard acts as the central control layer with sign-in, day timers, countdowns, weekly panels, readiness status, and system-wide data vault controls. It unifies key mission systems like Mastery, Vanguard, Goals, OnTrack, and Tracking into one operational view.

### 🎯 Mastery
Mastery is the daily ritual engine focused on consistent self-development through repeatable habits and measurable streaks. It tracks metrics like current streak, best streak, total logged days, perfect days, 7-day average, mastery score, and ritual completion progress.

### 🛡️ Vanguard
Vanguard is the strategic intelligence layer built for cycle review, forecasting, mission scoring, and deeper performance analysis. It includes AI forecast widgets, cycle efficiency breakdowns, strategic insights, monthly progress views, and daily input controls like planning, deep work, energy, and on-track status.

## ✨ Features

- ⏱️ Real-time day timer and countdown to midnight for daily awareness  
- 🔐 Authentication-protected experience powered by Appwrite  
- 📊 Weekly planning, tracking, and on-track progress panels  
- 📈 Readiness overview with system health indicators and score visualization  
- 🗂️ Data Vault with export and restore backup controls across mission systems  
- 🔥 Streak tracking, perfect days, and ritual completion analytics  
- 🧠 Energy-level tracking for daily context and performance correlation  
- 🤖 AI-assisted forecasting and cycle analytics for strategic decision-making  
- ⌨️ Keyboard shortcuts and fast command-style navigation in Vanguard

## 🏋️ Daily Ritual System

Mastery tracks 8 core rituals that shape daily consistency and personal growth:

- ✍️ English — create opportunities · global voice  
- 💰 Green Money — build abundant future · financial fortress  
- 💪 Fitness — forge elite body · sculpted physique  
- 📚 Reading — intellectual feast · expand knowledge  
- 🧠 Learning — cyber learning · build & grow daily  
- 🌅 Wake Early — prime day launch · win the morning  
- 🌱 Sugar-Free — virtue cultivator · replace bad input  
- 🚫 Bad Habit — override bad habit · build character

## 📊 What You Can Track

### In the Hub
- Day timer and live clock  
- Monthly cycle progress  
- Comparison vs yesterday  
- Weekly planning/tracking/on-track stats  
- Readiness score and system overview

### In Mastery
- Daily ritual completion  
- Streaks and best records  
- Perfect days and weekly totals  
- Energy level logging  
- Mission timeline calendar

### In Vanguard
- Today’s score and year progress  
- Daily notes and strategic inputs  
- Deep work hours  
- Planning and early wake toggles  
- AI forecast and cycle efficiency insights

## 🛠️ Tech Direction

The project uses a modular frontend structure with separate pages for the hub, mastery, and vanguard systems, each loading dedicated JavaScript and CSS assets. The interface integrates Font Awesome icons, Google Fonts, local storage/data export flows, and Appwrite-backed authentication protection.

## 💾 Data Vault

NEXUS includes a built-in vault system for unified backups across mission data sources including Mastery, Vanguard logs, goals, OnTrack, and time tracking. Users can export a full backup or restore from a JSON file directly inside the interface.

## 🚀 Vision

NEXUS is more than a dashboard. It is a personal command center for discipline, clarity, and momentum—built to turn daily actions into measurable long-term progress.

## 📁 Project Structure

```bash
.
├── index.html        # ⚡ Main NEXUS command hub
├── mastery.html      # 🎯 Daily ritual and streak system
├── vanguard.html     # 🛡️ Strategic analytics and forecasting
├── css/              # 🎨 Stylesheets
├── js/               # ⚙️ Logic and system behavior
├── favicon/          # 🧿 App icons
```

## 🔐 Access

The interface is protected and intended to run in a proper local or hosted server environment rather than direct file access. The sign-in experience is connected to Appwrite and the local file fallback warns users to launch via a local server such as:
```
python3 -m http.server 8080
```

## 📌 Status

🚧 Personal high-performance operating system in active development
