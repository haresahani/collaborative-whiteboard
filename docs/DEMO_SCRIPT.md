# Interview Video Demo Script & Presentation Walkthrough

This document provides a timed 2–3 minute video script and live demonstration guide for presenting the **Collaborative Whiteboard** project in technical interviews.

---

## ⏱️ Video Script Overview & Timeline

| Time Segment    | Topic                                       | Key Narrative & Action Steps                                                                                                                                                                                                                                                                             |
| :-------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0:00 - 0:45** | **Architecture & Tech Stack**               | • Introduce system as a production-grade TypeScript monorepo.<br/>• Explain the 4 main services: React Client, Express REST API, Socket.IO Gateway, BullMQ Worker.<br/>• Highlight the **Authoritative Monotonic Server** sync model.                                                                    |
| **0:45 - 1:45** | **Live Multi-User Collaborative Canvas**    | • Show 2 browser windows side-by-side on `/board/demo-room`.<br/>• Draw shapes, resize, and edit text on Client A -> observe sub-30ms real-time propagation on Client B.<br/>• Showcase real-time presence cursors and selection state.<br/>• Demonstrate optimistic local updates with zero divergence. |
| **1:45 - 2:30** | **Persistence, Compaction & Observability** | • Show MongoDB oplog growth and automated BullMQ snapshot compaction job.<br/>• Refresh Client B -> demonstrate instant snapshot hydration ($<50\text{ms}$).<br/>• Open Grafana dashboard (`localhost:3000`) & Prometheus metrics (`/metrics`).                                                          |
| **2:30 - 3:00** | **Tradeoff Defense & Future Roadmap**       | • Explain **CRDT vs Authoritative Server** decision: Why LWW with monotonic `seq` is superior for 2D spatial canvas elements over CRDT state vector overhead.<br/>• Mention horizontal scaling path via `@socket.io/redis-adapter`.                                                                      |

---

## 🎙️ Spoken Video Script (Word-for-Word Guide)

### Segment 1: Introduction & Architecture (0:00 - 0:45)

> "Hi, I'm presenting **Collaborative Whiteboard**, a full-stack, real-time collaborative canvas engine built in a TypeScript monorepo.
>
> When designing this system, my primary goal was building a defensible, low-latency collaboration engine with zero client state divergence. The system consists of four primary packages: a React client using Zustand and HTML5 Canvas, an Express REST API for JWT authentication and board management, a Socket.IO Gateway that orders all real-time drawing operations, and an asynchronous BullMQ worker for background snapshot compaction.
>
> Rather than making premature distributed claims, I chose an **Authoritative Monotonic Server** model where the socket server assigns a strict sequence number (`seq`) to every operation."

### Segment 2: Live Multi-User Collaboration Demo (0:45 - 1:45)

> "Let's see it in action. I have two browser sessions open side-by-side connected to the same board room.
>
> As I draw a rectangle in Window A, the local client applies an optimistic update instantly for sub-10ms UI feedback. Simultaneously, the operation is transmitted over WebSockets, validated by the Socket server, assigned sequence number 104, persisted to MongoDB, and broadcast to Window B — arriving in under 30 milliseconds.
>
> You can also see live presence tracking: Window A's cursor location and active tool selection are rendered smoothly in Window B without causing full canvas re-renders. If both users move the same element concurrently, the server's sequence order resolves the conflict deterministically using Last-Accepted-Wins."

### Segment 3: Snapshot Compaction & Observability (1:45 - 2:30)

> "To prevent room join latencies from degrading over time as thousands of edits occur, the system uses an out-of-band snapshot compaction pipeline.
>
> When the operation count exceeds our threshold, the Socket gateway enqueues a job to BullMQ. The background worker acquires a Redis distributed lock, fetches historical oplogs, merges element changes into a consolidated snapshot, and prunes old logs. When a new user opens the board, the server loads the base snapshot plus only recent uncompacted ops, hydrating the canvas in under 50 milliseconds.
>
> The entire system is instrumented with Prometheus metrics, Pino structured logging, and Jaeger distributed tracing, accessible via Grafana."

### Segment 4: System Tradeoffs & Engineering Defense (2:30 - 3:00)

> "Finally, let's address a key design tradeoff: **Why not CRDTs?**
>
> While CRDTs like Yjs or Automerge are great for peer-to-peer text editing, they introduce significant tombstone memory overhead and state vector complexity. For discrete 2D canvas shapes (position, dimensions, color), attribute-level Last-Write-Wins with server sequence numbers achieves identical visual consistency with a fraction of the payload size and zero client drift.
>
> To scale horizontally, the Socket gateway is configured with `@socket.io/redis-adapter`, allowing socket nodes to scale across multiple instances seamlessly. Thank you!"

---

## 🛠️ Step-by-Step Instructions for Live Interview Setup

### Prerequisites

- Node.js 20+, pnpm 9+
- Local MongoDB (`mongodb://localhost:27017`) and Redis (`redis://localhost:6379`) running locally or via Docker:
  ```bash
  docker compose -f infra/docker-compose.yml up -d
  ```

### Step 1: Launch Dev Server

Run the root dev command to start all monorepo services concurrently:

```bash
pnpm dev
```

Expected running services:

- **Client**: `http://localhost:5173`
- **Express API**: `http://localhost:1234`
- **Socket Gateway**: `ws://localhost:3001`
- **Prometheus Metrics**: `http://localhost:1234/metrics`

### Step 2: Open Dual Browser Windows

1. Open Window 1: `http://localhost:5173/board/interview-demo`
2. Open Window 2 (Incognito / Private): `http://localhost:5173/board/interview-demo`
3. Position windows side-by-side (50% screen width each).

### Step 3: Perform Live Demo Actions

1. **Draw & Move**: Select the Rectangle tool in Window 1 and draw a shape. Verify immediate appearance in Window 2.
2. **Presence Cursor**: Move mouse in Window 1 -> verify smooth cursor pill indicator with user name moving in Window 2.
3. **Sticky Note / Text**: Add a sticky note with text in Window 2 -> verify real-time text rendering in Window 1.
4. **Inspect Metrics**: Open `http://localhost:1234/metrics` in a new tab -> show `socket_ops_processed_total` and `snapshots_compacted_total` counters.
