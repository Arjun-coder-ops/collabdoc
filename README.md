# CollabDoc — Real-time Collaborative Editor

A full-stack real-time collaborative document editor built with the MERN stack and Socket.io. Multiple users can edit the same document simultaneously with live cursor presence and instant sync — powered by Yjs CRDT for conflict-free editing.

## Features

- JWT authentication (register / login)
- Create, edit, delete documents
- Real-time multi-user editing via Socket.io + Yjs CRDT
- Live presence — see who's editing with colored avatars
- Auto-save to MongoDB every 2 seconds
- Shareable document links (public/private toggle)
- Ctrl+S manual save
- Markdown support in editor

## Tech Stack

**Backend:** Node.js, Express.js, Socket.io, MongoDB, Mongoose, Yjs, JWT, bcryptjs

**Frontend:** React.js, Vite, TailwindCSS, CodeMirror 6, Yjs, y-codemirror.next, Socket.io-client

## Project Structure

```
collabdoc/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── models/
│   │   │   ├── User.js       # User schema
│   │   │   └── Document.js   # Document schema
│   │   ├── routes/
│   │   │   ├── auth.js       # Register, login, /me
│   │   │   └── documents.js  # CRUD routes
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT middleware
│   │   └── socket/
│   │       └── index.js      # Socket.io + Yjs engine
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useCollabSocket.js
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── Editor.jsx
    │   └── components/
    │       └── PresenceAvatars.jsx
    ├── .env.example
    └── package.json
```

## Setup & Running

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**backend/.env**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/collabdoc
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## Deployment

- **Frontend** → Vercel (connect GitHub repo, set `VITE_API_URL` to your Render URL)
- **Backend** → Render (set all env vars in dashboard)
- **Database** → MongoDB Atlas (free tier)

## How the real-time sync works

1. User opens a document → joins a Socket.io room for that `docId`
2. Server sends current Yjs document state to the new user
3. When user types → Yjs generates a binary update → sent to server via `send-update`
4. Server applies update to in-memory Yjs doc → broadcasts to all other users in room
5. Every 2 seconds → server saves Yjs state + plain text content to MongoDB
6. If user reconnects → server sends full current state, user catches up automatically

## Interview talking points

- **Why Yjs / CRDT over OT?** CRDTs are mathematically guaranteed to converge without a central authority. No need to transform operations — every edit has a unique logical ID, so merges are always correct.
- **How does persistence work?** Yjs state is serialized as binary (Buffer) and stored in MongoDB. On reconnect, the server hydrates the Y.Doc from this saved state before sending to client.
- **How would you scale to 10,000 users?** Replace in-memory `docs` Map with Redis + Redis Pub/Sub so multiple Node.js instances can share Yjs state and broadcast updates across servers.
- **What's the latency?** Sub-100ms on LAN. WebSocket round trip is ~10-30ms; Yjs update encoding adds ~1ms.
