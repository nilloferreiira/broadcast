# Broadcast — Full Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Broadcast SaaS from the current "Hello World" scaffold to a fully functional multi-tenant message scheduling platform.

**Architecture:** 5 micro-PRs as independent vertical slices — each mergeable and deployable on its own. Each adds one feature layer: foundation → auth → connections → contacts → messages. All Firestore access enforces `userId` isolation both in queries and security rules.

**Tech Stack:** React 19 + TypeScript, Firebase 12 (Auth + Firestore), Material UI 9, Tailwind CSS 4, React Hook Form 7 + Zod 4, React Router 7, Vitest + React Testing Library

**Current state:** App.tsx is "Hello World". Firebase configured, scheduler running, security rules deployed, all deps installed except `@hookform/resolvers` and `@mui/icons-material`.

---

## PR 1: feat/foundation

**Branch:** `feat/foundation` | **Base:** `main`

Adds test infrastructure, TypeScript entity types, Zod schemas, useAuth hook, PrivateRoute, and routing skeleton.

### Files to create
- `web/vitest.config.ts`
- `web/src/tests/setup.ts`
- `web/src/types/index.ts`
- `web/src/schemas/auth.schema.ts`
- `web/src/schemas/connection.schema.ts`
- `web/src/schemas/contact.schema.ts`
- `web/src/schemas/message.schema.ts`
- `web/src/hooks/useAuth.ts`
- `web/src/components/PrivateRoute.tsx`
- `web/src/tests/schemas/auth.schema.test.ts`
- `web/src/tests/schemas/connection.schema.test.ts`
- `web/src/tests/schemas/contact.schema.test.ts`
- `web/src/tests/schemas/message.schema.test.ts`
- `web/src/tests/hooks/useAuth.test.ts`

### Files to modify
- `web/package.json` — add test scripts + install deps
- `web/src/App.tsx` — routing skeleton

---

### Task 1: Install deps + Vitest setup

- [ ] **Step 1: Install test dependencies and missing packages**

```bash
cd web && pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom && pnpm add @hookform/resolvers @mui/icons-material
```

- [ ] **Step 2: Create vitest config**

```ts
// web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: Create test setup**

```ts
// web/src/tests/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to `web/package.json`**

Under `"scripts"`, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Verify vitest runs (no tests yet is OK)**

```bash
cd web && pnpm test:run
```
Expected: exits 0 or "no test files found"

- [ ] **Step 6: Commit**

```bash
git add web/vitest.config.ts web/src/tests/setup.ts web/package.json web/pnpm-lock.yaml
git commit -m "chore: add vitest, RTL, hookform/resolvers, mui/icons-material"
```

---

### Task 2: Entity types

- [ ] **Step 1: Write types file**

```ts
// web/src/types/index.ts
import type { Timestamp } from 'firebase/firestore'

export type MessageStatus = 'agendado' | 'enviado'

export interface Connection {
  id: string
  userId: string
  name: string
  createdAt: Timestamp
}

export interface Contact {
  id: string
  userId: string
  connectionId: string
  name: string
  phone: string
  createdAt: Timestamp
}

export interface Message {
  id: string
  userId: string
  connectionId: string
  contactIds: string[]
  body: string
  status: MessageStatus
  sendAt: Timestamp
  createdAt: Timestamp
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/types/index.ts
git commit -m "feat: add TypeScript entity interfaces"
```

---

### Task 3: Zod schemas + tests

- [ ] **Step 1: Write failing auth schema tests**

```ts
// web/src/tests/schemas/auth.schema.test.ts
import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../../schemas/auth.schema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '123456' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-email', password: '123456' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('email')
  })
  it('rejects password < 6 chars', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '12345' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('password')
  })
})

describe('registerSchema', () => {
  it('rejects mismatched passwords', () => {
    const r = registerSchema.safeParse({ email: 'a@b.com', password: '123456', confirmPassword: 'other' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('confirmPassword')
  })
  it('accepts matching passwords', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '123456', confirmPassword: '123456' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/schemas/auth.schema.test.ts
```
Expected: FAIL "Cannot find module '../../schemas/auth.schema'"

- [ ] **Step 3: Write auth schema**

```ts
// web/src/schemas/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
)

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/schemas/auth.schema.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 5: Write failing connection schema tests**

```ts
// web/src/tests/schemas/connection.schema.test.ts
import { describe, it, expect } from 'vitest'
import { connectionSchema } from '../../schemas/connection.schema'

describe('connectionSchema', () => {
  it('accepts valid name', () => {
    expect(connectionSchema.safeParse({ name: 'WhatsApp' }).success).toBe(true)
  })
  it('rejects empty name', () => {
    const r = connectionSchema.safeParse({ name: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('name')
  })
  it('rejects name > 50 chars', () => {
    expect(connectionSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false)
  })
})
```

- [ ] **Step 6: Write connection schema**

```ts
// web/src/schemas/connection.schema.ts
import { z } from 'zod'

export const connectionSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
})

export type ConnectionForm = z.infer<typeof connectionSchema>
```

- [ ] **Step 7: Write failing contact schema tests**

```ts
// web/src/tests/schemas/contact.schema.test.ts
import { describe, it, expect } from 'vitest'
import { contactSchema } from '../../schemas/contact.schema'

describe('contactSchema', () => {
  it('accepts valid contact', () => {
    expect(contactSchema.safeParse({ name: 'João', phone: '(11) 99999-9999' }).success).toBe(true)
  })
  it('rejects empty name', () => {
    const r = contactSchema.safeParse({ name: '', phone: '11999999999' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('name')
  })
  it('rejects phone < 8 chars', () => {
    const r = contactSchema.safeParse({ name: 'João', phone: '1234567' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('phone')
  })
  it('rejects phone with letters', () => {
    expect(contactSchema.safeParse({ name: 'João', phone: 'abc12345' }).success).toBe(false)
  })
})
```

- [ ] **Step 8: Write contact schema**

```ts
// web/src/schemas/contact.schema.ts
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  phone: z
    .string()
    .min(8, 'Telefone inválido')
    .regex(/^[\d\s()+-]+$/, 'Formato inválido'),
})

export type ContactForm = z.infer<typeof contactSchema>
```

- [ ] **Step 9: Write failing message schema tests**

```ts
// web/src/tests/schemas/message.schema.test.ts
import { describe, it, expect } from 'vitest'
import { messageSchema } from '../../schemas/message.schema'

const future = new Date(Date.now() + 3_600_000)
const past = new Date(Date.now() - 3_600_000)

describe('messageSchema', () => {
  it('accepts immediate with past date', () => {
    expect(messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'immediate', sendAt: past }).success).toBe(true)
  })
  it('accepts scheduled with future date', () => {
    expect(messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'scheduled', sendAt: future }).success).toBe(true)
  })
  it('rejects scheduled with past date', () => {
    const r = messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'scheduled', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('sendAt')
  })
  it('rejects empty contactIds', () => {
    const r = messageSchema.safeParse({ body: 'Hi', contactIds: [], scheduleType: 'immediate', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('contactIds')
  })
  it('rejects empty body', () => {
    const r = messageSchema.safeParse({ body: '', contactIds: ['id1'], scheduleType: 'immediate', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('body')
  })
})
```

- [ ] **Step 10: Write message schema**

```ts
// web/src/schemas/message.schema.ts
import { z } from 'zod'

export const messageSchema = z.object({
  body: z.string().min(1, 'Mensagem obrigatória'),
  contactIds: z.array(z.string()).min(1, 'Selecione ao menos um contato'),
  scheduleType: z.enum(['immediate', 'scheduled']),
  sendAt: z.date({ required_error: 'Horário obrigatório' }),
}).refine(
  (data) => data.scheduleType === 'immediate' || data.sendAt > new Date(),
  { message: 'Horário agendado deve ser no futuro', path: ['sendAt'] }
)

export type MessageForm = z.infer<typeof messageSchema>
```

- [ ] **Step 11: Run all schema tests — verify PASS**

```bash
cd web && pnpm test:run src/tests/schemas/
```
Expected: PASS (14 tests)

- [ ] **Step 12: Commit**

```bash
git add web/src/schemas/ web/src/tests/schemas/
git commit -m "feat: add Zod schemas with tests for all 4 form types"
```

---

### Task 4: useAuth hook + test

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
  it('resolves to loading=false, user=null when not logged in', async () => {
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

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/hooks/useAuth.test.ts
```
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useAuth.ts web/src/tests/hooks/useAuth.test.ts
git commit -m "feat: add useAuth hook"
```

---

### Task 5: PrivateRoute + routing skeleton

- [ ] **Step 1: Write PrivateRoute**

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

- [ ] **Step 2: Update App.tsx with routing skeleton**

```tsx
// web/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<div>Login (coming soon)</div>} />
      <Route element={<PrivateRoute />}>
        <Route path="/connections" element={<div>Connections (coming soon)</div>} />
        <Route path="/connections/:connectionId/contacts" element={<div>Contacts (coming soon)</div>} />
        <Route path="/connections/:connectionId/messages" element={<div>Messages (coming soon)</div>} />
      </Route>
      <Route path="/" element={<Navigate to="/connections" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App
```

- [ ] **Step 3: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (15 tests total)

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PrivateRoute.tsx web/src/App.tsx
git commit -m "feat: add PrivateRoute and routing skeleton"
```

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin feat/foundation
gh pr create --title "feat: foundation — types, schemas, useAuth, routing" --body "$(cat <<'EOF'
## Summary
- Vitest + RTL test infrastructure (15 schema + auth tests passing)
- TypeScript entity interfaces (Connection, Contact, Message)
- Zod schemas for all 4 form types with full test coverage
- useAuth hook wrapping onAuthStateChanged
- PrivateRoute guard redirecting unauthenticated users to /login
- React Router skeleton with placeholders for all routes

## Test plan
- [ ] `cd web && pnpm test:run` — 15 tests pass
EOF
)"
```

---

## PR 2: feat/auth

**Branch:** `feat/auth` | **Base:** `feat/foundation`

Adds Login/Register pages, AppLayout with logout.

### Files to create
- `web/src/components/auth/LoginForm.tsx`
- `web/src/components/auth/RegisterForm.tsx`
- `web/src/pages/LoginPage.tsx`
- `web/src/components/layout/AppLayout.tsx`
- `web/src/tests/components/auth/LoginForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — wire real pages + AppLayout

---

### Task 1: LoginForm + test

- [ ] **Step 1: Write failing test**

```tsx
// web/src/tests/components/auth/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../../components/auth/LoginForm'

describe('LoginForm', () => {
  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/senha/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: 'user@test.com', password: '123456' }))
  })
  it('shows inline error for invalid email', async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'not-email')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/components/auth/LoginForm.test.tsx
```

- [ ] **Step 3: Write LoginForm**

```tsx
// web/src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { loginSchema, type LoginForm as Values } from '../../schemas/auth.schema'

interface Props { onSubmit: (data: Values) => Promise<void> }

export const LoginForm = ({ onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(loginSchema),
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField label="E-mail" inputProps={{ 'aria-label': 'E-mail' }}
          {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Senha" type="password" inputProps={{ 'aria-label': 'Senha' }}
          {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/components/auth/LoginForm.test.tsx
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/auth/LoginForm.tsx web/src/tests/components/auth/LoginForm.test.tsx
git commit -m "feat: add LoginForm with RHF + Zod and inline validation"
```

---

### Task 2: RegisterForm

- [ ] **Step 1: Write RegisterForm**

```tsx
// web/src/components/auth/RegisterForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { registerSchema, type RegisterForm as Values } from '../../schemas/auth.schema'

interface Props { onSubmit: (data: Values) => Promise<void> }

export const RegisterForm = ({ onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(registerSchema),
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField label="E-mail" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Senha" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <TextField label="Confirmar Senha" type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/auth/RegisterForm.tsx
git commit -m "feat: add RegisterForm with confirmPassword validation"
```

---

### Task 3: LoginPage

- [ ] **Step 1: Write LoginPage**

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
git commit -m "feat: add LoginPage with login/register tabs and Firebase Auth"
```

---

### Task 4: AppLayout + wire App.tsx

- [ ] **Step 1: Write AppLayout**

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

- [ ] **Step 2: Update App.tsx**

```tsx
// web/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/connections" element={<div>Connections (coming soon)</div>} />
          <Route path="/connections/:connectionId/contacts" element={<div>Contacts (coming soon)</div>} />
          <Route path="/connections/:connectionId/messages" element={<div>Messages (coming soon)</div>} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/connections" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App
```

- [ ] **Step 3: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (17 tests)

- [ ] **Step 4: Commit + PR**

```bash
git add web/src/components/layout/AppLayout.tsx web/src/App.tsx
git commit -m "feat: add AppLayout with logout and wire auth into routes"
git push -u origin feat/auth
gh pr create --title "feat: auth — login, register, protected routes, logout" --body "$(cat <<'EOF'
## Summary
- LoginForm + RegisterForm: RHF + Zod, inline validation errors
- LoginPage: tabbed login/register, Firebase Auth, error alert
- AppLayout: AppBar with logout button wrapping all private routes
- Routes wired: unauthenticated → /login, authenticated → /connections

## Test plan
- [ ] `cd web && pnpm test:run` — 17 tests pass
- [ ] Not logged in → redirects to /login
- [ ] Register → goes to /connections placeholder
- [ ] Logout → back to /login
EOF
)"
```

---

## PR 3: feat/connections

**Branch:** `feat/connections` | **Base:** `feat/auth`

Adds Connections CRUD with real-time updates.

### Files to create
- `web/src/services/connections.ts`
- `web/src/hooks/useConnections.ts`
- `web/src/components/connections/ConnectionForm.tsx`
- `web/src/components/connections/ConnectionCard.tsx`
- `web/src/pages/ConnectionsPage.tsx`
- `web/src/tests/services/connections.test.ts`
- `web/src/tests/components/connections/ConnectionForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace connections placeholder

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
const mockGetDocs = vi.fn().mockResolvedValue({ docs: [] })

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
  it('deletes connection + cascades contacts and messages', async () => {
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

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/services/connections.test.ts
```
Expected: PASS (3 tests)

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

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/useConnections.ts
git commit -m "feat: add useConnections real-time hook"
```

---

### Task 3: ConnectionForm + test

- [ ] **Step 1: Write failing test**

```tsx
// web/src/tests/components/connections/ConnectionForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionForm } from '../../../components/connections/ConnectionForm'

describe('ConnectionForm', () => {
  it('calls onSubmit with name', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ConnectionForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/nome/i), 'WhatsApp')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'WhatsApp' }))
  })
  it('shows error for empty name', async () => {
    render(<ConnectionForm onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument())
  })
  it('pre-fills defaultValues when editing', () => {
    render(<ConnectionForm onSubmit={vi.fn()} defaultValues={{ name: 'Old Name' }} />)
    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/components/connections/ConnectionForm.test.tsx
```

- [ ] **Step 3: Write ConnectionForm**

```tsx
// web/src/components/connections/ConnectionForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { connectionSchema, type ConnectionForm as Values } from '../../schemas/connection.schema'

interface Props { defaultValues?: Values; onSubmit: (data: Values) => Promise<void> }

export const ConnectionForm = ({ defaultValues, onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(connectionSchema),
    defaultValues: defaultValues ?? { name: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField label="Nome" inputProps={{ 'aria-label': 'Nome' }}
          {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/components/connections/ConnectionForm.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/connections/ConnectionForm.tsx web/src/tests/components/connections/ConnectionForm.test.tsx
git commit -m "feat: add ConnectionForm with edit support"
```

---

### Task 4: ConnectionCard + ConnectionsPage + wire

- [ ] **Step 1: Write ConnectionCard**

```tsx
// web/src/components/connections/ConnectionCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ConnectionForm } from './ConnectionForm'
import type { Connection } from '../../types'
import type { ConnectionForm as Values } from '../../schemas/connection.schema'

interface Props { connection: Connection; onEdit: (data: Values) => Promise<void>; onDelete: () => Promise<void> }

export const ConnectionCard = ({ connection, onEdit, onDelete }: Props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">{connection.name}</Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => navigate(`/connections/${connection.id}/contacts`)}>Contatos</Button>
          <Button size="small" onClick={() => navigate(`/connections/${connection.id}/messages`)}>Mensagens</Button>
          <Box className="flex-1" />
          <IconButton size="small" onClick={() => setEditOpen(true)} aria-label="Editar"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteOpen(true)} aria-label="Excluir"><DeleteIcon fontSize="small" /></IconButton>
        </CardActions>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <DialogTitle>Editar conexão</DialogTitle>
        <DialogContent><Box className="pt-2">
          <ConnectionForm defaultValues={{ name: connection.name }} onSubmit={async (d) => { await onEdit(d); setEditOpen(false) }} />
        </Box></DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir conexão?</DialogTitle>
        <DialogContent><Typography>Isso também excluirá todos os contatos e mensagens desta conexão.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={async () => { await onDelete(); setDeleteOpen(false) }}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Write ConnectionsPage**

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

- [ ] **Step 3: Update App.tsx — replace connections placeholder**

In `web/src/App.tsx`, add import and replace:
```tsx
import { ConnectionsPage } from './pages/ConnectionsPage'
// replace: <Route path="/connections" element={<div>Connections (coming soon)</div>} />
// with:
<Route path="/connections" element={<ConnectionsPage />} />
```

- [ ] **Step 4: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (all previous + 6 new = 23 tests)

- [ ] **Step 5: Commit + PR**

```bash
git add web/src/components/connections/ConnectionCard.tsx web/src/pages/ConnectionsPage.tsx web/src/App.tsx
git commit -m "feat: add ConnectionCard, ConnectionsPage, wire /connections route"
git push -u origin feat/connections
gh pr create --title "feat: connections — CRUD with real-time updates" --body "$(cat <<'EOF'
## Summary
- connections service: add, update, deleteConnection (cascades contacts + messages)
- useConnections: real-time onSnapshot filtered by userId
- ConnectionForm: RHF + Zod, edit mode via defaultValues
- ConnectionCard: navigate to contacts/messages, edit/delete dialogs
- ConnectionsPage: orchestrates all above

## Test plan
- [ ] `cd web && pnpm test:run` — 23 tests pass
- [ ] Create connection → appears instantly (real-time)
- [ ] Edit → name updates live
- [ ] Delete → cascades (confirm separately in Firestore console)
EOF
)"
```

---

## PR 4: feat/contacts

**Branch:** `feat/contacts` | **Base:** `feat/connections`

Adds Contacts CRUD per connection.

### Files to create
- `web/src/services/contacts.ts`
- `web/src/hooks/useContacts.ts`
- `web/src/components/contacts/ContactForm.tsx`
- `web/src/components/contacts/ContactCard.tsx`
- `web/src/pages/ContactsPage.tsx`
- `web/src/tests/services/contacts.test.ts`
- `web/src/tests/components/contacts/ContactForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace contacts placeholder

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
  it('calls addDoc with all fields', async () => {
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

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/useContacts.ts
git commit -m "feat: add useContacts real-time hook"
```

---

### Task 3: ContactForm + test

- [ ] **Step 1: Write failing test**

```tsx
// web/src/tests/components/contacts/ContactForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from '../../../components/contacts/ContactForm'

describe('ContactForm', () => {
  it('calls onSubmit with name and phone', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ContactForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/nome/i), 'João')
    await userEvent.type(screen.getByLabelText(/telefone/i), '11999999999')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'João', phone: '11999999999' }))
  })
  it('shows error for invalid phone', async () => {
    render(<ContactForm onSubmit={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nome/i), 'João')
    await userEvent.type(screen.getByLabelText(/telefone/i), 'abc')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(screen.getByText(/formato inválido/i)).toBeInTheDocument())
  })
  it('pre-fills defaultValues', () => {
    render(<ContactForm onSubmit={vi.fn()} defaultValues={{ name: 'Maria', phone: '11888' }} />)
    expect(screen.getByDisplayValue('Maria')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/components/contacts/ContactForm.test.tsx
```

- [ ] **Step 3: Write ContactForm**

```tsx
// web/src/components/contacts/ContactForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { contactSchema, type ContactForm as Values } from '../../schemas/contact.schema'

interface Props { defaultValues?: Values; onSubmit: (data: Values) => Promise<void> }

export const ContactForm = ({ defaultValues, onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultValues ?? { name: '', phone: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <TextField label="Nome" inputProps={{ 'aria-label': 'Nome' }}
          {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth />
        <TextField label="Telefone" inputProps={{ 'aria-label': 'Telefone' }}
          {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 4: Run — verify PASS (3 tests)**

```bash
cd web && pnpm test:run src/tests/components/contacts/ContactForm.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/contacts/ContactForm.tsx web/src/tests/components/contacts/ContactForm.test.tsx
git commit -m "feat: add ContactForm with inline validation"
```

---

### Task 4: ContactCard + ContactsPage + wire

- [ ] **Step 1: Write ContactCard**

```tsx
// web/src/components/contacts/ContactCard.tsx
import { useState } from 'react'
import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ContactForm } from './ContactForm'
import type { Contact } from '../../types'
import type { ContactForm as Values } from '../../schemas/contact.schema'

interface Props { contact: Contact; onEdit: (data: Values) => Promise<void>; onDelete: () => Promise<void> }

export const ContactCard = ({ contact, onEdit, onDelete }: Props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1">{contact.name}</Typography>
          <Typography variant="body2" color="text.secondary">{contact.phone}</Typography>
        </CardContent>
        <CardActions>
          <Box className="flex-1" />
          <IconButton size="small" onClick={() => setEditOpen(true)} aria-label="Editar"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteOpen(true)} aria-label="Excluir"><DeleteIcon fontSize="small" /></IconButton>
        </CardActions>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <DialogTitle>Editar contato</DialogTitle>
        <DialogContent><Box className="pt-2">
          <ContactForm defaultValues={{ name: contact.name, phone: contact.phone }}
            onSubmit={async (d) => { await onEdit(d); setEditOpen(false) }} />
        </Box></DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir contato?</DialogTitle>
        <DialogContent><Typography>Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={async () => { await onDelete(); setDeleteOpen(false) }}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Write ContactsPage**

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

- [ ] **Step 3: Update App.tsx — replace contacts placeholder**

In `web/src/App.tsx`, add import and replace:
```tsx
import { ContactsPage } from './pages/ContactsPage'
// replace: <Route path="/connections/:connectionId/contacts" element={<div>Contacts (coming soon)</div>} />
// with:
<Route path="/connections/:connectionId/contacts" element={<ContactsPage />} />
```

- [ ] **Step 4: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (29 tests)

- [ ] **Step 5: Commit + PR**

```bash
git add web/src/services/contacts.ts web/src/hooks/useContacts.ts web/src/components/contacts/ web/src/pages/ContactsPage.tsx web/src/App.tsx
git commit -m "feat: add ContactCard, ContactsPage, wire /contacts route"
git push -u origin feat/contacts
gh pr create --title "feat: contacts — CRUD per connection" --body "$(cat <<'EOF'
## Summary
- contacts service: addContact, updateContact, deleteContact
- useContacts: real-time onSnapshot filtered by userId + connectionId
- ContactForm: RHF + Zod, edit mode via defaultValues
- ContactCard: name + phone, edit/delete dialogs
- ContactsPage: /connections/:connectionId/contacts

## Test plan
- [ ] `cd web && pnpm test:run` — 29 tests pass
- [ ] Navigate connection → Contacts → CRUD works, updates in real-time
EOF
)"
```

---

## PR 5: feat/messages

**Branch:** `feat/messages` | **Base:** `feat/contacts`

Adds Messages CRUD — multi-contact selection, immediate/scheduled send, status filter, auto-update via scheduler.

### Files to create
- `web/src/services/messages.ts`
- `web/src/hooks/useMessages.ts`
- `web/src/components/messages/StatusFilter.tsx`
- `web/src/components/messages/MessageForm.tsx`
- `web/src/components/messages/MessageCard.tsx`
- `web/src/pages/MessagesPage.tsx`
- `web/src/tests/services/messages.test.ts`
- `web/src/tests/components/messages/MessageForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace messages placeholder

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
  it('saves as enviado when sendAt is past', async () => {
    await addMessage('u1', 'c1', ['contact1'], 'Hi', new Date(Date.now() - 1000))
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', expect.objectContaining({ status: 'enviado' }))
  })
  it('saves as agendado when sendAt is future', async () => {
    await addMessage('u1', 'c1', ['contact1'], 'Hi', new Date(Date.now() + 60000))
    expect(mockAddDoc).toHaveBeenCalledWith('col-ref', expect.objectContaining({ status: 'agendado' }))
  })
})

describe('updateMessage', () => {
  it('recalculates status from new sendAt', async () => {
    await updateMessage('m1', 'body', ['c1'], new Date(Date.now() - 1000))
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

### Task 2: useMessages hook + StatusFilter

- [ ] **Step 1: Write useMessages hook**

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

- [ ] **Step 2: Write StatusFilter**

```tsx
// web/src/components/messages/StatusFilter.tsx
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { MessageStatus } from '../../types'

type Filter = MessageStatus | 'all'
interface Props { value: Filter; onChange: (v: Filter) => void }

export const StatusFilter = ({ value, onChange }: Props) => (
  <ToggleButtonGroup value={value} exclusive onChange={(_, v) => { if (v !== null) onChange(v) }} size="small">
    <ToggleButton value="all">Todas</ToggleButton>
    <ToggleButton value="agendado">Agendado</ToggleButton>
    <ToggleButton value="enviado">Enviado</ToggleButton>
  </ToggleButtonGroup>
)
```

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/useMessages.ts web/src/components/messages/StatusFilter.tsx
git commit -m "feat: add useMessages hook and StatusFilter component"
```

---

### Task 3: MessageForm + test

- [ ] **Step 1: Write failing test**

```tsx
// web/src/tests/components/messages/MessageForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageForm } from '../../../components/messages/MessageForm'
import type { Contact } from '../../../types'

const mockContacts: Contact[] = [
  { id: 'c1', userId: 'u1', connectionId: 'conn1', name: 'João', phone: '11999', createdAt: {} as never },
  { id: 'c2', userId: 'u1', connectionId: 'conn1', name: 'Maria', phone: '11888', createdAt: {} as never },
]

describe('MessageForm', () => {
  it('shows error when no contact selected', async () => {
    render(<MessageForm contacts={mockContacts} onSubmit={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/mensagem/i), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(screen.getByText(/selecione ao menos um contato/i)).toBeInTheDocument())
  })
  it('shows error for empty body', async () => {
    render(<MessageForm contacts={mockContacts} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(screen.getByText(/mensagem obrigatória/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
cd web && pnpm test:run src/tests/components/messages/MessageForm.test.tsx
```

- [ ] **Step 3: Write MessageForm**

```tsx
// web/src/components/messages/MessageForm.tsx
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material'
import { messageSchema, type MessageForm as Values } from '../../schemas/message.schema'
import type { Contact } from '../../types'

interface Props { contacts: Contact[]; defaultValues?: Partial<Values>; onSubmit: (data: Values) => Promise<void> }

export const MessageForm = ({ contacts, defaultValues, onSubmit }: Props) => {
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '', contactIds: [], scheduleType: 'immediate', sendAt: new Date(), ...defaultValues },
  })

  const scheduleType = watch('scheduleType')
  const selectedIds = watch('contactIds') ?? []

  useEffect(() => {
    if (scheduleType === 'immediate') setValue('sendAt', new Date())
  }, [scheduleType, setValue])

  const toggleContact = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    setValue('contactIds', next, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <FormControl error={!!errors.contactIds}>
          <FormLabel>Destinatários</FormLabel>
          <FormGroup>
            {contacts.map((c) => (
              <FormControlLabel key={c.id}
                control={<Checkbox checked={selectedIds.includes(c.id)} onChange={() => toggleContact(c.id)} />}
                label={`${c.name} — ${c.phone}`} />
            ))}
          </FormGroup>
          {errors.contactIds && <FormHelperText>{errors.contactIds.message}</FormHelperText>}
        </FormControl>

        <TextField label="Mensagem" inputProps={{ 'aria-label': 'Mensagem' }} multiline rows={3}
          {...register('body')} error={!!errors.body} helperText={errors.body?.message} fullWidth />

        <FormControl>
          <FormLabel>Envio</FormLabel>
          <Controller name="scheduleType" control={control} render={({ field }) => (
            <RadioGroup {...field} row>
              <FormControlLabel value="immediate" control={<Radio />} label="Imediato" />
              <FormControlLabel value="scheduled" control={<Radio />} label="Agendado" />
            </RadioGroup>
          )} />
        </FormControl>

        {scheduleType === 'scheduled' && (
          <Controller name="sendAt" control={control} render={({ field }) => (
            <TextField label="Data e hora" type="datetime-local"
              value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
              onChange={(e) => field.onChange(new Date(e.target.value))}
              error={!!errors.sendAt} helperText={errors.sendAt?.message}
              InputLabelProps={{ shrink: true }} fullWidth />
          )} />
        )}

        {selectedIds.length > 0 && (
          <Typography variant="caption">{selectedIds.length} contato(s) selecionado(s)</Typography>
        )}

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
cd web && pnpm test:run src/tests/components/messages/MessageForm.test.tsx
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/messages/MessageForm.tsx web/src/tests/components/messages/MessageForm.test.tsx
git commit -m "feat: add MessageForm with multi-contact selection and scheduler"
```

---

### Task 4: MessageCard + MessagesPage + wire

- [ ] **Step 1: Write MessageCard**

```tsx
// web/src/components/messages/MessageCard.tsx
import { useState } from 'react'
import { Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { MessageForm } from './MessageForm'
import type { Contact, Message } from '../../types'
import type { MessageForm as Values } from '../../schemas/message.schema'

interface Props { message: Message; contacts: Contact[]; onEdit: (data: Values) => Promise<void>; onDelete: () => Promise<void> }

export const MessageCard = ({ message, contacts, onEdit, onDelete }: Props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const sendAtDate = message.sendAt.toDate()
  const recipientNames = message.contactIds
    .map((id) => contacts.find((c) => c.id === id)?.name ?? id)
    .join(', ')

  const defaultValues: Partial<Values> = {
    body: message.body,
    contactIds: message.contactIds,
    scheduleType: message.status === 'agendado' ? 'scheduled' : 'immediate',
    sendAt: sendAtDate,
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" className="mb-2">
            <Chip label={message.status === 'agendado' ? 'Agendado' : 'Enviado'}
              color={message.status === 'agendado' ? 'warning' : 'success'} size="small" />
            <Typography variant="caption" color="text.secondary">
              {sendAtDate.toLocaleString('pt-BR')}
            </Typography>
          </Stack>
          <Typography variant="body1" className="mb-1">{message.body}</Typography>
          <Typography variant="caption" color="text.secondary">Para: {recipientNames}</Typography>
        </CardContent>
        {message.status === 'agendado' && (
          <CardActions>
            <Box className="flex-1" />
            <IconButton size="small" onClick={() => setEditOpen(true)} aria-label="Editar"><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => setDeleteOpen(true)} aria-label="Excluir"><DeleteIcon fontSize="small" /></IconButton>
          </CardActions>
        )}
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar mensagem</DialogTitle>
        <DialogContent><Box className="pt-2">
          <MessageForm contacts={contacts} defaultValues={defaultValues}
            onSubmit={async (d) => { await onEdit(d); setEditOpen(false) }} />
        </Box></DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir mensagem?</DialogTitle>
        <DialogContent><Typography>Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={async () => { await onDelete(); setDeleteOpen(false) }}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Write MessagesPage**

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

- [ ] **Step 3: Update App.tsx — replace messages placeholder**

In `web/src/App.tsx`, add import and replace:
```tsx
import { MessagesPage } from './pages/MessagesPage'
// replace: <Route path="/connections/:connectionId/messages" element={<div>Messages (coming soon)</div>} />
// with:
<Route path="/connections/:connectionId/messages" element={<MessagesPage />} />
```

- [ ] **Step 4: Run all tests**

```bash
cd web && pnpm test:run
```
Expected: PASS (35 tests)

- [ ] **Step 5: Commit + PR**

```bash
git add web/src/services/messages.ts web/src/hooks/useMessages.ts web/src/components/messages/ web/src/pages/MessagesPage.tsx web/src/App.tsx
git commit -m "feat: add MessagesPage with scheduling, status filter, real-time updates"
git push -u origin feat/messages
gh pr create --title "feat: messages — CRUD, scheduling, status filter, real-time" --body "$(cat <<'EOF'
## Summary
- messages service: status derived from sendAt; delete blocked for enviado
- useMessages: real-time onSnapshot, optional status filter
- MessageForm: checkbox multi-select contacts, immediate/scheduled radio, datetime picker
- MessageCard: status chip, edit/delete only available for agendado messages
- StatusFilter: toggle all/agendado/enviado
- MessagesPage: /connections/:connectionId/messages

## Test plan
- [ ] `cd web && pnpm test:run` — 35 tests pass
- [ ] Send immediate → status "enviado", no edit/delete buttons
- [ ] Schedule message → status "agendado", edit/delete available
- [ ] Wait 1-2 min → scheduler transitions agendado → enviado, UI updates without refresh
- [ ] Status filter works for all 3 options
- [ ] Two users: complete data isolation
EOF
)"
```

---

## Final verification (after all PRs merged to main)

```bash
cd web && pnpm test:run          # 35 tests pass
cd web && pnpm build             # TypeScript clean, no errors
firebase deploy                  # Deploys frontend + functions
```

**Manual smoke test:**
1. Open hosted URL → redirected to `/login`
2. Register new account → lands on `/connections`
3. Create 2 connections
4. Navigate to connection 1 → add 3 contacts
5. Navigate to Messages → send immediate message to 2 contacts → appears as "enviado"
6. Schedule message 1 min in the future → appears as "agendado"
7. Wait 2 min → status flips to "enviado" without refresh (onSnapshot + scheduler)
8. Filter by "agendado" → empty list; filter by "enviado" → both messages
9. Register second account → no data visible from first account (isolation)
10. Logout → redirected to `/login`
