# 🏆 Three Wins — Daily Focus Tracker

> **Restricts daily tasks to just 3 core priorities with one-click completion animations, preventing task overload.**

A high-performance, distraction-free Progressive Web App (PWA) with real-time cross-device sync powered by Cloudflare KV. Built with vanilla HTML5, CSS3, and JavaScript with two tailored UI designs for desktop and mobile phones.

---

## 📑 Table of Contents
1. [Dual-Design System (Desktop vs Mobile)](#-dual-design-system)
2. [Core Philosophy](#-core-philosophy)
3. [Features Overview](#-features-overview)
   - [Rule-of-3 Daily Task Grid](#1-rule-of-3-daily-task-grid)
   - [One-Click Completion & Celebrations](#2-one-click-completion--celebrations)
   - [Zen Deep Focus Mode](#3-zen-deep-focus-mode)
   - [Parking Lot / Brain Dump Drawer](#4-parking-lot--brain-dump-drawer)
   - [Visual Goal History & Heatmap](#5-visual-goal-history--heatmap)
   - [Cloudflare KV Cross-Device Sync](#6-cloudflare-kv-cross-device-sync)
   - [PWA & Mobile Native Experience](#7-pwa--mobile-native-experience)
   - [Themes, Standup Export & Shortcuts](#8-themes-standup-export--shortcuts)
4. [Architecture & File Structure](#-architecture--file-structure)
5. [Deployment & Setup Guide](#-deployment--setup-guide)
   - [Cloudflare Pages & KV Setup](#cloudflare-pages--kv-setup)
   - [Phone Installation (iOS & Android)](#phone-installation-ios--android)
6. [Keyboard Shortcuts](#-keyboard-shortcuts)

---

## 📱🖥️ Dual-Design System

### 💻 1. Desktop / Laptop Design (`>= 768px`)
- **Spacious Focus Layout**: Centered 880px max-width workspace with clean typography.
- **Header Actions Bar**: Cloud Sync status, Victory History, Audio toggle, Theme switcher, and Streak badge all accessible at a glance.
- **Keyboard Productivity**: Built-in hotkeys (`1`, `2`, `3`, `D`, `T`, `M`) and desktop action buttons.
- **Centered Dialogs**: Glassmorphic modal overlays for analytics and settings.

### 📱 2. Mobile App Design (`< 768px`)
- **Fixed Bottom Navigation Dock**: Native iOS/Android style bottom bar anchored to the bottom with `env(safe-area-inset-bottom)`:
  - 📥 **Parking Lot** (with live unread count badge)
  - 📊 **Goal History** (52-week heatmap & monthly calendar)
  - ☁️ **Cloud Sync** (with live cloud connection dot)
  - 📋 **Standup Copy** (1-tap markdown copy for Slack/notes)
- **Zero Squishing & Cutoffs**:
  - `42px` fixed-size tactile checkbox button (`flex-shrink: 0`).
  - Inputs formatted with `16px` font size (strictly prevents iOS Safari from auto-zooming the viewport upon tap).
  - Compact date navigator (`Prev`, `Today`, `Next`) that fits even 320px–375px screens without text wrapping.
- **Bottom-Sheet Modals**:
  - Modals and drawers slide up from the bottom with a native grab handle bar and rounded top corners (`border-radius: 22px 22px 0 0`).

---

## 🎯 Core Philosophy

To-do lists fail because they grow indefinitely, leading to decision paralysis and overwhelm. 

**Three Wins** enforces the **Rule of Three**: you define only 3 essential outcomes per day:
- **Win #1 (Main Priority)**: The single highest-impact deliverable.
- **Win #2 (Key Milestone)**: The secondary priority.
- **Win #3 (Essential Task)**: The third critical task.

Any additional thoughts, errands, or future tasks are offloaded into the **Parking Lot Drawer** to keep today's focus pure.

---

## 🌟 Features Overview

### 1. Rule-of-3 Daily Task Grid
- **Strict 3-Slot Limit**: Prevents adding a 4th task until tomorrow or parking it in the drawer.
- **Visual Progress Bar**: Real-time progress pills displaying `0/3`, `1/3`, `2/3`, and `3/3` status.
- **Triple Win Banner**: Conquering all 3 wins activates a victory glowing state and celebration message.
- **Date Navigator**: Seamlessly view and edit past accomplishments or plan tomorrow's wins (`Yesterday`, `Today`, `Tomorrow`).
- **Daily Reflection Box**: Dedicated gratitude and reflection journal saved alongside each day's outcomes.

---

### 2. One-Click Completion & Celebrations
- **Canvas Particle Engine** (`js/confetti.js`):
  - Checking off an individual task triggers a localized, directional particle burst.
  - Completing all 3 wins triggers a full-screen celebratory confetti storm.
- **Zero-Latency Web Audio Synthesizer** (`js/audio.js`):
  - *Tactile Pop*: Physical-feeling click sound when pressing buttons.
  - *Rising Harmonic Chimes*: Each completed win plays an ascending musical note (C5 $\rightarrow$ E5 $\rightarrow$ G5).
  - *Triple Win Fanfare*: 4-note major chord arpeggio celebrating the 3/3 victory.
  - *100% Client-Side*: No audio files to download; synthesized directly via the browser's Web Audio API.

---

### 3. Zen Deep Focus Mode
- **Full-Screen Focus Overlay**: Isolates a single active task, removing all surrounding clutter.
- **Configurable Timer**:
  - `25m Pomodoro`, `50m Deep Work`, or `15m Sprint` presets.
  - Live countdown display and auto-logging of total focus minutes per task.
- **Synthesized Ambient Soundscapes**:
  - Built-in **Gentle Rain** and **Brown Noise** generators to drown out background distractions.
- **Inline Completion**: Mark the task complete directly from focus mode with full celebratory effects.

---

### 4. Parking Lot / Brain Dump Drawer
- **Prevents Task Creep**: A slide-over panel (press `D` or tap bottom tab) to capture secondary todos, sudden thoughts, or errands.
- **One-Click Promotion (`Promote ↑`)**: Promotes any parked item into an empty Win slot on today's board.

---

### 5. Visual Goal History & Heatmap
Click the **Calendar/History icon** or bottom tab to access 3 interactive views:
1. **52-Week Goal Heatmap**: GitHub-style activity grid showing your daily win consistency across 365 days.
2. **Monthly Interactive Calendar**: Month-by-month view with 🏆 Triple Win markers. Click any day to jump to that date's log.
3. **Searchable Victory Journal**: Full-text search across past goals and daily reflections.
4. **Streak & Consistency Metrics**: Tracks current streak, best streak, total triple wins, and total focus minutes logged.

---

### 6. Cloudflare KV Cross-Device Sync
- **100% Free & Zero Timeouts**: Powered by Cloudflare KV + Pages Functions (`functions/api/sync.js`). Unlike MongoDB Atlas free tiers, Cloudflare **never pauses or sleeps from inactivity**.
- **Frictionless Login**: Enter your personal **Sync Passcode / PIN** (e.g. `mysecret123`) once, and the device remembers it.
- **Magic Login URL**: Generates a 1-tap link to easily link your phone browser.
- **Local-First Speed**: All edits save locally in `0ms` and sync to Cloudflare KV in the background.

---

### 7. PWA & Mobile Native Experience
- **Progressive Web App**: Powered by `manifest.json` and `sw.js` (Service Worker).
- **Instant Offline Operation**: Works seamlessly on airplanes, subways, or weak cellular networks.
- **Haptic Feedback**: Subtle vibration (`navigator.vibrate`) on mobile devices when checking off tasks.
- **Safe-Area Layout**: Fluidly adapts to iPhone notches, dynamic islands, and Android navigation bars.

---

### 8. Themes, Standup Export & Shortcuts
- **3 Color Themes** (press `T`):
  - **Midnight Slate (Dark)**: Deep obsidian background with emerald glow.
  - **Nordic Paper (Light)**: Warm linen background with slate typography.
  - **Deep Forest**: Calming emerald & forest green hues.
- **Standup Markdown Exporter**: One click copies a formatted summary of today's wins and reflections for Slack/Discord.
- **Audio Toggle** (press `M`): Mute/unmute all synthesized sounds.

---

## 📁 Architecture & File Structure

```
├── index.html                 # Semantic single-page HTML layout & dual navigation
├── manifest.json              # PWA manifest (app icons, theme colors)
├── sw.js                      # Offline caching Service Worker
├── functions/
│   └── api/
│       └── sync.js            # Cloudflare Pages serverless KV sync endpoint
├── css/
│   └── styles.css             # Dual-design stylesheet (desktop & mobile dock)
└── js/
    ├── app.js                 # App controller, keyboard shortcuts, PWA lifecycle
    ├── audio.js               # Web Audio API real-time sound synthesizer
    ├── confetti.js            # HTML5 Canvas celebratory particle engine
    ├── history-view.js        # 52-week heatmap, monthly calendar & victory journal
    ├── storage.js             # Local-First storage layer & streak calculator
    └── sync.js                # Cloudflare KV real-time sync manager
```

---

## 🚀 Deployment & Setup Guide

### Cloudflare Pages & KV Setup

1. **Create the KV Namespace**:
   - In [Cloudflare Dashboard](https://dash.cloudflare.com) $\rightarrow$ **Workers & Pages** $\rightarrow$ **KV**.
   - Click **Create Namespace** and name it `THREE_WINS_KV`.

2. **Deploy to Cloudflare Pages**:
   - Push your code to GitHub.
   - In Cloudflare Dashboard $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ Connect your repository.
   - In your Pages project settings $\rightarrow$ **Settings** $\rightarrow$ **Functions** $\rightarrow$ **KV namespace bindings**:
     - **Variable name**: `THREE_WINS_KV`
     - **KV namespace**: Select your created `THREE_WINS_KV`.
   - Trigger a deploy.

3. **Link Your Devices**:
   - Open your deployed URL on your laptop $\rightarrow$ click **Cloud Sync** $\rightarrow$ enter a PIN (e.g. `mysecret123`).
   - Open the site on your phone $\rightarrow$ enter the same PIN (or tap the **Magic Login Link**).

---

### Phone Installation (iOS & Android)

- **iPhone (Safari)**:
  1. Open your website in Safari.
  2. Tap the **Share** button (box with upward arrow).
  3. Scroll down and tap **"Add to Home Screen"**.
- **Android (Chrome)**:
  1. Open your website in Chrome.
  2. Tap the **three-dot menu** $\rightarrow$ tap **"Install App"** / **"Add to Home screen"**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `1` | Toggle completion of **Win #1** |
| `2` | Toggle completion of **Win #2** |
| `3` | Toggle completion of **Win #3** |
| `D` | Open / Close **Parking Lot Drawer** |
| `T` | Cycle Color Themes (*Dark* $\rightarrow$ *Light* $\rightarrow$ *Forest*) |
| `M` | Toggle Synthesized Audio on/off |
| `Esc` | Close any open modal or exit Zen Focus mode |
