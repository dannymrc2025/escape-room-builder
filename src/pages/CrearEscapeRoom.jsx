import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Loader2,
  Swords, Search, Rocket, Sparkles, RefreshCw,
  BookOpen, Clock, MapPin, FileText, Wand2, Trophy, Unlock,
  Plus, Trash2, Upload, Download, AlertCircle,
  Table2, PenLine, X, Image as ImageIcon
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Constantes ───────────────────────────────────────────────
const PASOS = ['Datos generales', 'Historia con IA', 'Estaciones', 'Revisar y guardar']

const TONOS = [
  { id: 'aventura',        label: 'Aventura',         icon: <Swords className="w-6 h-6" />,   color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { id: 'misterio',        label: 'Misterio',          icon: <Search className="w-6 h-6" />,   color: 'text-violet-500', bg: 'bg-violet-50 border-violet-200' },
  { id: 'ciencia ficción', label: 'Ciencia ficción',   icon: <Rocket className="w-6 h-6" />,   color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200'   },
  { id: 'fantasy',         label: 'Fantasy',            icon: <Sparkles className="w-6 h-6" />, color: 'text-pink-500',   bg: 'bg-pink-50 border-pink-200'   },
]

// ─── Barra de progreso ────────────────────────────────────────
function BarraProgreso({ paso }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Línea de fondo */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        {/* Línea de progreso */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{ width: `${(paso / (PASOS.length - 1)) * 100}%` }}
        />
        {PASOS.map((nombre, i) => (
          <div key={i} className="flex flex-col items-center z-10 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i < paso
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : i === paso
                  ? 'bg-white border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {i < paso ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium text-center hidden sm:block ${
              i <= paso ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Paso 1: Datos generales ──────────────────────────────────
function Paso1({ datos, setDatos, errores }) {
  const campo = (key, value) => setDatos((d) => ({ ...d, [key]: value }))

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Datos generales</h2>
      <p className="text-sm text-gray-500 mb-4">Completa la información básica de tu escape room.</p>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre del escape room <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={datos.nombre}
          onChange={(e) => campo('nombre', e.target.value)}
          placeholder="Ej: La bóveda del tiempo perdido"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.nombre ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
        {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
      </div>

      {/* Tema + Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tema matemático <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={datos.tema}
            onChange={(e) => campo('tema', e.target.value)}
            placeholder="Ej: Fracciones, Álgebra..."
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.tema ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          {errores.tema && <p className="text-red-500 text-xs mt-1">{errores.tema}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nivel / Grado <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={datos.nivel}
            onChange={(e) => campo('nivel', e.target.value)}
            placeholder="Ej: 3° Secundaria"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.nivel ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          {errores.nivel && <p className="text-red-500 text-xs mt-1">{errores.nivel}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Descripción <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={datos.descripcion}
          onChange={(e) => campo('descripcion', e.target.value)}
          placeholder="Breve descripción del escape room..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
      </div>

      {/* Tiempo + Estaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Tiempo límite (min)
          </label>
          <input
            type="number"
            min={5}
            max={180}
            value={datos.tiempo_limite}
            onChange={(e) => campo('tiempo_limite', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Número de estaciones
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={datos.num_estaciones}
            onChange={(e) => campo('num_estaciones', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Paso 2: Historia con IA ──────────────────────────────────
function Paso2({ datos, setDatos, imagenPortada, setImagenPortada }) {
  const [generando, setGenerando] = useState(false)
  const [generandoCierre, setGenerandoCierre] = useState(false)
  const [error, setError] = useState('')

  const setTono = (tono) => setDatos((d) => ({ ...d, tono }))
  const setHistoria = (historia) => setDatos((d) => ({ ...d, historia }))

  const generarCierre = async () => {
    setGenerandoCierre(true)
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          system:
            'Eres un escritor creativo para escape rooms educativos de matemáticas. ' +
            'Escribe un mensaje de cierre épico de 60-80 palabras para cuando el jugador completa el escape room. ' +
            'Debe celebrar la victoria, cerrar la historia y destacar los logros matemáticos. ' +
            'Solo devuelve el texto, sin títulos ni comillas.',
          messages: [{
            role: 'user',
            content:
              `Escape room: "${datos.nombre}". Tema: ${datos.tema}. Nivel: ${datos.nivel}. ` +
              `Historia: ${datos.historia || '(sin historia)'}`,
          }],
        }),
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      const json = await resp.json()
      setDatos((d) => ({ ...d, retroalimentacion_final: json.content?.[0]?.text ?? '' }))
    } catch {
      // silently fail — user can type manually
    } finally {
      setGenerandoCierre(false)
    }
  }

  const generarHistoria = async () => {
    setGenerando(true)
    setError('')
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 500,
          system:
            'Eres un escritor creativo para escape rooms educativos de matemáticas. ' +
            'Crea una historia de introducción de 80 a 120 palabras, emocionante, ' +
            'que plantee la misión claramente y mencione los desafíos a resolver. ' +
            'Solo devuelve la historia, sin títulos ni comillas.',
          messages: [
            {
              role: 'user',
              content:
                `Crea una historia de introducción para un escape room llamado "${datos.nombre}". ` +
                `Tema matemático: ${datos.tema}. Nivel: ${datos.nivel}. ` +
                `Tiene ${datos.num_estaciones} estaciones. ` +
                `Tono: ${datos.tono}.`,
            },
          ],
        }),
      })
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        console.error('Anthropic error:', resp.status, errBody)
        throw new Error(`Error ${resp.status}: ${errBody?.error?.message ?? ''}`)
      }
      const json = await resp.json()
      setHistoria(json.content?.[0]?.text ?? '')
    } catch (e) {
      setError('No se pudo generar la historia. Verifica tu API key o intenta de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Historia de introducción</h2>
        <p className="text-sm text-gray-500">Escribe la historia manualmente o genera una con IA. Este paso es opcional.</p>
      </div>

      {/* Imagen de portada */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <ImageIcon className="w-4 h-4 text-blue-500" /> Imagen de portada
          <span className="text-xs text-gray-400 font-normal">(opcional — aparece como fondo en la introducción)</span>
        </p>
        {imagenPortada ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
            <img
              src={URL.createObjectURL(imagenPortada)}
              alt="Portada"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setImagenPortada(null)}
              className="absolute top-2 right-2 bg-gray-900/70 hover:bg-red-600 text-white rounded-full p-1 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="absolute bottom-2 left-2 bg-gray-900/60 text-white text-xs px-2 py-0.5 rounded-full">
              {imagenPortada.name}
            </span>
          </div>
        ) : (
          <div
            onClick={() => document.getElementById('portada-input').click()}
            className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 rounded-xl cursor-pointer transition flex flex-col items-center gap-2 py-8"
          >
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-500">Haz clic para subir una imagen</p>
            <p className="text-xs text-gray-400">JPG o PNG · recomendado 1600×900px · máx. 5MB</p>
            <input
              id="portada-input"
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files[0]
                if (f && f.size <= 5 * 1024 * 1024) setImagenPortada(f)
                e.target.value = ''
              }}
            />
          </div>
        )}
      </div>

      {/* Textarea siempre visible */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-violet-500" /> Historia
        </p>
        <textarea
          value={datos.historia}
          onChange={(e) => setHistoria(e.target.value)}
          rows={6}
          placeholder="Escribe aquí la historia de introducción... (opcional)"
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 transition leading-relaxed"
        />
        <p className="text-xs text-gray-400">Puedes escribirla manualmente o usar la IA para generarla.</p>
      </div>

      {/* Retroalimentación final */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" /> Mensaje de cierre
          <span className="text-xs font-normal text-gray-400 ml-1">— al completar todas las estaciones</span>
        </p>
        <textarea
          value={datos.retroalimentacion_final}
          onChange={(e) => setDatos((d) => ({ ...d, retroalimentacion_final: e.target.value }))}
          rows={3}
          placeholder="Escribe el mensaje épico que verán al completar... (opcional)"
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 transition leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Aparecerá en la pantalla de victoria.</p>
          <button
            onClick={generarCierre}
            disabled={generandoCierre}
            className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 hover:text-yellow-500 border border-yellow-200 hover:border-yellow-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {generandoCierre
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
              : <><Wand2 className="w-3 h-3" /> Generar con IA</>}
          </button>
        </div>
      </div>

      {/* Selector de tono */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1 list-none">
          <Wand2 className="w-4 h-4" /> Generar con IA (opcional)
        </summary>
        <div className="mt-4 space-y-4 pl-1">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Elige un tono</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TONOS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTono(t.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer font-medium text-sm ${
                    datos.tono === t.id
                      ? `${t.bg} ${t.color} border-current shadow-sm scale-105`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={datos.tono === t.id ? t.color : 'text-gray-400'}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generarHistoria}
            disabled={generando || !datos.tono}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
          >
            {generando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando historia...</>
              : <><Wand2 className="w-4 h-4" /> Generar historia con IA</>
            }
          </button>
          {!datos.tono && <p className="text-xs text-gray-400">Selecciona un tono para habilitar la generación.</p>}
        </div>
      </details>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

// ─── Helpers CSV ─────────────────────────────────────────────
const COLUMNAS_CSV = ['estacion', 'titulo', 'problema', 'respuesta', 'pista_1', 'pista_2', 'puntos']
const PLANTILLA_CSV =
  COLUMNAS_CSV.join(',') + '\n' +
  '1,La sala de las fracciones,¿Cuánto es 1/2 + 1/4?,3/4,Busca un denominador común,El resultado es menor que 1,100\n'

function parseCSV(text) {
  const lineas = text.trim().split('\n').filter(Boolean)
  if (lineas.length < 2) return { errores: ['El archivo está vacío o solo tiene encabezado.'], estaciones: [] }
  const headers = lineas[0].split(',').map((h) => h.trim().toLowerCase())
  const faltantes = COLUMNAS_CSV.filter((c) => !headers.includes(c))
  if (faltantes.length > 0)
    return { errores: [`Columnas faltantes: ${faltantes.join(', ')}`], estaciones: [] }

  const estaciones = []
  const errores = []
  const numerosVistos = new Set()

  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue
    const vals = lineas[i].split(',').map((v) => v.trim())
    const row = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })
    if (!row.respuesta) errores.push(`Fila ${i}: la respuesta está vacía.`)
    if (numerosVistos.has(row.estacion))
      errores.push(`Fila ${i}: número de estación duplicado (${row.estacion}).`)
    numerosVistos.add(row.estacion)
    estaciones.push({
      numero: Number(row.estacion) || i,
      titulo: row.titulo || `Estación ${i}`,
      problema: row.problema || '',
      respuesta: row.respuesta || '',
      pista_1: row.pista_1 || '',
      pista_2: row.pista_2 || '',
      puntos: Number(row.puntos) || 100,
      mini_historia: '',
      retroalimentacion: '',
    })
  }
  return { errores, estaciones: errores.length > 0 ? [] : estaciones }
}

const EST_VACIA = () => ({ numero: 1, titulo: '', problema: '', respuesta: '', pista_1: '', pista_2: '', puntos: 100, mini_historia: '', retroalimentacion: '' })

// ─── Paso 3: Estaciones ────────────────────────────────────────
function Paso3({ estaciones, setEstaciones, errorPaso, datos }) {
  const [tab, setTab] = useState('csv')
  const [arrastrando, setArrastrando] = useState(false)
  const [erroresCSV, setErroresCSV] = useState([])
  const [preview, setPreview] = useState([])
  const [generandoNarrativa, setGenerandoNarrativa] = useState(false)
  const [errorNarrativa, setErrorNarrativa] = useState('')

  const generarNarrativa = async () => {
    if (estaciones.length === 0) return
    setGenerandoNarrativa(true)
    setErrorNarrativa('')
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2500,
          system:
            'Eres un escritor creativo para escape rooms educativos de matemáticas. ' +
            'Para cada estación genera: mini_historia (50-70 palabras que contextualizan el problema y sumergen al jugador en la narrativa) ' +
            'y retroalimentacion (35-50 palabras que celebran el éxito y sirven de puente narrativo a la siguiente estación, o de cierre épico si es la última). ' +
            'Responde SOLO con JSON válido sin markdown: [{"numero":1,"mini_historia":"...","retroalimentacion":"..."}, ...]',
          messages: [{
            role: 'user',
            content:
              `Escape room: "${datos?.nombre || 'Sin nombre'}". Tema: ${datos?.tema || ''}. ` +
              `Nivel: ${datos?.nivel || ''}. Tono: ${datos?.tono || 'aventura'}.\n` +
              `Historia de introducción: ${datos?.historia || '(sin historia)'}\n\n` +
              `Estaciones:\n${JSON.stringify(estaciones.map((e) => ({ numero: e.numero, titulo: e.titulo, problema: e.problema })))}`,
          }],
        }),
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      const json = await resp.json()
      const generadas = JSON.parse(json.content?.[0]?.text ?? '[]')
      setEstaciones((prev) =>
        prev.map((e) => {
          const gen = generadas.find((g) => g.numero === e.numero)
          return gen
            ? { ...e, mini_historia: gen.mini_historia || e.mini_historia, retroalimentacion: gen.retroalimentacion || e.retroalimentacion }
            : e
        })
      )
    } catch {
      setErrorNarrativa('No se pudo generar la narrativa. Intenta de nuevo.')
    } finally {
      setGenerandoNarrativa(false)
    }
  }

  const descargarPlantilla = () => {
    const blob = new Blob([PLANTILLA_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_estaciones.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const procesarArchivo = (file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) { setErroresCSV(['Solo se aceptan archivos .csv']); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const { errores, estaciones: parsed } = parseCSV(e.target.result)
      setErroresCSV(errores)
      if (errores.length === 0) { setPreview(parsed); setEstaciones(parsed) }
      else { setPreview([]); setEstaciones([]) }
    }
    reader.readAsText(file)
  }

  const onDrop = (e) => { e.preventDefault(); setArrastrando(false); procesarArchivo(e.dataTransfer.files[0]) }

  const addEstacion = () => {
    const sig = estaciones.length > 0 ? Math.max(...estaciones.map((e) => e.numero)) + 1 : 1
    setEstaciones((prev) => [...prev, { ...EST_VACIA(), numero: sig }])
  }
  const updateEst = (idx, key, val) =>
    setEstaciones((prev) => prev.map((e, i) => (i === idx ? { ...e, [key]: val } : e)))
  const removeEst = (idx) => setEstaciones((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Estaciones</h2>
        <p className="text-sm text-gray-500">Carga las estaciones por CSV o créalas manualmente.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['csv', <Upload className="w-4 h-4" />, 'Subir CSV'], ['manual', <PenLine className="w-4 h-4" />, 'Crear manualmente']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* TAB CSV */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <button onClick={descargarPlantilla}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 hover:border-blue-400 px-4 py-2 rounded-xl transition">
            <Download className="w-4 h-4" /> Descargar plantilla CSV
          </button>

          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('csv-input').click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition ${
              arrastrando ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}>
            <Upload className={`w-8 h-8 ${arrastrando ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600 font-medium text-center">
              Arrastra tu archivo CSV aquí<br />
              <span className="text-gray-400 font-normal">o haz clic para seleccionar</span>
            </p>
            <input id="csv-input" type="file" accept=".csv" className="hidden"
              onChange={(e) => procesarArchivo(e.target.files[0])} />
          </div>

          {erroresCSV.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              {erroresCSV.map((e, i) => (
                <p key={i} className="text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {e}
                </p>
              ))}
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Table2 className="w-4 h-4 text-green-500" /> {preview.length} estaciones cargadas correctamente
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold">
                    <tr>{['#','Título','Problema','Respuesta','Pista 1','Pista 2','Pts'].map((h) => (
                      <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{e.numero}</td>
                        <td className="px-3 py-2 max-w-[120px] truncate">{e.titulo}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate">{e.problema}</td>
                        <td className="px-3 py-2 font-medium text-green-700">{e.respuesta}</td>
                        <td className="px-3 py-2 text-gray-400">{e.pista_1 || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{e.pista_2 || '—'}</td>
                        <td className="px-3 py-2">{e.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mini-historias por estación ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-violet-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Mini-historias por estación
                    <span className="text-xs text-gray-400 font-normal">(aparecen antes de cada ejercicio)</span>
                  </p>
                  <button
                    onClick={generarNarrativa}
                    disabled={generandoNarrativa || estaciones.length === 0}
                    className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-500 border border-violet-200 hover:border-violet-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {generandoNarrativa
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                      : <><Wand2 className="w-3 h-3" /> Generar con IA</>}
                  </button>
                </div>
                {errorNarrativa && <p className="text-red-500 text-xs">{errorNarrativa}</p>}
                {estaciones.map((e, idx) => (
                  <div key={idx} className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-700">Estación {e.numero} — {e.titulo}</p>
                    <div>
                      <label className="text-xs font-semibold text-violet-600 mb-1 block flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Mini-historia
                        <span className="text-gray-400 font-normal">(aparece antes del ejercicio)</span>
                      </label>
                      <textarea
                        value={e.mini_historia || ''}
                        rows={2}
                        placeholder="Narrativa que contextualiza el problema y sumerge al jugador..."
                        onChange={(ev) => updateEst(idx, 'mini_historia', ev.target.value)}
                        className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-green-600 mb-1 block flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Retroalimentación
                        <span className="text-gray-400 font-normal">(aparece al resolver correctamente)</span>
                      </label>
                      <textarea
                        value={e.retroalimentacion || ''}
                        rows={2}
                        placeholder="Mensaje de celebración y puente narrativo a la siguiente estación..."
                        onChange={(ev) => updateEst(idx, 'retroalimentacion', ev.target.value)}
                        className="w-full border border-green-100 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB MANUAL */}
      {tab === 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Completa título, problema y respuesta. Los demás campos son opcionales.</p>
            <button
              onClick={generarNarrativa}
              disabled={generandoNarrativa || estaciones.length === 0}
              className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-500 border border-violet-200 hover:border-violet-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
            >
              {generandoNarrativa
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                : <><Wand2 className="w-3 h-3" /> Narrativa con IA</>}
            </button>
          </div>
          {errorNarrativa && <p className="text-red-500 text-xs">{errorNarrativa}</p>}
          {estaciones.map((est, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Estación {est.numero}</span>
                <button onClick={() => removeEst(idx)} className="text-gray-400 hover:text-red-500 transition p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">N° <span className="text-red-500">*</span></label>
                  <input type="number" value={est.numero} min={1}
                    onChange={(e) => updateEst(idx, 'numero', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Título <span className="text-red-500">*</span></label>
                  <input type="text" value={est.titulo} placeholder="Título de la estación"
                    onChange={(e) => updateEst(idx, 'titulo', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Problema <span className="text-red-500">*</span></label>
                <textarea value={est.problema} rows={2} placeholder="Describe el problema..."
                  onChange={(e) => updateEst(idx, 'problema', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Respuesta <span className="text-red-500">*</span></label>
                <input type="text" value={est.respuesta} placeholder="Respuesta correcta"
                  onChange={(e) => updateEst(idx, 'respuesta', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Pista 1</label>
                  <input type="text" value={est.pista_1} placeholder="Opcional"
                    onChange={(e) => updateEst(idx, 'pista_1', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Pista 2</label>
                  <input type="text" value={est.pista_2} placeholder="Opcional"
                    onChange={(e) => updateEst(idx, 'pista_2', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Puntos</label>
                  <input type="number" value={est.puntos} min={0}
                    onChange={(e) => updateEst(idx, 'puntos', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-violet-600 mb-1 block flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Mini-historia
                  <span className="text-gray-400 font-normal">(opcional — aparece antes del ejercicio)</span>
                </label>
                <textarea value={est.mini_historia} rows={2}
                  placeholder="Narrativa que contextualiza el problema y sumerge al jugador..."
                  onChange={(e) => updateEst(idx, 'mini_historia', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-green-600 mb-1 block flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Retroalimentación
                  <span className="text-gray-400 font-normal">(opcional — aparece al resolver correctamente)</span>
                </label>
                <textarea value={est.retroalimentacion} rows={2}
                  placeholder="Mensaje de celebración y puente narrativo a la siguiente estación..."
                  onChange={(e) => updateEst(idx, 'retroalimentacion', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
            </div>
          ))}
          <button onClick={addEstacion}
            className="flex items-center gap-2 w-full justify-center text-sm font-semibold text-blue-600 hover:text-blue-500 border-2 border-dashed border-blue-300 hover:border-blue-400 py-3 rounded-xl transition">
            <Plus className="w-4 h-4" /> Agregar estación
          </button>
        </div>
      )}

      {errorPaso && (
        <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
          <AlertCircle className="w-4 h-4" /> {errorPaso}
        </p>
      )}
    </div>
  )
}

// ─── Paso 4: Revisar y guardar ────────────────────────────────
function Paso4({ datos, estaciones, errorGuardar }) {
  const filas = [
    { label: 'Nombre',        value: datos.nombre },
    { label: 'Tema',          value: datos.tema },
    { label: 'Nivel',         value: datos.nivel },
    { label: 'Descripción',   value: datos.descripcion || '—' },
    { label: 'Tiempo límite', value: `${datos.tiempo_limite} min` },
    { label: 'Estaciones',    value: estaciones.length },
    { label: 'Tono',          value: datos.tono ? datos.tono.charAt(0).toUpperCase() + datos.tono.slice(1) : '—' },
  ]
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Revisar y guardar</h2>
      <p className="text-sm text-gray-500">Confirma los datos antes de crear el escape room.</p>

      {/* Datos generales */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {filas.map(({ label, value }) => (
          <div key={label} className="flex items-start px-4 py-3 text-sm">
            <span className="w-36 font-semibold text-gray-500 shrink-0">{label}</span>
            <span className="text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {/* Historia */}
      {datos.historia && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Historia</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {datos.historia.length > 120 ? datos.historia.slice(0, 120) + '...' : datos.historia}
          </div>
        </div>
      )}

      {/* Lista de estaciones */}
      {estaciones.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Estaciones ({estaciones.length})</p>
          <div className="space-y-2">
            {estaciones.map((e, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm">
                <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">{e.numero}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{e.titulo || '—'}</p>
                  <p className="text-gray-500 truncate">{e.problema || '—'}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{e.puntos} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorGuardar && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorGuardar}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
const DATOS_INICIALES = {
  nombre: '', tema: '', nivel: '', descripcion: '',
  tiempo_limite: 30, num_estaciones: 5,
  tono: '', historia: '', retroalimentacion_final: '',
}

export default function CrearEscapeRoom() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState(DATOS_INICIALES)
  const [estaciones, setEstaciones] = useState([])
  const [errores, setErrores] = useState({})
  const [errorPaso3, setErrorPaso3] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [toast, setToast] = useState(false)
  const [imagenPortada, setImagenPortada] = useState(null)

  const validarPaso1 = () => {
    const e = {}
    if (!datos.nombre.trim()) e.nombre = 'El nombre es requerido.'
    if (!datos.tema.trim())   e.tema   = 'El tema es requerido.'
    if (!datos.nivel.trim())  e.nivel  = 'El nivel es requerido.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso3 = () => {
    if (estaciones.length === 0) {
      setErrorPaso3('Debes agregar al menos una estación.')
      return false
    }
    const invalidas = estaciones.filter((e) => !e.respuesta.trim() || !e.titulo.trim() || !e.problema.trim())
    if (invalidas.length > 0) {
      setErrorPaso3('Todas las estaciones deben tener título, problema y respuesta.')
      return false
    }
    setErrorPaso3('')
    return true
  }

  const siguiente = () => {
    if (paso === 0 && !validarPaso1()) return
    if (paso === 2 && !validarPaso3()) return
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const anterior = () => {
    setErrores({})
    setErrorPaso3('')
    setPaso((p) => Math.max(p - 1, 0))
  }

  const guardar = async () => {
    setGuardando(true)
    setErrorGuardar('')

    // Subir imagen de portada si existe
    let imagenPortadaUrl = null
    if (imagenPortada) {
      const ext = imagenPortada.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('portadas')
        .upload(`public/${fileName}`, imagenPortada, { contentType: imagenPortada.type, upsert: true })
      if (!uploadErr && uploadData?.path) {
        const { data: urlData } = supabase.storage.from('portadas').getPublicUrl(uploadData.path)
        imagenPortadaUrl = urlData.publicUrl
      }
    }

    const { data: roomData, error: errRoom } = await supabase
      .from('escape_rooms')
      .insert({
        nombre:         datos.nombre,
        tema:           datos.tema,
        nivel:          datos.nivel,
        descripcion:    datos.descripcion,
        tiempo_limite:  datos.tiempo_limite,
        num_estaciones: estaciones.length,
        tono:           datos.tono,
        historia:              datos.historia,
        retroalimentacion_final: datos.retroalimentacion_final,
        imagen_portada:        imagenPortadaUrl,
        estado:                'inactivo',
        archivado:      false,
      })
      .select('id')
      .single()

    if (errRoom) {
      console.error('Error escape_rooms COMPLETO:', JSON.stringify(errRoom))
      setErrorGuardar(`Error: ${errRoom.message} | hint: ${errRoom.hint} | details: ${errRoom.details}`)
      setGuardando(false)
      return
    }

    console.log('roomData recibido:', roomData)
    if (!roomData?.id) {
      setErrorGuardar('Error: no se recibió el ID del escape room guardado.')
      setGuardando(false)
      return
    }
    const rows = estaciones.map((e) => ({ ...e, escape_room_id: roomData.id }))
    console.log('Insertando estaciones:', rows)
    const { error: errEst } = await supabase.from('estaciones').insert(rows)

    if (errEst) {
      console.error('Error estaciones COMPLETO:', JSON.stringify(errEst))
      setErrorGuardar(`Error en estaciones: ${errEst.message} | hint: ${errEst.hint} | details: ${errEst.details}`)
      setGuardando(false)
      return
    }

    setGuardando(false)
    setToast(true)
    setTimeout(() => { setToast(false); navigate('/dashboard') }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Nuevo Escape Room</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BarraProgreso paso={paso} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {paso === 0 && <Paso1 datos={datos} setDatos={setDatos} errores={errores} />}
          {paso === 1 && <Paso2 datos={datos} setDatos={setDatos} imagenPortada={imagenPortada} setImagenPortada={setImagenPortada} />}
          {paso === 2 && <Paso3 estaciones={estaciones} setEstaciones={setEstaciones} errorPaso={errorPaso3} datos={datos} />}
          {paso === 3 && <Paso4 datos={datos} estaciones={estaciones} errorGuardar={errorGuardar} />}

          {/* Navegación */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={anterior}
              disabled={paso === 0}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            {paso < PASOS.length - 1 ? (
              <button
                onClick={siguiente}
                className="flex items-center gap-1 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition shadow-sm"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex items-center gap-2 text-sm font-semibold bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white px-5 py-2 rounded-xl transition shadow-sm"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {guardando ? 'Guardando...' : 'Guardar Escape Room'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <Check className="w-4 h-4" /> ¡Escape Room creado correctamente!
        </div>
      )}
    </div>
  )
}
