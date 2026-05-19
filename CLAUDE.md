# Broadcast — CLAUDE.md

## What it is

Multi-tenant SaaS for bulk message dispatching. Each user has their own isolated area of connections, contacts, and messages. Sending is **fake** — no real message is delivered. Scheduling is real: a Firebase Function automatically updates the status at the scheduled time.

---

## Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Frontend      | React + TypeScript + Vite                            |
| UI Components | Material UI                                          |
| Styling       | Tailwind CSS                                         |
| Forms         | React Hook Form + Zod                                |
| Auth          | Firebase Authentication (email + password)           |
| Database      | Cloud Firestore (real-time)                          |
| Backend       | Firebase Functions v2 (scheduler only — no REST API) |
| Deploy        | Firebase Hosting                                     |

---

## Project structure

```
broadcast/
├── functions/             # Firebase Cloud Functions
│   └── src/index.ts       # processScheduledMessages — only backend file
└── web/                   # React frontend
    └── src/
        ├── lib/           # Firebase initialization
        ├── types/         # Firestore entity interfaces
        ├── schemas/       # Zod schemas for form validation
        ├── hooks/         # Firestore real-time listeners (onSnapshot)
        ├── services/      # Pure write functions (addDoc, updateDoc, deleteDoc)
        ├── pages/         # Route-level components
        └── components/    # Reusable UI components
```

---

## Data model

All collections are at the Firestore root — no subcollections. Multi-tenant isolation is enforced via `userId` on every document.

```ts
Connection { id, userId, name, createdAt }
Contact    { id, userId, connectionId, name, phone, createdAt }
Message    { id, userId, connectionId, contactIds[], body, status, sendAt, createdAt }

type MessageStatus = "agendado" | "enviado"
```

---

## Architecture rules

- **Functional only** — no classes, no OOP, no `this`
- **Forms** — all forms use React Hook Form + Zod; no `useState` for field control
- **Hooks** — read-only, real-time via `onSnapshot`; never write to Firestore
- **Services** — write-only pure functions; no state, no listeners
- **Pages** — orchestrate hooks + services; pass handlers and `defaultValues` down to components
- **Components** — receive data via props, emit callbacks; never access Firestore directly

---

## Key behaviors

- Every Firestore query filters by `where("userId", "==", user.uid)` — users never see each other's data
- Deleting a connection cascades to its contacts and messages (handled in the service)
- Message `status` is derived at write time from `sendAt` — the component never sets it manually
- The scheduler (`every 1 minutes`) queries `status == "agendado" AND sendAt <= now()` and bulk-updates to `"enviado"` via `Promise.all`
- UI reflects scheduler changes automatically via `onSnapshot` — no refresh **needed**

---

# Links

[[Desafio broadcast]]
