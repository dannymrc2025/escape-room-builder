import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (password === import.meta.env.VITE_APP_PASSWORD) {
      sessionStorage.setItem('maestro_auth', 'true')
      navigate('/dashboard')
    } else {
      setError('Contraseña incorrecta. Intenta de nuevo.')
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
      setPassword('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-500/30 border border-blue-400/40 rounded-full p-4 mb-4">
              <Lock className="w-10 h-10 text-blue-200" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              Escape Room Builder
            </h1>
            <p className="text-blue-200 mt-2 text-base sm:text-lg font-medium">
              Panel del Maestro
            </p>
          </div>

          {/* Input */}
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder="Contraseña"
              className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error message */}
          <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-10 mb-4' : 'max-h-0 mb-0'}`}>
            <p
              className={`text-red-400 text-sm text-center font-medium ${shaking ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}
            >
              {error}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-bold py-3 rounded-xl text-base transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Entrar
          </button>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}
