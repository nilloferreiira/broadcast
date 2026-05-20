import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'

export const App = () => (
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
