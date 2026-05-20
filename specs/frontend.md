# Broadcast — Frontend Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all React UI components and pages independently from Firebase. Pages use local `useState` for visual testing. Firebase integration is added in the merge phase (`specs/firebase.md`).

**Architecture:** Components receive data via props and emit callbacks — no Firebase imports. Pages hold local mock state. `PrivateRoute` always renders children during this phase (no real auth check). Merge phase wires real hooks/services into the pages.

**Tech Stack:** React 19 + TypeScript, Material UI 9, Tailwind CSS 4, React Hook Form 7 + Zod 4, React Router 7, Vitest + React Testing Library

**Note on Timestamp:** `Timestamp` is imported as a type from `firebase/firestore` (type-only, no initialization required). Mock data in pages uses `{ toDate: () => new Date() } as unknown as Timestamp`.

---

## PR 1: feat/frontend-foundation

**Branch:** `feat/frontend-foundation` | **Base:** `main`

Adds test infrastructure, TypeScript entity types, Zod schemas, and routing skeleton.

### Files to create
- `web/vitest.config.ts`
- `web/src/tests/setup.ts`
- `web/src/types/index.ts`
- `web/src/schemas/auth.schema.ts`
- `web/src/schemas/connection.schema.ts`
- `web/src/schemas/contact.schema.ts`
- `web/src/schemas/message.schema.ts`
- `web/src/components/PrivateRoute.tsx`
- `web/src/tests/schemas/auth.schema.test.ts`
- `web/src/tests/schemas/connection.schema.test.ts`
- `web/src/tests/schemas/contact.schema.test.ts`
- `web/src/tests/schemas/message.schema.test.ts`

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

- [ ] **Step 5: Verify vitest runs**

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

- [ ] **Commit**

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

- [ ] **Step 4: Run — verify PASS (5 tests)**

```bash
cd web && pnpm test:run src/tests/schemas/auth.schema.test.ts
```

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

- [ ] **Step 11: Run all schema tests — verify PASS (14 tests)**

```bash
cd web && pnpm test:run src/tests/schemas/
```

- [ ] **Step 12: Write PrivateRoute — always renders children (no real auth yet)**

```tsx
// web/src/components/PrivateRoute.tsx
import { Outlet } from 'react-router-dom'

// Replaced in firebase.md merge phase with real useAuth check
export const PrivateRoute = () => <Outlet />
```

- [ ] **Step 13: Update App.tsx with routing skeleton**

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

- [ ] **Step 14: Run all tests and commit**

```bash
cd web && pnpm test:run
```
Expected: PASS (14 tests)

```bash
git add web/vitest.config.ts web/src/tests/ web/src/types/ web/src/schemas/ web/src/components/PrivateRoute.tsx web/src/App.tsx web/package.json web/pnpm-lock.yaml
git commit -m "feat: add types, schemas, tests, routing skeleton"
git push -u origin feat/frontend-foundation
gh pr create --title "feat: frontend foundation — types, schemas, routing" --body "$(cat <<'EOF'
## Summary
- Vitest + RTL test infrastructure
- TypeScript entity types (Connection, Contact, Message)
- Zod schemas for all 4 form types — 14 tests passing
- Routing skeleton with pass-through PrivateRoute

## Test plan
- [ ] `cd web && pnpm test:run` — 14 tests pass
EOF
)"
```

---

## PR 2: feat/frontend-auth

**Branch:** `feat/frontend-auth` | **Base:** `feat/frontend-foundation`

Adds auth UI — LoginForm, RegisterForm, LoginPage (navigates on submit, no Firebase), AppLayout.

### Files to create
- `web/src/components/auth/LoginForm.tsx`
- `web/src/components/auth/RegisterForm.tsx`
- `web/src/pages/LoginPage.tsx`
- `web/src/components/layout/AppLayout.tsx`
- `web/src/tests/components/auth/LoginForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — wire LoginPage + AppLayout

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

- [ ] **Step 4: Run — verify PASS (2 tests)**

```bash
cd web && pnpm test:run src/tests/components/auth/LoginForm.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/auth/LoginForm.tsx web/src/tests/components/auth/LoginForm.test.tsx
git commit -m "feat: add LoginForm with RHF + Zod validation"
```

---

### Task 2: RegisterForm

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

- [ ] **Commit**

```bash
git add web/src/components/auth/RegisterForm.tsx
git commit -m "feat: add RegisterForm with confirmPassword validation"
```

---

### Task 3: LoginPage (UI-only — navigates on submit, no Firebase)

```tsx
// web/src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Container, Paper, Tab, Tabs, Typography } from '@mui/material'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import type { LoginForm as LoginValues } from '../schemas/auth.schema'
import type { RegisterForm as RegisterValues } from '../schemas/auth.schema'

// Firebase calls are added in the merge phase (specs/firebase.md).
// For now, both handlers navigate directly so the UI can be developed and tested.
export const LoginPage = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [error] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (_data: LoginValues) => {
    navigate('/connections')
  }

  const handleRegister = async (_data: RegisterValues) => {
    navigate('/connections')
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container maxWidth="xs">
        <Paper className="p-8" elevation={2}>
          <Typography variant="h5" className="mb-4 font-bold text-center">Broadcast</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered className="mb-4">
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

- [ ] **Commit**

```bash
git add web/src/pages/LoginPage.tsx
git commit -m "feat: add LoginPage UI (firebase wired in merge phase)"
```

---

### Task 4: AppLayout + wire App.tsx

```tsx
// web/src/components/layout/AppLayout.tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

// Logout calls Firebase signOut in the merge phase. For now, navigates to /login.
export const AppLayout = () => {
  const navigate = useNavigate()

  return (
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="flex-1">Broadcast</Typography>
          <Button color="inherit" onClick={() => navigate('/login')}>Sair</Button>
        </Toolbar>
      </AppBar>
      <Box component="main" className="p-4"><Outlet /></Box>
    </Box>
  )
}
```

Update App.tsx:

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

- [ ] **Run all tests + commit + PR**

```bash
cd web && pnpm test:run
```
Expected: PASS (16 tests)

```bash
git add web/src/components/layout/AppLayout.tsx web/src/App.tsx
git commit -m "feat: add AppLayout and wire auth UI into routes"
git push -u origin feat/frontend-auth
gh pr create --title "feat: frontend auth — login/register UI, AppLayout" --body "$(cat <<'EOF'
## Summary
- LoginForm + RegisterForm with RHF + Zod validation (inline errors)
- LoginPage: tabbed UI, navigates on submit (Firebase added in merge)
- AppLayout: AppBar + logout button (Firebase signOut added in merge)
- Routes updated with real LoginPage and AppLayout

## Test plan
- [ ] `cd web && pnpm test:run` — 16 tests pass
- [ ] Browse to / → goes to /connections placeholder
- [ ] Browse to /login → login/register tabs render with validation
EOF
)"
```

---

## PR 3: feat/frontend-connections

**Branch:** `feat/frontend-connections` | **Base:** `feat/frontend-auth`

Adds Connections CRUD UI. Page uses local `useState` — replaced by `useConnections` + service in merge.

### Files to create
- `web/src/components/connections/ConnectionForm.tsx`
- `web/src/components/connections/ConnectionCard.tsx`
- `web/src/pages/ConnectionsPage.tsx`
- `web/src/tests/components/connections/ConnectionForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace connections placeholder

---

### Task 1: ConnectionForm + test

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

- [ ] **Step 4: Run — verify PASS (3 tests)**

```bash
cd web && pnpm test:run src/tests/components/connections/ConnectionForm.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/connections/ConnectionForm.tsx web/src/tests/components/connections/ConnectionForm.test.tsx
git commit -m "feat: add ConnectionForm with edit support"
```

---

### Task 2: ConnectionCard

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

- [ ] **Commit**

```bash
git add web/src/components/connections/ConnectionCard.tsx
git commit -m "feat: add ConnectionCard with edit/delete dialogs"
```

---

### Task 3: ConnectionsPage (local state mock) + wire

```tsx
// web/src/pages/ConnectionsPage.tsx
import { useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ConnectionCard } from '../components/connections/ConnectionCard'
import { ConnectionForm } from '../components/connections/ConnectionForm'
import type { Connection } from '../types'
import type { ConnectionForm as Values } from '../schemas/connection.schema'
import type { Timestamp } from 'firebase/firestore'

// Local state mock — replaced by useConnections + service in specs/firebase.md merge phase
const mockTs = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as Timestamp

export const ConnectionsPage = () => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => {
    setConnections((prev) => [...prev, { id: crypto.randomUUID(), userId: 'mock', name: data.name, createdAt: mockTs }])
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: Values) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, name: data.name } : c))
  }

  const handleDelete = async (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4">
        <Typography variant="h5" className="flex-1">Conexões</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Nova conexão</Button>
      </Stack>
      <Stack spacing={2}>
        {connections.map((conn) => (
          <ConnectionCard key={conn.id} connection={conn}
            onEdit={(data) => handleEdit(conn.id, data)}
            onDelete={() => handleDelete(conn.id)} />
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

Update App.tsx — replace connections placeholder:
```tsx
import { ConnectionsPage } from './pages/ConnectionsPage'
// replace: <Route path="/connections" element={<div>Connections (coming soon)</div>} />
<Route path="/connections" element={<ConnectionsPage />} />
```

- [ ] **Run all tests + commit + PR**

```bash
cd web && pnpm test:run
```
Expected: PASS (19 tests)

```bash
git add web/src/components/connections/ web/src/pages/ConnectionsPage.tsx web/src/App.tsx
git commit -m "feat: add connections UI with local state mock"
git push -u origin feat/frontend-connections
gh pr create --title "feat: frontend connections — CRUD UI with local mock" --body "$(cat <<'EOF'
## Summary
- ConnectionForm: RHF + Zod, edit mode via defaultValues — 3 tests
- ConnectionCard: name display, navigate to contacts/messages, edit/delete dialogs
- ConnectionsPage: fully functional with local useState (real-time onSnapshot added in merge)

## Test plan
- [ ] `cd web && pnpm test:run` — 19 tests pass
- [ ] Visual: create, edit, delete connections — UI updates instantly
EOF
)"
```

---

## PR 4: feat/frontend-contacts

**Branch:** `feat/frontend-contacts` | **Base:** `feat/frontend-connections`

Adds Contacts CRUD UI. Page uses local `useState` — replaced by `useContacts` + service in merge.

### Files to create
- `web/src/components/contacts/ContactForm.tsx`
- `web/src/components/contacts/ContactCard.tsx`
- `web/src/pages/ContactsPage.tsx`
- `web/src/tests/components/contacts/ContactForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace contacts placeholder

---

### Task 1: ContactForm + test

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

### Task 2: ContactCard

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

- [ ] **Commit**

```bash
git add web/src/components/contacts/ContactCard.tsx
git commit -m "feat: add ContactCard with edit/delete dialogs"
```

---

### Task 3: ContactsPage (local state mock) + wire

```tsx
// web/src/pages/ContactsPage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ContactCard } from '../components/contacts/ContactCard'
import { ContactForm } from '../components/contacts/ContactForm'
import type { Contact } from '../types'
import type { ContactForm as Values } from '../schemas/contact.schema'
import type { Timestamp } from 'firebase/firestore'

// Local state mock — replaced by useContacts + service in specs/firebase.md merge phase
const mockTs = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as Timestamp

export const ContactsPage = () => {
  const { connectionId } = useParams<{ connectionId: string }>()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => {
    setContacts((prev) => [...prev, {
      id: crypto.randomUUID(), userId: 'mock',
      connectionId: connectionId!, name: data.name, phone: data.phone, createdAt: mockTs,
    }])
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: Values) => {
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, name: data.name, phone: data.phone } : c))
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
            onEdit={(data) => handleEdit(c.id, data)}
            onDelete={async () => setContacts((prev) => prev.filter((x) => x.id !== c.id))} />
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

Update App.tsx — replace contacts placeholder:
```tsx
import { ContactsPage } from './pages/ContactsPage'
// replace: <Route path="/connections/:connectionId/contacts" element={<div>Contacts (coming soon)</div>} />
<Route path="/connections/:connectionId/contacts" element={<ContactsPage />} />
```

- [ ] **Run all tests + commit + PR**

```bash
cd web && pnpm test:run
```
Expected: PASS (22 tests)

```bash
git add web/src/components/contacts/ web/src/pages/ContactsPage.tsx web/src/App.tsx
git commit -m "feat: add contacts UI with local state mock"
git push -u origin feat/frontend-contacts
gh pr create --title "feat: frontend contacts — CRUD UI with local mock" --body "$(cat <<'EOF'
## Summary
- ContactForm: name + phone, RHF + Zod, edit mode — 3 tests
- ContactCard: display + edit/delete dialogs
- ContactsPage: local useState mock (useContacts added in merge)

## Test plan
- [ ] `cd web && pnpm test:run` — 22 tests pass
- [ ] Navigate connection → Contacts → CRUD works visually
EOF
)"
```

---

## PR 5: feat/frontend-messages

**Branch:** `feat/frontend-messages` | **Base:** `feat/frontend-contacts`

Adds Messages CRUD UI including multi-contact selection, schedule picker, status filter. Page uses local state — replaced by real hooks/services in merge.

### Files to create
- `web/src/components/messages/StatusFilter.tsx`
- `web/src/components/messages/MessageForm.tsx`
- `web/src/components/messages/MessageCard.tsx`
- `web/src/pages/MessagesPage.tsx`
- `web/src/tests/components/messages/MessageForm.test.tsx`

### Files to modify
- `web/src/App.tsx` — replace messages placeholder

---

### Task 1: StatusFilter

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

- [ ] **Commit**

```bash
git add web/src/components/messages/StatusFilter.tsx
git commit -m "feat: add StatusFilter toggle component"
```

---

### Task 2: MessageForm + test

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

- [ ] **Step 4: Run — verify PASS (2 tests)**

```bash
cd web && pnpm test:run src/tests/components/messages/MessageForm.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/messages/MessageForm.tsx web/src/tests/components/messages/MessageForm.test.tsx
git commit -m "feat: add MessageForm with multi-contact selection and schedule picker"
```

---

### Task 3: MessageCard

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

- [ ] **Commit**

```bash
git add web/src/components/messages/MessageCard.tsx
git commit -m "feat: add MessageCard with status chip and edit/delete for agendado"
```

---

### Task 4: MessagesPage (local state mock) + wire

```tsx
// web/src/pages/MessagesPage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { MessageCard } from '../components/messages/MessageCard'
import { MessageForm } from '../components/messages/MessageForm'
import { StatusFilter } from '../components/messages/StatusFilter'
import type { Contact, Message, MessageStatus } from '../types'
import type { MessageForm as Values } from '../schemas/message.schema'
import type { Timestamp } from 'firebase/firestore'

// Local state mock — replaced by useMessages + useContacts + services in specs/firebase.md merge phase
const mockTs = (d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 } as unknown as Timestamp)

// Inject contacts via prop so MessagesPage can be tested independently.
// In the merge phase, ContactsPage passes its connectionId and MessagesPage calls useContacts itself.
interface Props { mockContacts?: Contact[] }

export const MessagesPage = ({ mockContacts = [] }: Props) => {
  const { connectionId } = useParams<{ connectionId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => {
    const sendAt = data.sendAt
    const status: MessageStatus = sendAt <= new Date() ? 'enviado' : 'agendado'
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(), userId: 'mock', connectionId: connectionId!,
      contactIds: data.contactIds, body: data.body,
      status, sendAt: mockTs(sendAt), createdAt: mockTs(new Date()),
    }])
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: Values) => {
    const sendAt = data.sendAt
    const status: MessageStatus = sendAt <= new Date() ? 'enviado' : 'agendado'
    setMessages((prev) => prev.map((m) =>
      m.id === id ? { ...m, body: data.body, contactIds: data.contactIds, status, sendAt: mockTs(sendAt) } : m
    ))
  }

  const handleDelete = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  const filtered = statusFilter === 'all' ? messages : messages.filter((m) => m.status === statusFilter)

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4" flexWrap="wrap" gap={2}>
        <Typography variant="h5" className="flex-1">Mensagens</Typography>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Nova mensagem</Button>
      </Stack>
      <Stack spacing={2}>
        {filtered.map((msg) => (
          <MessageCard key={msg.id} message={msg} contacts={mockContacts}
            onEdit={(data) => handleEdit(msg.id, data)}
            onDelete={() => handleDelete(msg.id)} />
        ))}
        {filtered.length === 0 && <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>}
      </Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova mensagem</DialogTitle>
        <DialogContent><Box className="pt-2"><MessageForm contacts={mockContacts} onSubmit={handleAdd} /></Box></DialogContent>
      </Dialog>
    </Box>
  )
}
```

Update App.tsx — replace messages placeholder:
```tsx
import { MessagesPage } from './pages/MessagesPage'
// replace: <Route path="/connections/:connectionId/messages" element={<div>Messages (coming soon)</div>} />
<Route path="/connections/:connectionId/messages" element={<MessagesPage />} />
```

- [ ] **Run all tests + commit + PR**

```bash
cd web && pnpm test:run
```
Expected: PASS (24 tests)

```bash
git add web/src/components/messages/ web/src/pages/MessagesPage.tsx web/src/App.tsx
git commit -m "feat: add messages UI with local state mock, status filter"
git push -u origin feat/frontend-messages
gh pr create --title "feat: frontend messages — CRUD UI with local mock, filter" --body "$(cat <<'EOF'
## Summary
- StatusFilter: toggle all/agendado/enviado
- MessageForm: multi-contact checkbox, immediate/scheduled radio, datetime picker — 2 tests
- MessageCard: status chip, edit/delete only for agendado messages
- MessagesPage: local useState with client-side status filter (onSnapshot added in merge)

## Test plan
- [ ] `cd web && pnpm test:run` — 24 tests pass
- [ ] Visual: create immediate + scheduled messages, filter by status, edit/delete agendado
EOF
)"
```

---

## Frontend complete

All 24 tests passing. Full UI is navigable with local mock state.

**Next step:** Follow `specs/firebase.md` to build the data layer, then merge into the pages.
