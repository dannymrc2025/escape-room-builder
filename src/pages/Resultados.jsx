import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  ChevronLeft, Download, Trophy, Clock, Star,
  MapPin, Target, AlertCircle, Loader2, BookOpen
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────
function fmtTiempo(seg) {
  const s = Math.max(0, Math.floor(seg ?? 0))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── Podio ────────────────────────────────────────────────────
function Podio({ top3 }) {
  const ORDEN = [1, 0, 2] // columnas: 2°, 1°, 3°
  const ALTURAS = ['h-20', 'h-32', 'h-14']
  const COLORES = [
    'bg-gradient-to-b from-yellow-400 to-yellow-600',
    'bg-gradient-to-b from-gray-300 to-gray-500',
    'bg-gradient-to-b from-orange-400 to-orange-600',
  ]
  const MEDALLAS = ['🥇', '🥈', '🥉']
  const NUMS = ['1°', '2°', '3°']

  if (top3.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-3 mt-4 mb-2 px-4">
      {ORDEN.map((idx) => {
        const equipo = top3[idx]
        const col = idx === 0 ? 1 : idx === 1 ? 0 : 2 // posición display (1°,2°,3°)
        const displayPos = col
        if (!equipo) return <div key={idx} className="flex-1 max-w-[120px]" />
        return (
          <div key={idx} className="flex-1 max-w-[120px] flex flex-col items-center gap-1">
            <span className="text-2xl">{MEDALLAS[idx]}</span>
            <div className={`text-center px-2 ${idx === 0 ? 'scale-110' : ''}`}>
              <p className="text-xs font-bold text-gray-700 truncate max-w-[100px]">{equipo.nombre}</p>
              <p className="text-xs text-gray-500">{equipo.puntos_total} pts</p>
              <p className="text-xs text-gray-400">{fmtTiempo(equipo.tiempo_total)}</p>
            </div>
            <div className={`w-full ${ALTURAS[idx]} ${COLORES[idx]} rounded-t-xl flex items-center justify-center`}>
              <span className="text-white font-extrabold text-lg">{NUMS[idx]}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tooltip personalizado ─────────────────────────────────────
function TooltipBarra({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow text-sm">
      <p className="font-semibold text-gray-700">{payload[0].payload.label}</p>
      <p className="text-blue-600">{payload[0].value.toFixed(1)} intentos promedio</p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export default function Resultados() {
  const { sesionId } = useParams()
  const navigate = useNavigate()

  const [sesion, setSesion] = useState(null)
  const [escapeRoom, setEscapeRoom] = useState(null)
  const [resultados, setResultados] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [progreso, setProgreso] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sesionId) return
    cargar()
  }, [sesionId]) // eslint-disable-line

  const cargar = async () => {
    setLoading(true)
    const [{ data: sesData }, { data: resData }, { data: progData }] = await Promise.all([
      supabase.from('sesiones').select('*, escape_rooms(*)').eq('id', sesionId).single(),
      supabase.from('resultados_finales').select('*, equipos(nombre, estaciones_resueltas, intentos_totales)')
        .eq('sesion_id', sesionId)
        .order('puntos_total', { ascending: false })
        .order('tiempo_total', { ascending: true }),
      supabase.from('progreso').select('*').eq('sesion_id', sesionId),
    ])

    if (!sesData) { setError('Sesión no encontrada.'); setLoading(false); return }

    setSesion(sesData)
    setEscapeRoom(sesData.escape_rooms)
    setResultados(resData ?? [])
    setProgreso(progData ?? [])

    if (sesData.escape_rooms?.id) {
      const { data: ests } = await supabase
        .from('estaciones')
        .select('*')
        .eq('escape_room_id', sesData.escape_rooms.id)
        .order('numero')
      setEstaciones(ests ?? [])
    }

    setLoading(false)
  }

  // ── Análisis pedagógico ────────────────────────────────────
  const analisis = useMemo(() => {
    if (!estaciones.length || !progreso.length) return []
    return estaciones.map((est) => {
      const intentosEst = progreso.filter((p) => p.estacion_id === est.id)
      const equiposUnicos = [...new Set(intentosEst.map((p) => p.equipo_id))]
      const totalIntentos = intentosEst.length
      const promedio = equiposUnicos.length > 0
        ? totalIntentos / equiposUnicos.length
        : 0
      return {
        id: est.id,
        label: `Est. ${est.numero}`,
        titulo: est.titulo,
        promedio: Math.round(promedio * 10) / 10,
      }
    })
  }, [estaciones, progreso])

  const estacionMasDificil = useMemo(() => {
    if (!analisis.length) return null
    return analisis.reduce((max, e) => (e.promedio > max.promedio ? e : max), analisis[0])
  }, [analisis])

  // ── Exportar CSV ───────────────────────────────────────────
  const exportarCSV = () => {
    const encabezado = ['Posicion', 'Equipo', 'Puntos', 'Tiempo', 'Estaciones completadas', 'Intentos totales']
    const filas = resultados.map((r, i) => [
      i + 1,
      `"${r.equipos?.nombre ?? ''}"`,
      r.puntos_total ?? 0,
      fmtTiempo(r.tiempo_total),
      r.equipos?.estaciones_resueltas ?? 0,
      r.equipos?.intentos_totales ?? 0,
    ])
    const csv = [encabezado, ...filas].map((f) => f.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados_${escapeRoom?.nombre?.replace(/\s+/g, '_') ?? 'sesion'}_${sesionId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
          Volver al dashboard
        </button>
      </div>
    )
  }

  const top3 = resultados.slice(0, 3).map((r) => ({
    nombre: r.equipos?.nombre ?? '—',
    puntos_total: r.puntos_total ?? 0,
    tiempo_total: r.tiempo_total ?? 0,
  }))

  const BARRA_COLS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-600 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                {escapeRoom?.nombre ?? 'Resultados'}
              </h1>
              <p className="text-xs text-gray-400">{fmtFecha(sesion?.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-xl transition"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats generales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: 'Equipos', val: resultados.length },
            { icon: <MapPin className="w-5 h-5 text-blue-500" />, label: 'Estaciones', val: estaciones.length },
            {
              icon: <Star className="w-5 h-5 text-violet-500" />,
              label: 'Mejor puntaje',
              val: resultados[0]?.puntos_total ?? '—'
            },
            {
              icon: <Clock className="w-5 h-5 text-green-500" />,
              label: 'Mejor tiempo',
              val: resultados[0] ? fmtTiempo(resultados[0].tiempo_total) : '—'
            },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="bg-gray-50 rounded-xl p-2">{icon}</div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-800">{val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Podio */}
        {top3.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Podio
            </h2>
            <Podio top3={top3} />
          </div>
        )}

        {/* Tabla de posiciones */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" /> Clasificación completa
            </h2>
          </div>
          {resultados.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No hay resultados registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <tr>
                    {['#', 'Equipo', 'Puntos', 'Tiempo', 'Estaciones', 'Intentos'].map((h) => (
                      <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultados.map((r, i) => {
                    const medal = ['🥇', '🥈', '🥉'][i] ?? null
                    return (
                      <tr key={r.id} className={`hover:bg-gray-50 transition ${i === 0 ? 'bg-yellow-50/50' : ''}`}>
                        <td className="px-5 py-3 font-bold text-gray-500">
                          {medal
                            ? <span className="text-lg">{medal}</span>
                            : <span>{i + 1}</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{r.equipos?.nombre ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className="bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded-full text-xs">
                            {r.puntos_total ?? 0} pts
                          </span>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-gray-600">{fmtTiempo(r.tiempo_total)}</td>
                        <td className="px-5 py-3 text-gray-600">{r.equipos?.estaciones_resueltas ?? 0} / {estaciones.length}</td>
                        <td className="px-5 py-3 text-gray-600">{r.equipos?.intentos_totales ?? 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Análisis pedagógico */}
        {analisis.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" /> Análisis pedagógico
            </h2>
            <p className="text-sm text-gray-500">Intentos promedio por estación (todos los equipos)</p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analisis} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} width={32} />
                <Tooltip content={<TooltipBarra />} />
                <Bar dataKey="promedio" radius={[6, 6, 0, 0]}>
                  {analisis.map((entry, i) => (
                    <Cell
                      key={entry.id}
                      fill={
                        entry.id === estacionMasDificil?.id
                          ? '#EF4444'
                          : BARRA_COLS[i % BARRA_COLS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {estacionMasDificil && estacionMasDificil.promedio > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    La estación {analisis.findIndex((e) => e.id === estacionMasDificil.id) + 1}
                    {estacionMasDificil.titulo ? ` — "${estacionMasDificil.titulo}"` : ''} tuvo más dificultad
                    ({estacionMasDificil.promedio} intentos promedio).
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Considera repasar este tema con el grupo antes de la próxima sesión.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Volver */}
        <div className="flex justify-center pb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-5 py-2.5 rounded-xl transition"
          >
            <ChevronLeft className="w-4 h-4" /> Volver al dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
