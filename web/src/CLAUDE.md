# 📋 CLAUDE.md - Regras do Projeto Broadcast

## Stack Tecnológico

- **React 19** com **TypeScript** (strict mode)
- **Vite** como bundler
- **Firebase**: Auth, Firestore, Functions
- **Material UI (MUI)** para componentes
- **Tailwind CSS v4** para estilização
- **Lucide React** para ícones

---

## Estrutura do Projeto

```
.
├── functions/          # Firebase Cloud Functions (Node.js)
│   ├── src/
│   │   ├── index.ts
│   │   └── [funcionalidades]
│   └── package.json
│
└── web/                # Frontend React + Vite
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   ├── types/
    │   ├── services/
    │   └── App.tsx
    ├── vite.config.ts
    └── package.json
```

---

## Convenções de Nomenclatura

- **Arquivos**: lowercase com hífens → `user-card.tsx`, `use-auth.ts`, `firebase-config.ts`
- **Componentes**: PascalCase → `UserCard.tsx`, `LoginForm.tsx`
- **Hooks**: lowercase com prefixo `use-` → `use-auth.ts`, `use-connections.ts`
- **Tipos/Interfaces**: PascalCase → `User`, `Connection`, `Message`
- **Exports**: **Named exports** (nunca default export)
- **Sem barrel files**: Não criar `index.ts` em pastas internas

---

## Paradigma Funcional

✅ **Obrigatório:**

- Usar **hooks** (useState, useEffect, useContext, useReducer)
- **Funções puras** sempre que possível
- Evitar estado mutável
- Usar **composição** em vez de herança
- Functional components, sem classes

❌ **Proibido:**

- Classes e OOP
- `this`, `class`, herança
- Componentes com estado mutável

---

## Arquitetura de Componentes

```tsx
import { Button } from "@mui/material"
import { Mail } from "lucide-react"
import type { ComponentProps } from "react"

export interface UserCardProps extends ComponentProps<"div"> {
	name: string
	email: string
	variant?: "default" | "elevated"
}

export function UserCard({ name, email, variant = "default", className, ...props }: UserCardProps) {
	return (
		<div
			className={`rounded-lg border border-gray-200 p-4${variant === "elevated" ? " shadow-md" : ""} ${className ?? ""}`}
			{...props}
		>
			<div className="flex items-center gap-3">
				<Mail className="size-5" />
				<div>
					<h3 className="font-semibold">{name}</h3>
					<p className="text-sm text-gray-600">{email}</p>
				</div>
			</div>
		</div>
	)
}
```

---

## Padrões TypeScript

```tsx
// ✅ Imports com type
import type { ReactNode } from "react"
import type { User } from "../types"

// ✅ Props interface
export interface LoginFormProps {
	onSubmit: (email: string, password: string) => Promise<void>
	isLoading?: boolean
}

// ✅ Componente funcional
export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
	const [email, setEmail] = useState("")
	// ...
}

// ❌ Evitar any, React.FC, forwardRef sem necessidade
```

---

## Integração Firebase

### Estrutura de Serviços

```
web/src/services/
├── firebase-config.ts      # Inicialização
├── auth.ts                 # Funções de autenticação
├── connections.ts          # CRUD de conexões
├── contacts.ts             # CRUD de contatos
└── messages.ts             # CRUD de mensagens
```

### Exemplo de Serviço

```tsx
import { db, auth } from "../lib/firebase-config"
import { collection, addDoc, query, where } from "firebase/firestore"
import type { Connection } from "../types"

export async function createConnection(name: string): Promise<Connection> {
	const userId = auth.currentUser?.uid
	if (!userId) throw new Error("Not authenticated")

	const docRef = await addDoc(collection(db, "connections"), {
		userId,
		name,
		createdAt: new Date()
	})

	return { id: docRef.id, name, userId } as Connection
}

export function subscribeToConnections(userId: string, onSnapshot: (connections: Connection[]) => void) {
	const q = query(collection(db, "connections"), where("userId", "==", userId))

	return onSnapshot(q, (snapshot) => {
		const connections = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Connection[]
		onSnapshot(connections)
	})
}
```

---

## Segurança (Firestore Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /connections/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    match /contacts/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    match /messages/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
  }
}
```

---

## Estrutura de Dados (Firestore)

### Collections

```
collections/
├── connections/
│   └── {connectionId}
│       ├── userId: string
│       ├── name: string
│       └── createdAt: timestamp
│
├── contacts/
│   └── {contactId}
│       ├── userId: string
│       ├── connectionId: string
│       ├── name: string
│       ├── phone: string
│       └── createdAt: timestamp
│
└── messages/
    └── {messageId}
        ├── userId: string
        ├── connectionId: string
        ├── contactIds: string[]
        ├── content: string
        ├── status: 'sent' | 'scheduled'
        ├── sentAt: timestamp
        ├── scheduledFor: timestamp (nullable)
        └── createdAt: timestamp
```

---

## Cloud Functions

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp()

export const dispatchScheduledMessages = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
	const db = admin.firestore()
	const now = admin.firestore.Timestamp.now()

	const snapshot = await db
		.collection("messages")
		.where("status", "==", "scheduled")
		.where("scheduledFor", "<=", now)
		.get()

	const batch = db.batch()
	snapshot.docs.forEach((doc) => {
		batch.update(doc.ref, {
			status: "sent",
			sentAt: now
		})
	})

	await batch.commit()
})
```

---

## Hooks Customizados

```tsx
// web/src/hooks/use-auth.ts
import { useEffect, useState } from "react"
import { auth } from "../lib/firebase-config"
import type { User } from "firebase/auth"

export function useAuth() {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((currentUser) => {
			setUser(currentUser)
			setLoading(false)
		})

		return unsubscribe
	}, [])

	return { user, loading }
}
```

---

## Padrões de Estilo (Tailwind + MUI)

```tsx
// Prefira Tailwind para layout
<div className="flex items-center gap-4 rounded-lg border p-4">

// Use MUI para componentes complexos
<TextField label="Email" type="email" />
<Button variant="contained" onClick={handleSubmit}>
  Enviar
</Button>

// Combine para customização
<TextField
  label="Search"
  className="w-full"
  slotProps={{ input: { className: 'rounded-full' } }}
/>
```

---

## Organização de Páginas

```
web/src/pages/
├── auth/
│   ├── login.tsx
│   └── register.tsx
├── dashboard/
│   ├── connections.tsx
│   ├── contacts.tsx
│   └── messages.tsx
└── not-found.tsx
```

---

## Tipos Globais

```tsx
// web/src/types/index.ts
export interface User {
	id: string
	email: string
	createdAt: Date
}

export interface Connection {
	id: string
	userId: string
	name: string
	createdAt: Date
}

export interface Contact {
	id: string
	userId: string
	connectionId: string
	name: string
	phone: string
	createdAt: Date
}

export interface Message {
	id: string
	userId: string
	connectionId: string
	contactIds: string[]
	content: string
	status: "sent" | "scheduled"
	sentAt: Date | null
	scheduledFor: Date | null
	createdAt: Date
}
```

---

## Checklist de Implementação

- [ ] Setup Firebase (Auth, Firestore, Functions, Hosting)
- [ ] Criar estrutura de pastas (functions/ e web/)
- [ ] Implementar autenticação (Login/Registro)
- [ ] CRUD de Conexões com Realtime
- [ ] CRUD de Contatos com Realtime
- [ ] CRUD de Mensagens com Realtime
- [ ] Implementar agendamento
- [ ] Implementar Cloud Function para disparo
- [ ] Deploy no Firebase Hosting
- [ ] Testar segurança das Firestore Rules

---

## Recursos Úteis

- [Firebase Docs](https://firebase.google.com/docs)
- [Material UI Docs](https://mui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Hooks API](https://react.dev/reference/react/hooks)

---

**Última atualização:** Maio 2026
