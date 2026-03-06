import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock, Users, ChevronLeft, Pause, Play, Plus,
  Flag, Send, X, AlertTriangle, Wifi, WifiOff,
  MapPin, Target, RefreshCw, FileText, Download, Trophy
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Helpers ─────────────────────────────────────────────────
function fmtTiempo(seg) {
  const s = Math.max(0, Math.floor(seg))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Extrae el grupo del nombre: "Juan (2A)" → "2A"  |  "Equipo [2A] · ..." → "2A"
function extraerGrupo(nombre) {
  const m1 = nombre?.match(/\(([^)]+)\)$/)
  if (m1) return m1[1]
  const m2 = nombre?.match(/\[([^\]]+)\]/)
  if (m2) return m2[1]
  return 'Sin grupo'
}
  const s = Math.max(0, Math.floor(seg))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}m ${ss}s`
}

// ─── Barra de progreso ────────────────────────────────────────
function BarraProgreso({ valor, total, color = 'bg-blue-500' }) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Modal pista ──────────────────────────────────────────────
function ModalPista({ equipo, onClose, onEnviar }) {
  const [pista, setPista] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    if (!pista.trim()) return
    setEnviando(true)
    await onEnviar(equipo.id, pista.trim())
    setEnviando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-500" /> Enviar pista extra
        </h2>
        <p className="text-sm text-gray-500 mb-4">Equipo: <strong>{equipo.nombre}</strong></p>
        <textarea
          value={pista}
          onChange={(e) => setPista(e.target.value)}
          placeholder="Escribe la pista que verá el equipo..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition">
            Cancelar
          </button>
          <button onClick={enviar} disabled={!pista.trim() || enviando}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
            {enviando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal finalizar con descarga de PDFs ───────────────────
const GRUPOS_PDF = ['Todos', '2A', '2C', '2D', '2F Leona']

function ModalFinalizar({ sesionId, escapeRoomNombre, sesionCreatedAt, totalEstaciones, onConfirmar, onCancelar, cargando }) {
  const [resultados, setResultados] = useState([])
  const [loadingRes, setLoadingRes] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    supabase
      .from('resultados_finales')
      .select('*, equipos(nombre, estaciones_resueltas, intentos_totales)')
      .eq('sesion_id', sesionId)
      .order('puntos_total', { ascending: false })
      .order('tiempo_total', { ascending: true })
      .then(({ data }) => { setResultados(data ?? []); setLoadingRes(false) })
  }, [sesionId])

  const generarPDF = (grupo) => {
    const filtrados = grupo === 'Todos'
      ? resultados
      : resultados.filter((r) => extraerGrupo(r.equipos?.nombre) === grupo)

    if (filtrados.length === 0) { alert(`No hay resultados para el grupo ${grupo}.`); return }

    const filas = filtrados.map((r, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`
      return `<tr class="${i === 0 ? 'gold' : i % 2 === 0 ? 'even' : ''}">
        <td style="text-align:center;font-size:18px">${medal}</td>
        <td>${r.equipos?.nombre ?? '—'}</td>
        <td style="text-align:center"><span class="badge">${r.puntos_total ?? 0} pts</span></td>
        <td style="text-align:center">${fmtTiempo(r.tiempo_total)}</td>
        <td style="text-align:center">${r.equipos?.estaciones_resueltas ?? 0} / ${totalEstaciones}</td>
        <td style="text-align:center">${r.equipos?.intentos_totales ?? 0}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Resultados ${escapeRoomNombre} — ${grupo}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; padding:32px; color:#1f2937; }
  .header { display:flex; align-items:center; gap:16px; margin-bottom:24px; border-bottom:2px solid #e5e7eb; padding-bottom:16px; }
  h1 { font-size:22px; font-weight:800; color:#1e3a8a; }
  .meta { font-size:12px; color:#6b7280; margin-top:2px; }
  .gbadge { display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:11px; font-weight:700; padding:2px 10px; border-radius:999px; margin-left:6px; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
  thead tr { background:#1e3a8a; color:#fff; }
  th { padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
  td { padding:9px 14px; border-bottom:1px solid #f3f4f6; }
  .gold td { background:#fef9c3; font-weight:600; }
  .even td { background:#f9fafb; }
  .badge { background:#ede9fe; color:#5b21b6; padding:2px 10px; border-radius:999px; font-weight:700; font-size:12px; }
  .footer { margin-top:24px; text-align:center; font-size:11px; color:#9ca3af; }
</style></head>
<body>
  <div class="header">
    <span style="font-size:36px">🔐</span>
    <div>
      <h1>${escapeRoomNombre}${grupo !== 'Todos' ? ` <span class="gbadge">${grupo}</span>` : ''}</h1>
      <p class="meta">${fmtFecha(sesionCreatedAt)} &nbsp;·&nbsp; ${filtrados.length} participante${filtrados.length !== 1 ? 's' : ''}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Alumno / Equipo</th><th>Puntos</th><th>Tiempo</th><th>Estaciones</th><th>Intentos</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="footer">Generado el ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
</body></html>`

    const w = window.open('', '_blank', 'width=900,height=650')
    if (!w) { alert('Permite ventanas emergentes para generar el PDF.'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Finalizar sesión</h2>
            <p className="text-sm text-gray-500 mt-0.5">Descarga los resultados antes de cerrar.</p>
          </div>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 transition mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descarga por grupo */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Descargar PDF por grupo
          </p>
          {loadingRes ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Cargando resultados...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {GRUPOS_PDF.map((g) => {
                const count = g === 'Todos'
                  ? resultados.length
                  : resultados.filter((r) => extraerGrupo(r.equipos?.nombre) === g).length
                return (
                  <button
                    key={g}
                    onClick={() => generarPDF(g)}
                    disabled={count === 0}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium text-gray-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-500" />
                      {g === 'Todos' ? 'Todos los grupos' : `Grupo ${g}`}
                    </span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Mini ranking */}
        {!loadingRes && resultados.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Trophy className="w-3.5 h-3.5" /> Top 3
            </p>
            {resultados.slice(0, 3).map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="text-base w-6 text-center">{['🥇','🥈','🥉'][i]}</span>
                <span className="flex-1 font-medium text-gray-700 truncate">{r.equipos?.nombre ?? '—'}</span>
                <span className="text-violet-600 font-bold text-xs">{r.puntos_total} pts</span>
                <span className="text-gray-400 text-xs tabular-nums">{fmtTiempo(r.tiempo_total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botones acción */}
        {confirmando ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ¿Confirmas cerrar la sesión?
            </p>
            <p className="text-xs text-red-500">Se detendrá el juego para todos los equipos y no podrá reactivarse.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmando(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-xl text-sm font-medium transition">
                Cancelar
              </button>
              <button onClick={onConfirmar} disabled={cargando}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:bg-gray-300 text-white py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {cargando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Sí, finalizar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmando(true)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <Flag className="w-4 h-4" /> Finalizar sesión
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta equipo ───────────────────────────────────────────
function TarjetaEquipo({ equipo, totalEstaciones, tiempoInicio, onPista }) {
  const pct = totalEstaciones > 0 ? equipo.estaciones_resueltas / totalEstaciones : 0
  const terminado = pct >= 1
  const colorBarra = terminado ? 'bg-green-500' : pct >= 0.5 ? 'bg-blue-500' : 'bg-amber-400'

  const calcSeg = () =>
    tiempoInicio
      ? Math.floor((Date.now() - new Date(tiempoInicio).getTime()) / 1000)
      : 0

  // Congelar el tiempo en el momento exacto que el equipo termina
  const [segFinal, setSegFinal] = useState(terminado ? calcSeg() : null)
  useEffect(() => {
    if (terminado && segFinal === null) setSegFinal(calcSeg())
  }, [terminado]) // eslint-disable-line

  const segTranscurridos = terminado && segFinal !== null ? segFinal : calcSeg()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      {/* Nombre + estado */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-800 text-base">{equipo.nombre}</h3>
          {pct >= 1 && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              ¡Completado!
            </span>
          )}
        </div>
        <button
          onClick={() => onPista(equipo)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-lg transition whitespace-nowrap"
        >
          <Send className="w-3 h-3" /> Pista
        </button>
      </div>

      {/* Progreso */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso</span>
          <span className="font-semibold text-gray-700">
            {equipo.estaciones_resueltas ?? 0} / {totalEstaciones}
          </span>
        </div>
        <BarraProgreso valor={equipo.estaciones_resueltas ?? 0} total={totalEstaciones} color={colorBarra} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center mt-1">
        <div className="bg-gray-50 rounded-xl py-2 px-1">
          <p className="text-gray-400 mb-0.5 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> Estación
          </p>
          <p className="font-bold text-gray-800">{equipo.estacion_actual ?? 1}</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2 px-1">
          <p className="text-gray-400 mb-0.5 flex items-center justify-center gap-1">
            <Target className="w-3 h-3" /> Intentos
          </p>
          <p className="font-bold text-gray-800">{equipo.intentos_totales ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2 px-1">
          <p className="text-gray-400 mb-0.5 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Tiempo
          </p>
          <p className="font-bold text-gray-800">{fmtTranscurrido(segTranscurridos)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export default function Monitor() {
  const { sesionId } = useParams()
  const navigate = useNavigate()

  const [sesion, setSesion] = useState(null)
  const [escapeRoom, setEscapeRoom] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)

  // Timer
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [pausado, setPausado] = useState(false)
  const timerRef = useRef(null)

  // Modales
  const [equipoPista, setEquipoPista] = useState(null)
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  // ── Carga inicial ──────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    const { data: sesData } = await supabase
      .from('sesiones')
      .select('*, escape_rooms(*)')
      .eq('id', sesionId)
      .single()

    if (!sesData) { setLoading(false); return }

    setSesion(sesData)
    setEscapeRoom(sesData.escape_rooms)

    const minutos = sesData.escape_rooms?.tiempo_limite ?? 30
    setTiempoRestante(minutos * 60)

    const { data: eqData } = await supabase
      .from('equipos')
      .select('*')
      .eq('sesion_id', sesionId)
      .order('nombre')

    setEquipos(eqData ?? [])
    setLoading(false)
  }, [sesionId])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ── Realtime ───────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`monitor_${sesionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipos', filter: `sesion_id=eq.${sesionId}` },
        (payload) => {
          setOnline(true)
          if (payload.eventType === 'INSERT') {
            setEquipos((prev) => [...prev, payload.new].sort((a, b) => a.nombre.localeCompare(b.nombre)))
          } else if (payload.eventType === 'UPDATE') {
            setEquipos((prev) => prev.map((e) => e.id === payload.new.id ? payload.new : e))
          } else if (payload.eventType === 'DELETE') {
            setEquipos((prev) => prev.filter((e) => e.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progreso', filter: `sesion_id=eq.${sesionId}` },
        (payload) => {
          setOnline(true)
          // Refrescar equipo afectado
          if (payload.new?.equipo_id) {
            supabase
              .from('equipos')
              .select('*')
              .eq('id', payload.new.equipo_id)
              .single()
              .then(({ data }) => {
                if (data) setEquipos((prev) => prev.map((e) => e.id === data.id ? data : e))
              })
          }
        }
      )
      .subscribe((status) => {
        setOnline(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [sesionId])

  // ── Polling de respaldo (cada 15 seg por si falla el realtime) ──
  useEffect(() => {
    const poll = setInterval(async () => {
      const { data } = await supabase.from('equipos').select('*').eq('sesion_id', sesionId).order('nombre')
      if (data) setEquipos(data)
    }, 15000)
    return () => clearInterval(poll)
  }, [sesionId])

  // ── Temporizador ───────────────────────────────────────────
  useEffect(() => {
    if (pausado) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setTiempoRestante((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [pausado])

  const agregarCinco = () => setTiempoRestante((t) => t + 300)

  // ── Enviar pista ───────────────────────────────────────────
  const enviarPista = async (equipoId, texto) => {
    await supabase.from('pistas_extra').insert({
      equipo_id: equipoId,
      sesion_id: sesionId,
      texto,
    })
  }

  // ── Finalizar sesión ───────────────────────────────────────
  const finalizarSesion = async () => {
    setFinalizando(true)
    await supabase
      .from('sesiones')
      .update({ estado: 'finalizada', finalizada_at: new Date().toISOString() })
      .eq('id', sesionId)
    // Regresar el escape room a inactivo
    if (sesion?.escape_room_id) {
      await supabase
        .from('escape_rooms')
        .update({ estado: 'inactivo' })
        .eq('id', sesion.escape_room_id)
    }
    setFinalizando(false)
    setMostrarFinalizar(false)
    navigate(`/resultados/${sesionId}`)
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!sesion) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Sesión no encontrada.</p>
        <button onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:underline text-sm">Volver al dashboard</button>
      </div>
    )
  }

  const tiempoAgotado = tiempoRestante <= 0
  const colorTimer = tiempoRestante < 60
    ? 'text-red-500'
    : tiempoRestante < 300
    ? 'text-amber-500'
    : 'text-white'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Izquierda: back + info */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">
                  {escapeRoom?.nombre ?? 'Monitor'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">Código:</span>
                  <span className="text-sm font-extrabold tracking-widest text-blue-400">
                    {sesion.codigo_sala}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ml-2 ${online ? 'text-green-400' : 'text-red-400'}`}>
                    {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {online ? 'En vivo' : 'Sin conexión'}
                  </span>
                </div>
              </div>
            </div>

            {/* Centro: temporizador */}
            <div className="flex flex-col items-center">
              <span className={`text-4xl font-extrabold tabular-nums tracking-tight ${colorTimer} ${tiempoAgotado ? 'animate-pulse' : ''}`}>
                {fmtTiempo(tiempoRestante)}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                {tiempoAgotado ? '¡Tiempo agotado!' : pausado ? 'Pausado' : 'Tiempo restante'}
              </span>
            </div>

            {/* Derecha: controles */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => setPausado((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border border-gray-600 text-gray-200 hover:bg-gray-700 transition"
              >
                {pausado ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {pausado ? 'Reanudar' : 'Pausar'}
              </button>
              <button
                onClick={agregarCinco}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border border-gray-600 text-gray-200 hover:bg-gray-700 transition"
              >
                <Plus className="w-4 h-4" /> +5 min
              </button>
              <button
                onClick={() => setMostrarFinalizar(true)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition"
              >
                <Flag className="w-4 h-4" /> Finalizar sesión
              </button>
            </div>
          </div>

          {/* Sub-barra: equipos conectados */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              <strong className="text-white">{equipos.length}</strong> equipo{equipos.length !== 1 ? 's' : ''} conectado{equipos.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Grid equipos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {equipos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-12 h-12 text-gray-600 mb-4" />
            <h2 className="text-lg font-semibold text-gray-400 mb-1">Esperando equipos...</h2>
            <p className="text-gray-600 text-sm">Los equipos aparecerán aquí cuando se unan con el código.</p>
            <p className="text-blue-400 text-2xl font-extrabold tracking-widest mt-4">{sesion.codigo_sala}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipos.map((eq) => (
              <TarjetaEquipo
                key={eq.id}
                equipo={eq}
                totalEstaciones={escapeRoom?.num_estaciones ?? 0}
                tiempoInicio={sesion.created_at}
                onPista={setEquipoPista}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal pista */}
      {equipoPista && (
        <ModalPista
          equipo={equipoPista}
          onClose={() => setEquipoPista(null)}
          onEnviar={enviarPista}
        />
      )}

      {/* Modal finalizar */}
      {mostrarFinalizar && (
        <ModalFinalizar
          sesionId={sesionId}
          escapeRoomNombre={escapeRoom?.nombre ?? 'Escape Room'}
          sesionCreatedAt={sesion?.created_at}
          totalEstaciones={escapeRoom?.num_estaciones ?? 0}
          onConfirmar={finalizarSesion}
          onCancelar={() => setMostrarFinalizar(false)}
          cargando={finalizando}
        />
      )}
    </div>
  )
}
