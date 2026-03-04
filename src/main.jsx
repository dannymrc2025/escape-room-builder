import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CrearEscapeRoom from './pages/CrearEscapeRoom.jsx'
import EditarEscapeRoom from './pages/EditarEscapeRoom.jsx'
import Monitor from './pages/Monitor.jsx'
import Resultados from './pages/Resultados.jsx'
import Jugar from './pages/Jugar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/jugar" element={<Jugar />} />
        <Route path="/jugar/:codigoSala" element={<Jugar />} />

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/crear" element={
          <ProtectedRoute><CrearEscapeRoom /></ProtectedRoute>
        } />
        <Route path="/editar/:id" element={
          <ProtectedRoute><EditarEscapeRoom /></ProtectedRoute>
        } />
        <Route path="/monitor/:sesionId" element={
          <ProtectedRoute><Monitor /></ProtectedRoute>
        } />
        <Route path="/resultados/:sesionId" element={
          <ProtectedRoute><Resultados /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
