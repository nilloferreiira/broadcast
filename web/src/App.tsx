import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'

export const App = () => (
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
