# Project Documentation: CollabDoc

## 1. Overview
CollabDoc is a high-performance, real-time collaborative document editing platform. It enables multiple users to create, share, and edit text documents simultaneously with instantaneous synchronization. The system leverages Conflict-free Replicated Data Types (CRDTs) to ensure data consistency across distributed clients without the need for complex server-side operation transformations.

## 2. Problem Statement
Traditional web-based text editors often suffer from concurrency conflicts when multiple users attempt to modify the same content. Manual merging and server-side locks disrupt the user experience. CollabDoc addresses these challenges by providing a seamless, "Google Docs-style" collaborative environment where edits are merged automatically and presence is tracked in real-time.

## 3. Technical Architecture

### 3.1 Technology Stack
- **Frontend Layer:** React.js, Vite, CodeMirror 6, Yjs, Axios.
- **Backend Layer:** Node.js, Express.js, Socket.io, Yjs (Server-side engine).
- **Persistence Layer:** MongoDB (MERN stack architecture).
- **Styling:** Vanilla CSS with a focus on Glassmorphism and Responsive Design.

### 3.2 Real-time Engine (Yjs)
The core collaborative functionality is powered by the **Yjs** library. It uses CRDTs to manage the document state.
- **Conflict Resolution:** Every character/operation is logically timestamped and uniquely identified, guaranteeing eventual consistency.
- **Binary Propagation:** Edits are encoded into compact binary updates and broadcasted via WebSockets (Socket.io).

## 4. Key Functional Modules

### 4.1 Authentication & Security
- **JSON Web Tokens (JWT):** Secure session management for all registered users.
- **Bcrypt.js:** Industry-standard password hashing.
- **Protected Routes:** Middleware-level access control for private documents.

### 4.2 Document Management
- **CRUD Operations:** Users can Create, Read, Update, and Delete documents.
- **Auto-Save Mechanism:** The system debounces edits and persists the binary document state to MongoDB every 2 seconds.
- **Visibility Control:** Documents can be toggled between 'Public' (link-access) and 'Private' (owner-only).

### 4.3 Collaboration Features
- **Shared Awareness:** Real-time visibility of active users' cursors and selections.
- **Presence Avatars:** Visual indicators in the navigation bar showing all participants in a document session.
- **Remote Title Sync:** Collaborative editing extends to the document title.

## 5. Deployment Information
- **Frontend:** Deployed via Vercel for fast global delivery.
- **Backend:** Hosted on Render with persistent WebSocket connections.
- **Database:** Managed via MongoDB Atlas.

---

## 6. Installation & Local Development

### 6.1 Prerequisites
- Node.js (v18.x or higher)
- MongoDB Atlas account (or local MongoDB instance)

### 6.2 Setup Instructions
1. **Clone Repository:**
   ```bash
   git clone https://github.com/Arjun-coder-ops/collabdoc.git
   ```
2. **Backend Configuration:**
   - Navigate to `/backend`.
   - Install dependencies: `npm install`.
   - Create a `.env` file with `PORT`, `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. **Frontend Configuration:**
   - Navigate to `/frontend`.
   - Install dependencies: `npm install`.
   - Create a `.env` file with `VITE_API_URL`.

### 6.3 Execution
- To start the development environment, execute `npm run dev` in both the backend and frontend directories.

---

## 7. Future Enhancements
- **Rich Text Support:** Transition from Markdown to a WYSIWYG rich text editor.
- **Version History:** Implementation of "Time Travel" to view and restore previous document states.
- **Organization Support:** Workspace-based grouping for teams and organizations.

## 8. Author
- **Developer:** [Arjun Gogu](https://github.com/Arjun-coder-ops)
