import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './components/private-route'
import { AppLayout } from './components/layout/app-layout'
import { LoginPage } from './pages/login-page'
import { ConnectionsPage } from './pages/connections-page'
import { ContactsPage } from './pages/contacts-page'
import { MessagesPage } from './pages/messages-page'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/connections/:connectionId/contacts" element={<ContactsPage />} />
            <Route path="/connections/:connectionId/messages" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/connections" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
