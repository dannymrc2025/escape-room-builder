import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, LogOut, MapPin, Layers, Calendar,
  MoreVertical, Edit, BarChart2, Copy, Archive, Trash2,
  Play, Square, Lock, X, ClipboardCopy, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const ESTADOS = ['Todos', 'Activo', 'Inactivo', 'En curso']

function genCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function BadgeEstado({ estado }) {
  const map = {
    activo: 'bg-green-100 text-green-700',
    inactivo: 'bg-gray-100 text-gray-500',
    'en curso': 'bg-yellow-100 text-yellow-700',
  }
  const clase = map[estado?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${clase}`}>
      {estado}
    </span>
  )
}

function MenuAcciones({ room, onActivar, onDesactivar, onEditar, onResultados, onDuplicar, onArchivar, onEliminar }) {
  const [open, setOpen] = useState(false)

  const items = [
    room.estado === 'activo'
      ? { label: 'Desactivar', icon: <Square className="w-4 h-4" />, action: onDesactivar }
      : { label: 'Activar', icon: <Play className="w-4 h-4" />, action: onActivar },
    { label: 'Editar', icon: <Edit className="w-4 h-4" />, action: onEditar },
    { label: 'Ver resultados', icon: <BarChart2 className="w-4 h-4" />, action: onResultados },
    { label: 'Duplicar', icon: <Copy className="w-4 h-4" />, action: onDuplicar },
    { label: 'Archivar', icon: <Archive className="w-4 h-4" />, action: onArchivar, danger: true },
    { label: 'Eliminar', icon: <Trash2 className="w-4 h-4" />, action: onEliminar, danger: true },
  ]

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44 text-sm">
            {items.map(({ label, icon, action, danger }) => (
              <button
                key={label}
                onClick={(e) => { e.stopPropagation(); setOpen(false); action() }}
                className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition text-left ${danger ? 'text-red-500' : 'text-gray-700'}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ModalCodigo({ codigo, onClose }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-green-100 rounded-full p-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">¡Escape Room Activado!</h2>
          <p className="text-gray-500 text-sm">Comparte este código con tus alumnos para que puedan unirse:</p>
          <div className="bg-gray-50 border-2 border-dashed border-blue-300 rounded-xl px-8 py-4 w-full">
            <span className="text-5xl font-extrabold tracking-widest text-blue-700">{codigo}</span>
          </div>
          <p className="text-xs text-gray-400">Los alumnos lo ingresan en la pantalla de inicio del juego</p>
          <button
            onClick={copiar}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {copiado ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
            {copiado ? '¡Copiado!' : 'Copiar código'}
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition underline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [modalCodigo, setModalCodigo] = useState(null) // string | null
  const [errorFetch, setErrorFetch] = useState('')

  const fetchRooms = async () => {
    setLoading(true)
    setErrorFetch('')
    const { data, error } = await supabase
      .from('escape_rooms')
      .select('*')
    console.log('fetchRooms:', data, error)
    if (error) {
      setErrorFetch(`DB Error: ${error.message} | code: ${error.code} | hint: ${error.hint}`)
    } else {
      setRooms((data ?? []).filter(r => !r.archivado))
    }
    setLoading(false)
  }

  useEffect(() => { fetchRooms() }, [])

  const filtrados = useMemo(() => {
    return rooms.filter((r) => {
      const matchNombre = r.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      const matchEstado =
        filtroEstado === 'Todos' ||
        r.estado?.toLowerCase() === filtroEstado.toLowerCase()
      return matchNombre && matchEstado
    })
  }, [rooms, busqueda, filtroEstado])

  const handleCerrarSesion = () => {
    sessionStorage.removeItem('maestro_auth')
    navigate('/')
  }

  const handleVerCodigo = async (room) => {
    const { data } = await supabase
      .from('sesiones')
      .select('codigo_sala')
      .eq('escape_room_id', room.id)
      .eq('estado', 'activo')
      .limit(1)
    const codigo = data?.[0]?.codigo_sala
    if (codigo) setModalCodigo(codigo)
    else alert('No se encontró el código de sala. Desactiva y vuelve a activar el escape room.')
  }

  const handleActivar = async (room) => {
    const codigo = genCodigo()
    const { error: errRoom } = await supabase
      .from('escape_rooms')
      .update({ estado: 'activo' })
      .eq('id', room.id)
    if (errRoom) { console.error(errRoom); return }

    await supabase.from('sesiones').insert({
      escape_room_id: room.id,
      codigo_sala: codigo,
      estado: 'activo',
    })

    setModalCodigo(codigo)
    fetchRooms()
  }

  const handleDesactivar = async (room) => {
    await supabase.from('escape_rooms').update({ estado: 'inactivo' }).eq('id', room.id)
    fetchRooms()
  }

  const handleDuplicar = async (room) => {
    const { id, created_at, updated_at, ...rest } = room
    await supabase.from('escape_rooms').insert({ ...rest, nombre: `${rest.nombre} (copia)`, estado: 'inactivo' })
    fetchRooms()
  }

  const handleArchivar = async (room) => {
    await supabase.from('escape_rooms').update({ archivado: true }).eq('id', room.id)
    fetchRooms()
  }

  const handleEliminar = async (room) => {
    if (!window.confirm(`¿Eliminar "${room.nombre}" permanentemente? Esta acción no se puede deshacer.`)) return
    await supabase.from('estaciones').delete().eq('escape_room_id', room.id)
    await supabase.from('escape_rooms').delete().eq('id', room.id)
    fetchRooms()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-600" /> Mis Escape Rooms
          </h1>
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Acciones superiores */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          {/* Filtro estado */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-wrap sm:flex-nowrap">
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  filtroEstado === e
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Botón nuevo */}
          <button
            onClick={() => navigate('/crear')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nuevo Escape Room
          </button>
        </div>

        {/* Error de carga */}
        {errorFetch && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-mono break-all">
            {errorFetch}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-52" />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-blue-50 rounded-full p-6 mb-4">
              <Lock className="w-12 h-12 text-blue-300" />
            </div>
            {busqueda || filtroEstado !== 'Todos' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-600 mb-1">Sin resultados</h2>
                <p className="text-gray-400 text-sm">Prueba con otro nombre o filtro.</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">¡Crea tu primer Escape Room!</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">
                  Diseña experiencias de aprendizaje únicas para tus alumnos. ¡Empieza ahora!
                </p>
                <button
                  onClick={() => navigate('/crear')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow"
                >
                  <Plus className="w-4 h-4" /> Crear Escape Room
                </button>
              </>
            )}
          </div>
        )}

        {/* Grid de tarjetas */}
        {!loading && filtrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3"
              >
                {/* Nombre + menú */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-800 text-base leading-tight flex-1">{room.nombre}</h3>
                  <MenuAcciones
                    room={room}
                    onActivar={() => handleActivar(room)}
                    onDesactivar={() => handleDesactivar(room)}
                    onEditar={() => navigate(`/editar/${room.id}`)}
                    onResultados={() => navigate(`/resultados/${room.id}`)}
                    onDuplicar={() => handleDuplicar(room)}
                    onArchivar={() => handleArchivar(room)}
                    onEliminar={() => handleEliminar(room)}
                  />
                </div>

                {/* Chips tema y nivel */}
                <div className="flex flex-wrap gap-1.5">
                  {room.tema && (
                    <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {room.tema}
                    </span>
                  )}
                  {room.nivel && (
                    <span className="bg-purple-50 text-purple-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {room.nivel}
                    </span>
                  )}
                </div>

                {/* Estaciones + estado */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {room.num_estaciones ?? 0} estaciones
                  </span>
                  <BadgeEstado estado={room.estado ?? 'inactivo'} />
                </div>

                {/* Botón ver código si está activo */}
                {room.estado === 'activo' && (
                  <button
                    onClick={() => handleVerCodigo(room)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition w-full justify-center"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" /> Ver código de sala
                  </button>
                )}

                {/* Fecha */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(room.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal código */}
      {modalCodigo && (
        <ModalCodigo codigo={modalCodigo} onClose={() => setModalCodigo(null)} />
      )}
    </div>
  )
}
