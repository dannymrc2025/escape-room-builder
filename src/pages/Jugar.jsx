import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Lock, Unlock, Clock, Star, Trophy, Eye, Check,
  ChevronRight, AlertCircle, Loader2, Home, Users
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────
function fmtTiempo(seg) {
  const s = Math.max(0, Math.floor(seg))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function normalizar(str) {
  return String(str ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '') // "3x + 2" === "3x+2"
}

// ─── Confeti ──────────────────────────────────────────────────
function Confeti() {
  const ref = useRef()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const COLS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA', '#FB923C', '#34D399']
    const piezas = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * 300,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      c: COLS[Math.floor(Math.random() * COLS.length)],
      sp: 1.5 + Math.random() * 2.5,
      dr: Math.random() * 1.5 - 0.75,
      an: Math.random() * 360,
      spin: Math.random() * 3 - 1.5,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      piezas.forEach((p) => {
        p.y += p.sp; p.x += p.dr; p.an += p.spin
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.an * Math.PI / 180)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-10" style={{ width: '100vw', height: '100vh' }} />
}

// ─── Pantalla 1: Entrada ──────────────────────────────────────
const GRUPOS = ['2A', '2C', '2D', '2F Leona']

function PantallaEntrada({ estadoInicial, onUnirse }) {
  const [codigo, setCodigo] = useState((estadoInicial?.codigo ?? '').toUpperCase())
  const [modo, setModo] = useState(null) // se determina al buscar el código
  // Individual
  const [nombreJugador, setNombreJugador] = useState('')
  const [grupo, setGrupo] = useState('')
  // Equipo
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [jugadores, setJugadores] = useState(['', '', '', ''])
  const [grupoEquipo, setGrupoEquipo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [sesionCache, setSesionCache] = useState(null) // guardamos sesión al buscar código

  // Buscar sala al escribir el código completo
  const buscarSala = async (cod) => {
    if (cod.length < 6) { setModo(null); setSesionCache(null); return }
    const { data: ses } = await supabase
      .from('sesiones').select('*').eq('codigo_sala', cod).limit(1)
    const sesion = ses?.[0]
    if (!sesion) { setModo(null); setSesionCache(null); return }
    const { data: er } = await supabase
      .from('escape_rooms').select('*').eq('id', sesion.escape_room_id).single()
    sesion.escape_rooms = er
    setSesionCache(sesion)
    setModo(er?.modo_juego ?? 'individual')
  }

  const validar = () => {
    if (!codigo.trim()) return 'Ingresa el código de sala.'
    if (!sesionCache) return 'Código de sala inválido.'
    if (modo === 'individual') {
      if (!nombreJugador.trim()) return 'Ingresa tu nombre.'
      if (!grupo) return 'Selecciona tu grupo.'
    } else {
      if (!nombreEquipo.trim()) return 'Ingresa el nombre del equipo.'
      if (!jugadores[0].trim()) return 'Ingresa al menos el nombre del Jugador 1.'
      if (!grupoEquipo) return 'Selecciona el grupo.'
    }
    return ''
  }

  const unirse = async () => {
    const err = validar()
    if (err) { setError(err); return }
    setCargando(true)
    setError('')

    const sesion = sesionCache

    // Construir nombre para guardar en BD
    let nombreFinal
    if (modo === 'individual') {
      nombreFinal = `${nombreJugador.trim()} (${grupo})`
    } else {
      const jFiltrados = jugadores.filter((j) => j.trim())
      nombreFinal = `${nombreEquipo.trim()} [${grupoEquipo}] · ${jFiltrados.join(', ')}`
    }

    const { data: eq, error: errEq } = await supabase
      .from('equipos')
      .insert({
        sesion_id: sesion.id,
        nombre: nombreFinal,
        estacion_actual: 1,
        estaciones_resueltas: 0,
        intentos_totales: 0,
      })
      .select()
      .single()

    if (errEq || !eq) {
      setError('No se pudo unir. Intenta de nuevo.')
      setCargando(false)
      return
    }

    sessionStorage.setItem('escape_equipo', JSON.stringify(eq))

    await supabase
      .from('escape_rooms')
      .update({ estado: 'en curso' })
      .eq('id', sesion.escape_room_id)

    onUnirse(sesion, eq)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-500/20 border border-blue-400/30 rounded-full p-5 mb-4">
            <Lock className="w-12 h-12 text-blue-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Escape Room</h1>
          <p className="text-blue-300 mt-1 text-sm">Ingresa el código que te dio tu maestro</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">

          {/* Código de sala */}
          <div>
            <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-1.5">
              Código de sala
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().slice(0, 8)
                setCodigo(v)
                setError('')
                buscarSala(v)
              }}
              placeholder="XXXXXXXX"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/20 rounded-xl px-4 py-3 text-center text-2xl font-extrabold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              maxLength={8}
            />
            {sesionCache && (
              <p className="text-green-400 text-xs mt-1.5 text-center font-semibold">
                ✓ {sesionCache.escape_rooms?.nombre} · {modo === 'individual' ? '👤 Individual' : '👥 Equipo'}
              </p>
            )}
          </div>

          {/* ── Formulario individual ── */}
          {modo === 'individual' && (
            <>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-1.5">
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={nombreJugador}
                  onChange={(e) => { setNombreJugador(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && unirse()}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/20 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-2">
                  Tu grupo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GRUPOS.map((g) => (
                    <button
                      key={g}
                      onClick={() => { setGrupo(g); setError('') }}
                      className={`py-2.5 rounded-xl text-sm font-bold transition border ${
                        grupo === g
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Formulario equipo ── */}
          {modo === 'equipo' && (
            <>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-1.5">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  value={nombreEquipo}
                  onChange={(e) => { setNombreEquipo(e.target.value); setError('') }}
                  placeholder="Ej: Los Matemáticos"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/20 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-2">
                  Grupo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GRUPOS.map((g) => (
                    <button
                      key={g}
                      onClick={() => { setGrupoEquipo(g); setError('') }}
                      className={`py-2.5 rounded-xl text-sm font-bold transition border ${
                        grupoEquipo === g
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider block mb-2">
                  Jugadores (mín. 1, máx. 4)
                </label>
                <div className="space-y-2">
                  {jugadores.map((j, i) => (
                    <input
                      key={i}
                      type="text"
                      value={j}
                      onChange={(e) => {
                        const arr = [...jugadores]
                        arr[i] = e.target.value
                        setJugadores(arr)
                        setError('')
                      }}
                      placeholder={`Jugador ${i + 1}${i === 0 ? ' (requerido)' : ' (opcional)'}`}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          <button
            onClick={unirse}
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 text-base mt-1"
          >
            {cargando
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Uniéndose...</>
              : <><ChevronRight className="w-5 h-5" /> Unirse al juego</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pantalla 2: Historia ──────────────────────────────────────
function PantallaHistoria({ historia, nombreRoom, onComenzar }) {
  const [texto, setTexto] = useState('')
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!historia) { setTexto(''); setListo(true); return }
    let i = 0
    setTexto('')
    const iv = setInterval(() => {
      i++
      setTexto(historia.slice(0, i))
      if (i >= historia.length) { clearInterval(iv); setListo(true) }
    }, 30)
    return () => clearInterval(iv)
  }, [historia])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="inline-flex bg-violet-500/20 border border-violet-400/30 rounded-full p-4 mb-5">
          <Lock className="w-10 h-10 text-violet-300" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-6">{nombreRoom}</h1>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-left min-h-[160px]">
          <p className="text-gray-200 text-base leading-relaxed whitespace-pre-line">
            {texto}
            {!listo && (
              <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          {listo ? (
            <button
              onClick={onComenzar}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition text-lg flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <ChevronRight className="w-5 h-5" /> ¡Comenzar la misión!
            </button>
          ) : (
            <button
              onClick={() => { setTexto(historia ?? ''); setListo(true) }}
              className="text-sm text-gray-600 hover:text-gray-400 transition underline"
            >
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pantalla 3: Juego ─────────────────────────────────────────
function PantallaJuego({ sesion, escapeRoom, equipo: equipoInicial, estaciones, onTerminar }) {
  const [indice, setIndice] = useState(0)
  const [respuesta, setRespuesta] = useState('')
  const [intentos, setIntentos] = useState(0)
  const [shake, setShake] = useState(false)
  const [abriendo, setAbriendo] = useState(false)
  const [pistaTexto, setPistaTexto] = useState(null)
  const [pistaVista, setPistaVista] = useState(false)
  const [puntosAcumulados, setPuntosAcumulados] = useState(0)
  const [tiempoRestante, setTiempoRestante] = useState((escapeRoom?.tiempo_limite ?? 30) * 60)
  const [finalizando, setFinalizando] = useState(false)

  const timerRef = useRef(null)
  const finalizadoRef = useRef(false)
  const intentosTotalesRef = useRef(0)
  const inputRef = useRef()

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTiempoRestante((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Finalize on timeout
  useEffect(() => {
    if (tiempoRestante === 0 && !finalizadoRef.current && estaciones.length > 0) {
      finalizadoRef.current = true
      setFinalizando(true)
    }
  }, [tiempoRestante, estaciones.length])

  // Finalize on all stations completed
  useEffect(() => {
    if (indice >= estaciones.length && estaciones.length > 0 && !finalizadoRef.current && !abriendo) {
      finalizadoRef.current = true
      setFinalizando(true)
    }
  }, [indice, estaciones.length, abriendo])

  // Run async finalization (values captured from this render)
  useEffect(() => {
    if (!finalizando) return
    clearInterval(timerRef.current)
    const tiempoUsado = ((escapeRoom?.tiempo_limite ?? 30) * 60) - tiempoRestante
    const pts = puntosAcumulados
    const idx = Math.min(indice, estaciones.length)
    ;(async () => {
      await supabase.from('resultados_finales').insert({
        sesion_id: sesion.id,
        equipo_id: equipoInicial.id,
        tiempo_total: tiempoUsado,
        puntos_total: pts,
      })
      await supabase.from('equipos').update({
        estaciones_resueltas: idx,
        estacion_actual: Math.min(idx + 1, estaciones.length),
        intentos_totales: intentosTotalesRef.current,
      }).eq('id', equipoInicial.id)
      onTerminar(tiempoUsado, pts)
    })()
  }, [finalizando]) // eslint-disable-line

  const verificar = async () => {
    if (!respuesta.trim() || abriendo || finalizando) return
    const est = estaciones[indice]
    if (!est) return

    const correc = normalizar(respuesta) === normalizar(est.respuesta)
    intentosTotalesRef.current += 1

    await supabase.from('progreso').insert({
      sesion_id: sesion.id,
      equipo_id: equipoInicial.id,
      estacion_id: est.id,
      respuesta: respuesta.trim(),
      correcto: correc,
    })

    if (correc) {
      const pts = Math.max(0, (est.puntos ?? 100) - (pistaVista ? 20 : 0))
      setPuntosAcumulados((p) => p + pts)
      // Actualizar progreso del equipo en BD para que el Monitor lo vea en tiempo real
      await supabase.from('equipos').update({
        estaciones_resueltas: indice + 1,
        estacion_actual: Math.min(indice + 2, estaciones.length),
      }).eq('id', equipoInicial.id)
      setAbriendo(true)
      setTimeout(() => {
        setAbriendo(false)
        setIndice((i) => i + 1)
        setRespuesta('')
        setIntentos(0)
        setPistaVista(false)
        setPistaTexto(null)
        setTimeout(() => inputRef.current?.focus(), 50)
      }, 1400)
    } else {
      setIntentos((n) => n + 1)
      setShake(true)
      setRespuesta('')
      setTimeout(() => setShake(false), 600)
    }
  }

  const verPista = () => {
    if (pistaVista) return
    const est = estaciones[indice]
    const pista = (intentos >= 1 && est?.pista_2) ? est.pista_2 : est?.pista_1
    setPistaTexto(pista || 'No hay pistas disponibles para esta estación.')
    setPistaVista(true)
    setTiempoRestante((t) => Math.max(0, t - 20))
  }

  if (finalizando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Guardando resultados...</p>
        </div>
      </div>
    )
  }

  if (indice >= estaciones.length) return null

  const est = estaciones[indice]
  const colorTimer = tiempoRestante < 60
    ? 'text-red-400'
    : tiempoRestante < 300
    ? 'text-amber-400'
    : 'text-green-400'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-gray-300 truncate max-w-[30%]">{equipoInicial.nombre}</span>
        <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${colorTimer} ${tiempoRestante < 60 ? 'animate-pulse' : ''}`}>
          {fmtTiempo(tiempoRestante)}
        </span>
        <span className="text-sm text-gray-400">{indice + 1} / {estaciones.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 h-1">
        <div
          className="bg-blue-500 h-1 transition-all duration-500"
          style={{ width: `${(indice / estaciones.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-5">
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Estación {indice + 1} de {estaciones.length}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-3">{est.titulo}</h2>
            <p className="text-gray-300 text-base leading-relaxed mb-5">{est.problema}</p>

            {/* Pista */}
            {pistaTexto && (
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 mb-4 flex items-start gap-2">
                <Eye className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm">{pistaTexto}</p>
              </div>
            )}

            {/* Unlock animation */}
            {abriendo ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="bg-green-500/20 rounded-full p-4 animate-bounce">
                  <Unlock className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-green-400 font-bold text-xl">¡Correcto!</p>
                <p className="text-green-600 text-sm">
                  +{Math.max(0, (est.puntos ?? 100) - (pistaVista ? 20 : 0))} puntos
                </p>
              </div>
            ) : (
              <>
                <div className={shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verificar()}
                    placeholder="Tu respuesta..."
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition mb-3"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={verificar}
                    disabled={!respuesta.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Verificar
                  </button>
                  {intentos >= 2 && !pistaVista && est.pista_1 && (
                    <button
                      onClick={verPista}
                      className="flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 px-3 rounded-xl transition whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" /> Pista
                      <span className="text-xs text-amber-600">-20s</span>
                    </button>
                  )}
                </div>

                {intentos > 0 && (
                  <p className="text-xs text-gray-500 mt-2.5 text-center">
                    {intentos} intento{intentos !== 1 ? 's' : ''} incorrecto{intentos !== 1 ? 's' : ''}
                    {intentos >= 2 && !pistaVista && est.pista_1 && ' • Puedes solicitar una pista'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
      `}</style>
    </div>
  )
}

// ─── Pantalla 4: Victoria ──────────────────────────────────────
function PantallaVictoria({ equipo, tiempoUsado, puntos, sesionId }) {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [posicion, setPosicion] = useState(null)
  const [cargandoRanking, setCargandoRanking] = useState(true)

  useEffect(() => {
    if (!sesionId || !equipo) return
    supabase
      .from('resultados_finales')
      .select('*, equipos(nombre)')
      .eq('sesion_id', sesionId)
      .order('puntos_total', { ascending: false })
      .order('tiempo_total', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setRanking(data)
          const pos = data.findIndex((r) => r.equipo_id === equipo.id) + 1
          setPosicion(pos > 0 ? pos : null)
        }
        setCargandoRanking(false)
      })
  }, [sesionId, equipo])

  const MEDALLAS = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-yellow-950 flex flex-col items-center justify-center px-4 relative overflow-hidden py-12">
      <Confeti />
      <div className="relative z-20 w-full max-w-md text-center">
        <div className="inline-flex bg-yellow-400/20 border border-yellow-400/30 rounded-full p-5 mb-4">
          <Trophy className="w-14 h-14 text-yellow-300" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">¡Misión cumplida!</h1>
        <p className="text-yellow-300 text-lg font-semibold mb-6">{equipo?.nombre}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />, label: 'Tiempo', val: fmtTiempo(tiempoUsado) },
            { icon: <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />, label: 'Puntos', val: puntos },
            { icon: <Trophy className="w-5 h-5 text-orange-400 mx-auto mb-1" />, label: 'Posición', val: posicion ? `#${posicion}` : '—' },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              {icon}
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold text-white">{val}</p>
            </div>
          ))}
        </div>

        {/* Ranking */}
        {!cargandoRanking && ranking.length > 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Clasificación
            </p>
            <div className="space-y-2">
              {ranking.slice(0, 5).map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                    r.equipo_id === equipo?.id
                      ? 'bg-blue-500/20 border border-blue-400/30'
                      : 'bg-white/5'
                  }`}
                >
                  <span className="text-base w-6 text-center shrink-0">{MEDALLAS[i] ?? `${i + 1}.`}</span>
                  <span className="flex-1 font-medium text-white truncate">{r.equipos?.nombre ?? '—'}</span>
                  <span className="text-yellow-300 font-bold text-xs shrink-0">{r.puntos_total} pts</span>
                  <span className="text-gray-500 text-xs shrink-0">{fmtTiempo(r.tiempo_total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/jugar')}
          className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-white transition"
        >
          <Home className="w-4 h-4" /> Volver al inicio
        </button>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────
const EQUIPO_KEY = 'escape_equipo'

export default function Jugar() {
  const { codigoSala } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [pantalla, setPantalla] = useState(codigoSala ? 'cargando' : 'entrada')
  const [sesion, setSesion] = useState(null)
  const [escapeRoom, setEscapeRoom] = useState(null)
  const [equipo, setEquipo] = useState(null)
  const [estaciones, setEstaciones] = useState([])
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!codigoSala) { setPantalla('entrada'); return }
    cargarSesion()
  }, [codigoSala]) // eslint-disable-line

  const cargarSesion = async () => {
    const { data: sesArr } = await supabase
      .from('sesiones')
      .select('*')
      .eq('codigo_sala', codigoSala)
      .limit(1)

    const ses = sesArr?.[0]
    if (!ses) { navigate('/jugar'); return }

    const { data: er } = await supabase
      .from('escape_rooms')
      .select('*')
      .eq('id', ses.escape_room_id)
      .single()

    ses.escape_rooms = er
    setSesion(ses)
    setEscapeRoom(er)

    const { data: ests } = await supabase
      .from('estaciones')
      .select('*')
      .eq('escape_room_id', ses.escape_room_id)
      .order('numero')

    setEstaciones(ests ?? [])

    const eqState = location.state?.equipo
    const eqStored = (() => {
      try { return JSON.parse(sessionStorage.getItem(EQUIPO_KEY)) }
      catch { return null }
    })()
    const eq = eqState || eqStored

    if (eq && eq.sesion_id === ses.id) {
      setEquipo(eq)
      setPantalla('historia')
    } else {
      navigate('/jugar', { state: { codigo: codigoSala } })
    }
  }

  const handleUnirse = (sesData, eqData) => {
    setSesion(sesData)
    setEscapeRoom(sesData.escape_rooms)
    setEquipo(eqData)
    navigate(`/jugar/${sesData.codigo_sala}`, { state: { equipo: eqData }, replace: true })
  }

  if (pantalla === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (pantalla === 'entrada' || !codigoSala) {
    return <PantallaEntrada estadoInicial={location.state} onUnirse={handleUnirse} />
  }

  if (pantalla === 'historia') {
    return (
      <PantallaHistoria
        historia={escapeRoom?.historia}
        nombreRoom={escapeRoom?.nombre ?? 'Escape Room'}
        onComenzar={() => setPantalla('juego')}
      />
    )
  }

  if (pantalla === 'juego') {
    return (
      <PantallaJuego
        sesion={sesion}
        escapeRoom={escapeRoom}
        equipo={equipo}
        estaciones={estaciones}
        onTerminar={(tiempo, puntos) => {
          setResultado({ tiempo, puntos })
          sessionStorage.removeItem(EQUIPO_KEY)
          setPantalla('victoria')
        }}
      />
    )
  }

  if (pantalla === 'victoria') {
    return (
      <PantallaVictoria
        equipo={equipo}
        tiempoUsado={resultado?.tiempo ?? 0}
        puntos={resultado?.puntos ?? 0}
        sesionId={sesion?.id}
      />
    )
  }

  return null
}
