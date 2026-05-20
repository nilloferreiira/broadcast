# Broadcast

Multi-tenant SaaS for bulk message dispatching. Each user has isolated connections, contacts, and messages. Message sending is simulated — no real delivery happens. Scheduling is real: a Firebase Function automatically updates message status at the scheduled time.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | Material UI + Tailwind CSS |
| Forms | React Hook Form + Zod |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Backend | Firebase Functions v2 (scheduler only) |
| Deploy | Firebase Hosting |

---

## Prerequisites

- Node.js v24
- pnpm — `npm install -g pnpm`
- Firebase CLI — `npm install -g firebase-tools`
- Java (required by Firebase emulators)

---

## Setup

```bash
# Install web dependencies
cd web && pnpm install

# Install functions dependencies
cd ../functions && pnpm install
```

### Environment variables

Create `web/.env.local`:

```env
VITE_USE_EMULATOR=true
```

When set to `true`, the app connects to the local Firebase Emulator Suite instead of production:

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |

Omit the variable (or set to `false`) to connect to the real Firebase project.

---

## Running locally

Start both processes in separate terminals:

```bash
# Terminal 1 — Firebase emulators
firebase emulators:start

# Terminal 2 — Vite dev server
cd web && pnpm dev
```

- App: http://localhost:5173
- Emulator UI: http://localhost:4000

---

## Live

http://broadcast-a94cc.web.app/
