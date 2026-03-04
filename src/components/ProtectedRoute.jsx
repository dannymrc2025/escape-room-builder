import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('maestro_auth') === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
