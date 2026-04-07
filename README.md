# 📝 CollabDoc — Real-time Collaborative Workspace

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![Yjs](https://img.shields.io/badge/Sync-Yjs%20CRDT-blue)](https://yjs.dev)

**CollabDoc** is a full-stack real-time collaborative document editor. Built with the MERN stack and powered by **Yjs CRDTs**, it provides a seamless experience with conflict-free editing and live presence.

---

## ✨ Features

- 🔐 **Secure Auth**: JWT-based authentication.
- 🚀 **Real-time Sync**: Instant synchronization using Yjs and WebSockets.
- 👥 **Live Presence**: See who's currently editing.
- 🌓 **Dynamic Themes**: Light and Dark modes.
- 📝 **Markdown Support**: Support for markdown syntax.

---

## 📸 Screenshots

<p align="center">
  <img src="login.png" width="400" alt="Login Page" style="border: 1px solid #eee; border-radius: 8px;" />
  <img src="dashboard.png" width="400" alt="Dashboard" style="border: 1px solid #eee; border-radius: 8px;" />
</p>

<p align="center">
  <img src="editor.png" width="800" alt="Editor Page" style="border: 1px solid #eee; border-radius: 8px;" />
</p>

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, CodeMirror 6, Yjs
- **Backend:** Node.js, Express, Socket.io, MongoDB, Yjs

---

## 🚀 Quick Start

### 1. Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Running the App
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🧠 Technical Highlights

- **CRDT (Yjs):** Ensures eventual consistency without central coordination.
- **Persistence:** Document state stored as binary in MongoDB.

---

## 👨‍💻 Developed by [Arjun Gogu](https://github.com/Arjun-coder-ops)
