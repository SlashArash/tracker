# Gojodoro 🍅

**Gojodoro** is a personal task and Pomodoro time-tracking web application designed to help you stay focused, manage personal tasks effectively, and track your productivity.

All your data stays completely private and is stored locally in your browser.

---

## 🎯 Purpose

Gojodoro is built specifically for **personal task management and focus tracking**. Whether you are studying, coding, writing, or tackling personal daily to-dos, Gojodoro combines task prioritization, Pomodoro timeboxing, ambient soundscapes, and data security into a sleek, distraction-free interface.

---

## ✨ Features

### ⏱️ Customizable Pomodoro Timer
- **Flexible Durations**: Customize Work, Short Break, and Long Break durations to match your workflow.
- **Automation**: Options for auto-starting breaks and auto-starting Pomodoro sessions.
- **Audio Alerts**: Choose between custom sound alerts (Chime, Bell, Synth).
- **Ambient Soundscapes**: Built-in background audio (White Noise, Pink Noise, Rain) using Web Audio API to help maintain concentration.

### 📋 Project & Task Management
- **Project Organization**: Categorize tasks into projects with custom color tags.
- **Task Workflow**: Track task states (`Not Started`, `Next Up`, `In Progress`, `Done`).
- **Priority Levels**: Assign priorities (`Low`, `Medium`, `High`, `Urgent`) to keep track of urgent items.
- **Session Linking**: Link Pomodoro timer sessions directly to active tasks and projects.

### 📊 Session History & Activity Tracking
- **Detailed History**: Log completed sessions with exact durations, timestamps, and task categories.
- **Productivity Tracking**: Review past focus sessions and monitor time spent on projects.

### 🔒 Security & Privacy First
- **Passcode Protection**: Optional PIN/Passcode lock screen to protect your workspace when away from your device.
- **Encrypted Data Backup**: Export and import your data (Projects, Tasks, Sessions, and Settings) with optional AES-GCM password encryption.
- **100% Local Storage**: Powered by IndexedDB (Dexie.js). No account creation required and no personal data is sent to external servers.

### 🎨 Themes & UI
- **Light & Dark Themes**: Seamless toggle between sleek Dark mode and clean Light mode.
- **Responsive & Modern Design**: Clean visual feedback and micro-interactions built for desktop and mobile browsers.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Database**: IndexedDB via Dexie.js
- **Security**: Web Crypto API (AES-GCM encryption & PBKDF2 key derivation)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Package manager (`npm`, `pnpm`, or `bun`)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Runs TypeScript typechecking and builds the application for production.
- `npm run typecheck` - Runs `tsc --noEmit` to verify TypeScript types.
- `npm run preview` - Locally previews the production build.

---

## 🔒 Privacy & Data Ownership

Your privacy is paramount. Gojodoro stores all data (tasks, projects, focus history, app settings) locally in your browser using IndexedDB. You can export a encrypted or unencrypted backup file at any time from the **Data Backup** menu.

---

## 📄 License

This project is open-source and intended for personal task tracking and productivity management.
