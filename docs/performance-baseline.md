# CollabDoc Performance Baseline & Audit

## Architecture Overview
CollabDoc is a real-time collaborative Markdown editor with the following components:
- **Frontend:** React, CodeMirror, Yjs for CRDT operations, socket.io-client.
- **Backend:** Node.js, Express for REST API, Socket.IO for WebSocket communication, MongoDB/Mongoose for persistence.
- **Collaboration Model:** Yjs documents are managed in-memory on the backend. Updates are synced via binary state vectors over Socket.IO.
- **Persistence:** Document state (Yjs binary and plain text) is persisted to MongoDB. To prevent excessive database writes, persistence is debounced by 2 seconds using an in-memory timer per document.

## Known Limitations & Observations
- **Memory Management:** Yjs documents (`ydoc`) are created and cached in an in-memory `Map` (`docs`). Currently, they are never removed from this map, which represents a memory leak for long-running servers handling many distinct documents.
- **Security Discrepancy:** The initial REST API securely enforced document visibility (checking owner/collaborator/public). However, the Socket.IO `join-document` event originally lacked these authorization checks, potentially allowing unauthorized WebSocket connections to sync private documents if the `docId` was known. This is fixed in the current benchmark revision.
- **Single Node Bottleneck:** The current in-memory `docs` Map and Socket.IO configuration are designed for a single Node.js instance. Scaling horizontally would require Redis for Socket.IO clustering and a distributed CRDT coordination layer (like y-redis).

## Benchmark Methodology
To produce objective, evidence-backed engineering metrics, we are utilizing a custom Node.js test harness.
- **Why a custom harness?** Standard HTTP load testers (e.g., k6, autocannon) cannot realistically simulate the binary Yjs synchronization protocol over Socket.IO. We use `socket.io-client` and `yjs` directly in the test scripts.
- **Metrics Collected:**
  - Concurrent users (active Socket.IO connections).
  - API and WebSocket latency (join document, save latency).
  - Error rates (HTTP errors, WebSocket disconnects).
  - Database write reduction (comparing debounced vs. immediate persistence).
  - Service availability during controlled windows.
- **Isolation:** Load tests generate random guest users or test accounts and target specific test documents, leaving production data untouched.
- **Debounce Testing:** To test the DB write reduction, a test-only environment variable (`DISABLE_DEBOUNCE=true`) is used to force synchronous saves. This allows a direct "Mode A vs Mode B" comparison.

## Assumptions
- The test environment has sufficient resources (CPU/RAM/Network) so that the load generator itself is not the primary bottleneck at lower concurrency levels.
- The MongoDB instance used for testing is representative of expected query latencies (or running locally).

## Commands for Reproducibility
- `npm run test:load`: Runs the concurrency scaling benchmark.
- `npm run test:db`: Runs the debounce vs. no-debounce database write comparison.
- `npm run test:availability`: Runs a simulated uptime monitor.
- `npm run test:soak`: Runs a longer-duration sustained load test.
