# Broadcast — Firebase Data Layer Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Firebase services and real-time hooks that back the Broadcast UI. This spec creates only new files — no pages are touched until the merge phase. The merge phase (PR 5) wires everything into the pages built in `specs/frontend.md`.

**Architecture:** Services are pure write-only functions using the Firestore SDK. Hooks are read-only real-time listeners using `onSnapshot`. `useAuth` wraps `onAuthStateChanged`. All Firestore queries filter by `userId` for multi-tenant isolation. PRs 1–4 create only new files — no conflicts with the frontend workstream.

**Tech Stack:** Firebase 12 (Auth + Firestore), TypeScript, Vitest

**Prerequisite:** Vitest infrastructure from `feat/frontend-foundation` (vitest.config.ts, src/tests/setup.ts, test scripts in package.json) must be merged to `main` before branching off this spec.

---

## PR 1: feat/firebase-auth

**Branch:** `feat/firebase-auth` | **Base:** `main` (after `feat/frontend-foundation` is merged)

Adds the `useAuth` hook.

### Files to create
- `web/src/hooks/useAuth.ts`
- `web/src/tests/hooks/useAuth.test.ts`

---

### Task 1: useAuth hook + test

- [ ] **Step 1: Write failing test**

```ts
// web/src/tests/hooks/useAuth.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => { cb(null); return vi.fn() }),
}))
vi.mock('../../lib/firebase', () => ({ auth: {} }))

describe('useAuth', () => {
  it('resolves to loading=false and user=null when not logged in', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/hooks/useAuth.test.ts
```
Expected: FAIL "Cannot find module '../../hooks/useAuth'"

- [ ] **Step 3: Write useAuth hook**

```ts
// web/src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthState { user: User | null; loading: boolean }

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setState({ user, loading: false }))
  }, [])

  return state
}
```

- [ ] **Step 4: Run — verify PASS (1 test)**

```bash
cd web && pnpm test:run src/tests/hooks/useAuth.test.ts
```

- [ ] **Step 5: Commit + PR**

```bash
git add web/src/hooks/useAuth.ts web/src/tests/hooks/useAuth.test.ts
git commit -m "feat: add useAuth hook wrapping onAuthStateChanged"
git push -u origin feat/firebase-auth
gh pr create --title "feat: firebase auth — useAuth hook" --body "$(cat <<'EOF'
## Summary
- useAuth: wraps onAuthStateChanged, exposes { user, loading }
- 1 test: resolves loading=false + user=null when unauthenticated

## Test plan
- [ ] `cd web && pnpm test:run src/tests/hooks/useAuth.test.ts` — 1 test passes
EOF
)"
```

---

## PR 2: feat/firebase-connections

**Branch:** `feat/firebase-connections` | **Base:** `feat/firebase-auth`

Adds the connections service and real-time hook.

### Files to create
- `web/src/services/connections.ts`
- `web/src/hooks/useConnections.ts`
- `web/src/tests/services/connections.test.ts`

---

### Task 1: connections service + test

- [ ] **Step 1: Write failing tests**

```ts
// web/src/tests/services/connections.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addConnection, updateConnection, deleteConnection } from '../../services/connections'

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' })
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)
const mockGetDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col-ref'),
  doc: vi.fn(() => 'doc-ref'),
  addDoc: (...a: unknown[]) => mockAddDoc(...a),
  updateDoc: (...a: unknown[]) => mockUpdateDoc(...a),
  deleteDoc: (...a: unknown[]) => mockDeleteDoc(...a),
  getDocs: (...a: unknown[]) => mockGetDocs(...a),
  query: vi.fn(() => 'q-ref'),
  where: vi.fn(() => 'where-ref'),
  serverTimestamp: vi.fn(() => 'ts'),
}))
vi.mock('../../lib/firebase', () => ({ db: {} }))

beforeEach(() => { vi.clearAllMocks(); mockGetDocs.mockResolvedValue({ docs: [] }) })

describe('addConnection', () => {
  it('calls addDoc with userId, name, createdAt', async () => {
    await addConnection('user-1', 'WhatsApp')
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', { userId: 'user-1', name: 'WhatsApp', createdAt: 'ts' })
  })
})

describe('updateConnection', () => {
  it('calls updateDoc with new name', async () => {
    await updateConnection('conn-1', 'New Name')
    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', { name: 'New Name' })
  })
})

describe('deleteConnection', () => {
  it('deletes connection and cascades contacts and messages', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [{ ref: 'c-ref' }] })
      .mockResolvedValueOnce({ docs: [{ ref: 'm-ref' }] })
    await deleteConnection('conn-1')
    expect(mockDeleteDoc).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/services/connections.test.ts
```
Expected: FAIL "Cannot find module '../../services/connections'"

- [ ] **Step 3: Write connections service**

```ts
// web/src/services/connections.ts
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const addConnection = (userId: string, name: string) =>
  addDoc(collection(db, 'connections'), { userId, name, createdAt: serverTimestamp() })

export const updateConnection = (id: string, name: string) =>
  updateDoc(doc(db, 'connections', id), { name })

export const deleteConnection = async (connectionId: string) => {
  await deleteDoc(doc(db, 'connections', connectionId))
  const [contactsSnap, messagesSnap] = await Promise.all([
    getDocs(query(collection(db, 'contacts'), where('connectionId', '==', connectionId))),
    getDocs(query(collection(db, 'messages'), where('connectionId', '==', connectionId))),
  ])
  await Promise.all([
    ...contactsSnap.docs.map((d) => deleteDoc(d.ref)),
    ...messagesSnap.docs.map((d) => deleteDoc(d.ref)),
  ])
}
```

- [ ] **Step 4: Run — verify PASS (3 tests)**

```bash
cd web && pnpm test:run src/tests/services/connections.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add web/src/services/connections.ts web/src/tests/services/connections.test.ts
git commit -m "feat: add connections service with cascade delete"
```

---

### Task 2: useConnections hook

- [ ] **Step 1: Write hook**

```ts
// web/src/hooks/useConnections.ts
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Connection } from '../types'

export const useConnections = (userId: string): Connection[] => {
  const [connections, setConnections] = useState<Connection[]>([])
  useEffect(() => {
    const q = query(collection(db, 'connections'), where('userId', '==', userId))
    return onSnapshot(q, (snap) =>
      setConnections(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Connection)))
    )
  }, [userId])
  return connections
}
```

- [ ] **Step 2: Commit + PR**

```bash
git add web/src/hooks/useConnections.ts
git commit -m "feat: add useConnections real-time hook"
git push -u origin feat/firebase-connections
gh pr create --title "feat: firebase connections — service + real-time hook" --body "$(cat <<'EOF'
## Summary
- connections service: addConnection, updateConnection, deleteConnection (cascades contacts + messages)
- useConnections: real-time onSnapshot filtered by userId
- 3 tests: addDoc fields, updateDoc name, cascade delete (3 deleteDoc calls)

## Test plan
- [ ] `cd web && pnpm test:run src/tests/services/connections.test.ts` — 3 tests pass
EOF
)"
```

---

## PR 3: feat/firebase-contacts

**Branch:** `feat/firebase-contacts` | **Base:** `feat/firebase-connections`

Adds the contacts service and real-time hook.

### Files to create
- `web/src/services/contacts.ts`
- `web/src/hooks/useContacts.ts`
- `web/src/tests/services/contacts.test.ts`

---

### Task 1: contacts service + test

- [ ] **Step 1: Write failing tests**

```ts
// web/src/tests/services/contacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addContact, updateContact, deleteContact } from '../../services/contacts'

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' })
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col-ref'),
  doc: vi.fn(() => 'doc-ref'),
  addDoc: (...a: unknown[]) => mockAddDoc(...a),
  updateDoc: (...a: unknown[]) => mockUpdateDoc(...a),
  deleteDoc: (...a: unknown[]) => mockDeleteDoc(...a),
  serverTimestamp: vi.fn(() => 'ts'),
}))
vi.mock('../../lib/firebase', () => ({ db: {} }))
beforeEach(() => vi.clearAllMocks())

describe('addContact', () => {
  it('calls addDoc with all required fields', async () => {
    await addContact('user-1', 'conn-1', 'João', '11999999999')
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', {
      userId: 'user-1', connectionId: 'conn-1', name: 'João', phone: '11999999999', createdAt: 'ts',
    })
  })
})

describe('updateContact', () => {
  it('calls updateDoc with name and phone', async () => {
    await updateContact('c-1', 'Maria', '11888888888')
    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', { name: 'Maria', phone: '11888888888' })
  })
})

describe('deleteContact', () => {
  it('calls deleteDoc', async () => {
    await deleteContact('c-1')
    expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/services/contacts.test.ts
```
Expected: FAIL "Cannot find module '../../services/contacts'"

- [ ] **Step 3: Write contacts service**

```ts
// web/src/services/contacts.ts
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const addContact = (userId: string, connectionId: string, name: string, phone: string) =>
  addDoc(collection(db, 'contacts'), { userId, connectionId, name, phone, createdAt: serverTimestamp() })

export const updateContact = (id: string, name: string, phone: string) =>
  updateDoc(doc(db, 'contacts', id), { name, phone })

export const deleteContact = (id: string) => deleteDoc(doc(db, 'contacts', id))
```

- [ ] **Step 4: Run — verify PASS (3 tests)**

```bash
cd web && pnpm test:run src/tests/services/contacts.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add web/src/services/contacts.ts web/src/tests/services/contacts.test.ts
git commit -m "feat: add contacts service"
```

---

### Task 2: useContacts hook

- [ ] **Step 1: Write hook**

```ts
// web/src/hooks/useContacts.ts
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Contact } from '../types'

export const useContacts = (userId: string, connectionId: string): Contact[] => {
  const [contacts, setContacts] = useState<Contact[]>([])
  useEffect(() => {
    const q = query(
      collection(db, 'contacts'),
      where('userId', '==', userId),
      where('connectionId', '==', connectionId)
    )
    return onSnapshot(q, (snap) =>
      setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact)))
    )
  }, [userId, connectionId])
  return contacts
}
```

- [ ] **Step 2: Commit + PR**

```bash
git add web/src/hooks/useContacts.ts
git commit -m "feat: add useContacts real-time hook"
git push -u origin feat/firebase-contacts
gh pr create --title "feat: firebase contacts — service + real-time hook" --body "$(cat <<'EOF'
## Summary
- contacts service: addContact, updateContact, deleteContact
- useContacts: real-time onSnapshot filtered by userId + connectionId
- 3 tests: addDoc payload, updateDoc fields, deleteDoc called

## Test plan
- [ ] `cd web && pnpm test:run src/tests/services/contacts.test.ts` — 3 tests pass
EOF
)"
```

---

## PR 4: feat/firebase-messages

**Branch:** `feat/firebase-messages` | **Base:** `feat/firebase-contacts`

Adds the messages service and real-time hook.

### Files to create
- `web/src/services/messages.ts`
- `web/src/hooks/useMessages.ts`
- `web/src/tests/services/messages.test.ts`

---

### Task 1: messages service + test

- [ ] **Step 1: Write failing tests**

```ts
// web/src/tests/services/messages.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addMessage, updateMessage, deleteMessage } from '../../services/messages'

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' })
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)
const mockGetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col-ref'),
  doc: vi.fn(() => 'doc-ref'),
  addDoc: (...a: unknown[]) => mockAddDoc(...a),
  updateDoc: (...a: unknown[]) => mockUpdateDoc(...a),
  deleteDoc: (...a: unknown[]) => mockDeleteDoc(...a),
  getDoc: (...a: unknown[]) => mockGetDoc(...a),
  serverTimestamp: vi.fn(() => 'ts'),
  Timestamp: { fromDate: (d: Date) => ({ _date: d }) },
}))
vi.mock('../../lib/firebase', () => ({ db: {} }))
beforeEach(() => vi.clearAllMocks())

describe('addMessage', () => {
  it('saves with status enviado when sendAt is in the past', async () => {
    await addMessage('u1', 'c1', ['contact1'], 'Hi', new Date(Date.now() - 1000))
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', expect.objectContaining({ status: 'enviado' }))
  })
  it('saves with status agendado when sendAt is in the future', async () => {
    await addMessage('u1', 'c1', ['contact1'], 'Hi', new Date(Date.now() + 60000))
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', expect.objectContaining({ status: 'agendado' }))
  })
})

describe('updateMessage', () => {
  it('recalculates status from new sendAt', async () => {
    await updateMessage('m1', 'updated body', ['c1'], new Date(Date.now() - 1000))
    expect(mockUpdateDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({ status: 'enviado' }))
  })
})

describe('deleteMessage', () => {
  it('deletes message with status agendado', async () => {
    mockGetDoc.mockResolvedValue({ data: () => ({ status: 'agendado' }) })
    await deleteMessage('m1')
    expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
  })
  it('does NOT delete message with status enviado', async () => {
    mockGetDoc.mockResolvedValue({ data: () => ({ status: 'enviado' }) })
    await deleteMessage('m1')
    expect(mockDeleteDoc).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/services/messages.test.ts
```
Expected: FAIL "Cannot find module '../../services/messages'"

- [ ] **Step 3: Write messages service**

```ts
// web/src/services/messages.ts
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const addMessage = (userId: string, connectionId: string, contactIds: string[], body: string, sendAt: Date) =>
  addDoc(collection(db, 'messages'), {
    userId, connectionId, contactIds, body,
    status: sendAt <= new Date() ? 'enviado' : 'agendado',
    sendAt: Timestamp.fromDate(sendAt),
    createdAt: serverTimestamp(),
  })

export const updateMessage = (id: string, body: string, contactIds: string[], sendAt: Date) =>
  updateDoc(doc(db, 'messages', id), {
    body, contactIds,
    sendAt: Timestamp.fromDate(sendAt),
    status: sendAt <= new Date() ? 'enviado' : 'agendado',
  })

export const deleteMessage = async (id: string) => {
  const snap = await getDoc(doc(db, 'messages', id))
  if (snap.data()?.status !== 'agendado') return
  return deleteDoc(doc(db, 'messages', id))
}
```

- [ ] **Step 4: Run — verify PASS (4 tests)**

```bash
cd web && pnpm test:run src/tests/services/messages.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add web/src/services/messages.ts web/src/tests/services/messages.test.ts
git commit -m "feat: add messages service with status derivation and guarded delete"
```

---

### Task 2: useMessages hook

- [ ] **Step 1: Write hook**

```ts
// web/src/hooks/useMessages.ts
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Message, MessageStatus } from '../types'

export const useMessages = (userId: string, connectionId: string, statusFilter: MessageStatus | 'all' = 'all'): Message[] => {
  const [messages, setMessages] = useState<Message[]>([])
  useEffect(() => {
    const constraints = [
      where('userId', '==', userId),
      where('connectionId', '==', connectionId),
      ...(statusFilter !== 'all' ? [where('status', '==', statusFilter)] : []),
    ]
    const q = query(collection(db, 'messages'), ...constraints)
    return onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)))
    )
  }, [userId, connectionId, statusFilter])
  return messages
}
```

- [ ] **Step 2: Commit + PR**

```bash
git add web/src/hooks/useMessages.ts
git commit -m "feat: add useMessages real-time hook with optional status filter"
git push -u origin feat/firebase-messages
gh pr create --title "feat: firebase messages — service + real-time hook" --body "$(cat <<'EOF'
## Summary
- messages service: status derived from sendAt at write time; deleteMessage blocked for enviado
- useMessages: real-time onSnapshot, optional Firestore-level status filter (where clause)
- 4 tests: status agendado/enviado on add, status recalc on update, guarded delete x2

## Test plan
- [ ] `cd web && pnpm test:run src/tests/services/messages.test.ts` — 4 tests pass
EOF
)"
```

---

## PR 5 (Merge): feat/merge

**Branch:** `feat/merge` | **Base:** `main`

**Prerequisites:** All 4 firebase PRs (`feat/firebase-auth` → `feat/firebase-messages`) **and** all 5 frontend PRs (`feat/frontend-foundation` → `feat/frontend-messages`) merged to `main` before branching.

Wire the real Firebase hooks and services into the pages. After this PR the app is fully functional.

### Files to modify
- `web/src/components/PrivateRoute.tsx` — add real auth guard
- `web/src/pages/LoginPage.tsx` — wire Firebase Auth
- `web/src/components/layout/AppLayout.tsx` — wire signOut
- `web/src/pages/ConnectionsPage.tsx` — replace local state
- `web/src/pages/ContactsPage.tsx` — replace local state
- `web/src/pages/MessagesPage.tsx` — replace local state + remove mockContacts prop

---

### Task 1: PrivateRoute — add real auth guard

The frontend version is a pass-through `<Outlet />`. Replace it with a real check using `useAuth`.

- [ ] **Step 1: Replace `web/src/components/PrivateRoute.tsx`**

```tsx
// web/src/components/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const PrivateRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/PrivateRoute.tsx
git commit -m "feat(merge): add real auth guard to PrivateRoute"
```

---

### Task 2: LoginPage — wire Firebase Auth

The frontend version navigates on submit without making any Firebase calls. Replace the two handlers and add `setError` state.

- [ ] **Step 1: Replace `web/src/pages/LoginPage.tsx`**

```tsx
// web/src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { Alert, Box, Container, Paper, Tab, Tabs, Typography } from '@mui/material'
import { auth } from '../lib/firebase'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import type { LoginForm as LoginValues } from '../schemas/auth.schema'
import type { RegisterForm as RegisterValues } from '../schemas/auth.schema'

export const LoginPage = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (data: LoginValues) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate('/connections')
    } catch {
      setError('E-mail ou senha incorretos')
    }
  }

  const handleRegister = async (data: RegisterValues) => {
    setError(null)
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password)
      navigate('/connections')
    } catch {
      setError('Não foi possível criar conta. E-mail já em uso?')
    }
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container maxWidth="xs">
        <Paper className="p-8" elevation={2}>
          <Typography variant="h5" className="mb-4 font-bold text-center">Broadcast</Typography>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null) }} centered className="mb-4">
            <Tab label="Entrar" value="login" />
            <Tab label="Criar conta" value="register" />
          </Tabs>
          {error && <Alert severity="error" className="mb-4">{error}</Alert>}
          {tab === 'login' ? <LoginForm onSubmit={handleLogin} /> : <RegisterForm onSubmit={handleRegister} />}
        </Paper>
      </Container>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/LoginPage.tsx
git commit -m "feat(merge): wire Firebase Auth into LoginPage"
```

---

### Task 3: AppLayout — wire real signOut

The frontend version only calls `navigate('/login')`. Replace with `signOut(auth)` before navigating.

- [ ] **Step 1: Replace `web/src/components/layout/AppLayout.tsx`**

```tsx
// web/src/components/layout/AppLayout.tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { auth } from '../../lib/firebase'

export const AppLayout = () => {
  const navigate = useNavigate()
  const handleLogout = async () => { await signOut(auth); navigate('/login') }

  return (
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="flex-1">Broadcast</Typography>
          <Button color="inherit" onClick={handleLogout}>Sair</Button>
        </Toolbar>
      </AppBar>
      <Box component="main" className="p-4"><Outlet /></Box>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/layout/AppLayout.tsx
git commit -m "feat(merge): wire Firebase signOut into AppLayout"
```

---

### Task 4: ConnectionsPage — replace local state with real hook + service

Remove the `useState` mock array and the `mockTs` constant. Replace with `useConnections` + the connections service. `useAuth` provides the real `user.uid`.

- [ ] **Step 1: Replace `web/src/pages/ConnectionsPage.tsx`**

```tsx
// web/src/pages/ConnectionsPage.tsx
import { useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../hooks/useAuth'
import { useConnections } from '../hooks/useConnections'
import { addConnection, updateConnection, deleteConnection } from '../services/connections'
import { ConnectionCard } from '../components/connections/ConnectionCard'
import { ConnectionForm } from '../components/connections/ConnectionForm'
import type { ConnectionForm as Values } from '../schemas/connection.schema'

export const ConnectionsPage = () => {
  const { user } = useAuth()
  const connections = useConnections(user!.uid)
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => { await addConnection(user!.uid, data.name); setAddOpen(false) }

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4">
        <Typography variant="h5" className="flex-1">Conexões</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Nova conexão</Button>
      </Stack>
      <Stack spacing={2}>
        {connections.map((conn) => (
          <ConnectionCard key={conn.id} connection={conn}
            onEdit={(data) => updateConnection(conn.id, data.name)}
            onDelete={() => deleteConnection(conn.id)} />
        ))}
        {connections.length === 0 && <Typography color="text.secondary">Nenhuma conexão. Crie uma!</Typography>}
      </Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
        <DialogTitle>Nova conexão</DialogTitle>
        <DialogContent><Box className="pt-2"><ConnectionForm onSubmit={handleAdd} /></Box></DialogContent>
      </Dialog>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/ConnectionsPage.tsx
git commit -m "feat(merge): wire useConnections + services into ConnectionsPage"
```

---

### Task 5: ContactsPage — replace local state with real hook + service

Remove the `useState` mock array and `mockTs`. Replace with `useContacts` + contacts service.

- [ ] **Step 1: Replace `web/src/pages/ContactsPage.tsx`**

```tsx
// web/src/pages/ContactsPage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../hooks/useAuth'
import { useContacts } from '../hooks/useContacts'
import { addContact, updateContact, deleteContact } from '../services/contacts'
import { ContactCard } from '../components/contacts/ContactCard'
import { ContactForm } from '../components/contacts/ContactForm'
import type { ContactForm as Values } from '../schemas/contact.schema'

export const ContactsPage = () => {
  const { user } = useAuth()
  const { connectionId } = useParams<{ connectionId: string }>()
  const contacts = useContacts(user!.uid, connectionId!)
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => {
    await addContact(user!.uid, connectionId!, data.name, data.phone)
    setAddOpen(false)
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4">
        <Typography variant="h5" className="flex-1">Contatos</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Novo contato</Button>
      </Stack>
      <Stack spacing={2}>
        {contacts.map((c) => (
          <ContactCard key={c.id} contact={c}
            onEdit={(data) => updateContact(c.id, data.name, data.phone)}
            onDelete={() => deleteContact(c.id)} />
        ))}
        {contacts.length === 0 && <Typography color="text.secondary">Nenhum contato. Adicione um!</Typography>}
      </Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
        <DialogTitle>Novo contato</DialogTitle>
        <DialogContent><Box className="pt-2"><ContactForm onSubmit={handleAdd} /></Box></DialogContent>
      </Dialog>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/ContactsPage.tsx
git commit -m "feat(merge): wire useContacts + services into ContactsPage"
```

---

### Task 6: MessagesPage — replace local state, remove mockContacts prop, Firestore filter

Three changes in one page:
1. Remove `mockContacts` prop — replaced by `useContacts(user!.uid, connectionId!)`
2. Remove local `messages` state — replaced by `useMessages(user!.uid, connectionId!, statusFilter)`
3. Remove client-side `filtered` array — `useMessages` passes the status filter directly to the Firestore `where` clause

- [ ] **Step 1: Replace `web/src/pages/MessagesPage.tsx`**

```tsx
// web/src/pages/MessagesPage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../hooks/useAuth'
import { useContacts } from '../hooks/useContacts'
import { useMessages } from '../hooks/useMessages'
import { addMessage, updateMessage, deleteMessage } from '../services/messages'
import { MessageCard } from '../components/messages/MessageCard'
import { MessageForm } from '../components/messages/MessageForm'
import { StatusFilter } from '../components/messages/StatusFilter'
import type { MessageForm as Values } from '../schemas/message.schema'
import type { MessageStatus } from '../types'

export const MessagesPage = () => {
  const { user } = useAuth()
  const { connectionId } = useParams<{ connectionId: string }>()
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const contacts = useContacts(user!.uid, connectionId!)
  const messages = useMessages(user!.uid, connectionId!, statusFilter)

  const handleAdd = async (data: Values) => {
    await addMessage(user!.uid, connectionId!, data.contactIds, data.body, data.sendAt)
    setAddOpen(false)
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4" flexWrap="wrap" gap={2}>
        <Typography variant="h5" className="flex-1">Mensagens</Typography>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Nova mensagem</Button>
      </Stack>
      <Stack spacing={2}>
        {messages.map((msg) => (
          <MessageCard key={msg.id} message={msg} contacts={contacts}
            onEdit={(data) => updateMessage(msg.id, data.body, data.contactIds, data.sendAt)}
            onDelete={() => deleteMessage(msg.id)} />
        ))}
        {messages.length === 0 && <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>}
      </Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova mensagem</DialogTitle>
        <DialogContent><Box className="pt-2"><MessageForm contacts={contacts} onSubmit={handleAdd} /></Box></DialogContent>
      </Dialog>
    </Box>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (35 tests — 24 frontend + 11 firebase)

- [ ] **Step 3: Build check**

```bash
cd web && pnpm build
```
Expected: no TypeScript errors, build succeeds

- [ ] **Step 4: Commit + PR**

```bash
git add web/src/pages/MessagesPage.tsx
git commit -m "feat(merge): wire useMessages + useContacts + services into MessagesPage"
git push -u origin feat/merge
gh pr create --title "feat: merge — wire Firebase layer into all pages" --body "$(cat <<'EOF'
## Summary
- PrivateRoute: real useAuth guard (loading → null, no user → /login)
- LoginPage: signInWithEmailAndPassword + createUserWithEmailAndPassword + error Alert
- AppLayout: real signOut before navigate
- ConnectionsPage: useConnections + addConnection/updateConnection/deleteConnection; local state removed
- ContactsPage: useContacts + addContact/updateContact/deleteContact; local state removed
- MessagesPage: useMessages + useContacts + message services; mockContacts prop removed; client-side array filter replaced by Firestore where clause

## Test plan
- [ ] `cd web && pnpm test:run` — 35 tests pass
- [ ] `cd web && pnpm build` — TypeScript clean
- [ ] Not logged in → redirected to /login
- [ ] Register new account → lands on /connections (empty)
- [ ] Create connection → appears instantly via onSnapshot
- [ ] Add contacts to connection → real-time updates
- [ ] Send immediate message → status "enviado", no edit/delete
- [ ] Schedule message 1 min ahead → status "agendado", edit/delete available
- [ ] Wait ~2 min → scheduler flips status to "enviado" without refresh
- [ ] Status filter: all/agendado/enviado all work
- [ ] Two accounts: complete data isolation
- [ ] Logout → redirected to /login
EOF
)"
```

---

## Final: Deploy

After `feat/merge` is approved and merged to `main`:

```bash
firebase deploy
```

Expected: Firebase Hosting deploys the frontend. The scheduler function is already live from the existing `functions/` setup.
