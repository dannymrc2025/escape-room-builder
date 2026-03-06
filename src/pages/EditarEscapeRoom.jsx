import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Loader2,
  Swords, Search, Rocket, Sparkles,
  BookOpen, Clock, MapPin, FileText, Wand2, Trophy, Unlock,
  Plus, Trash2, Upload, Download, AlertCircle,
  Table2, PenLine, Save, X, Image as ImageIcon
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Constantes ───────────────────────────────────────────────
const PASOS = ['Datos generales', 'Historia', 'Estaciones', 'Guardar cambios']

const TONOS = [
  { id: 'aventura',        label: 'Aventura',         icon: <Swords className="w-6 h-6" />,   color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { id: 'misterio',        label: 'Misterio',          icon: <Search className="w-6 h-6" />,   color: 'text-violet-500', bg: 'bg-violet-50 border-violet-200' },
  { id: 'ciencia ficción', label: 'Ciencia ficción',   icon: <Rocket className="w-6 h-6" />,   color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200'   },
  { id: 'fantasy',         label: 'Fantasy',            icon: <Sparkles className="w-6 h-6" />, color: 'text-pink-500',   bg: 'bg-pink-50 border-pink-200'   },
]

const COLUMNAS_CSV = ['estacion', 'titulo', 'problema', 'respuesta', 'pista_1', 'pista_2', 'puntos']
const PLANTILLA_CSV = COLUMNAS_CSV.join(',') + '\n' +
  '1,La sala de las fracciones,¿Cuánto es 1/2 + 1/4?,3/4,Busca un denominador común,El resultado es menor que 1,100\n'

function parseCSV(text) {
  const lineas = text.trim().split('\n').filter(Boolean)
  if (lineas.length < 2) return { errores: ['El archivo está vacío o solo tiene encabezado.'], estaciones: [] }
  const headers = lineas[0].split(',').map((h) => h.trim().toLowerCase())
  const faltantes = COLUMNAS_CSV.filter((c) => !headers.includes(c))
  if (faltantes.length > 0) return { errores: [`Columnas faltantes: ${faltantes.join(', ')}`], estaciones: [] }
  const estaciones = []
  const errores = []
  const numerosVistos = new Set()
  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue
    const vals = lineas[i].split(',').map((v) => v.trim())
    const row = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })
    if (!row.respuesta) errores.push(`Fila ${i}: la respuesta está vacía.`)
    if (numerosVistos.has(row.estacion)) errores.push(`Fila ${i}: número de estación duplicado (${row.estacion}).`)
    numerosVistos.add(row.estacion)
    estaciones.push({
      numero: Number(row.estacion) || i,
      titulo: row.titulo || `Estación ${i}`,
      problema: row.problema || '',
      respuesta: row.respuesta || '',
      pista_1: row.pista_1 || '',
      pista_2: row.pista_2 || '',
      puntos: Number(row.puntos) || 100,
    })
  }
  return { errores, estaciones: errores.length > 0 ? [] : estaciones }
}

// ─── Barra de progreso ────────────────────────────────────────
function BarraProgreso({ paso }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{ width: `${(paso / (PASOS.length - 1)) * 100}%` }} />
        {PASOS.map((nombre, i) => (
          <div key={i} className="flex flex-col items-center z-10 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
              i < paso ? 'bg-blue-500 border-blue-500 text-white' : i === paso ? 'bg-white border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {i < paso ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium text-center hidden sm:block ${i <= paso ? 'text-blue-600' : 'text-gray-400'}`}>
              {nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Paso 1 ────────────────────────────────────────────────────
function Paso1({ datos, setDatos, errores }) {
  const campo = (key, value) => setDatos((d) => ({ ...d, [key]: value }))
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Datos generales</h2>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
        <input type="text" value={datos.nombre} onChange={(e) => campo('nombre', e.target.value)}
          placeholder="Ej: La bóveda del tiempo perdido"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.nombre ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
        {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tema matemático <span className="text-red-500">*</span></label>
          <input type="text" value={datos.tema} onChange={(e) => campo('tema', e.target.value)} placeholder="Ej: Álgebra"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.tema ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
          {errores.tema && <p className="text-red-500 text-xs mt-1">{errores.tema}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nivel / Grado <span className="text-red-500">*</span></label>
          <input type="text" value={datos.nivel} onChange={(e) => campo('nivel', e.target.value)} placeholder="Ej: 3° Secundaria"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${errores.nivel ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
          {errores.nivel && <p className="text-red-500 text-xs mt-1">{errores.nivel}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Descripción <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea value={datos.descripcion} onChange={(e) => campo('descripcion', e.target.value)}
          placeholder="Breve descripción..." rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 transition" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Tiempo límite (min)
          </label>
          <input type="number" min={5} max={180} value={datos.tiempo_limite}
            onChange={(e) => campo('tiempo_limite', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Número de estaciones
          </label>
          <input type="number" min={1} max={20} value={datos.num_estaciones}
            onChange={(e) => campo('num_estaciones', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition" />
        </div>
      </div>
    </div>
  )
}

// ─── Paso 2 ────────────────────────────────────────────────────
function Paso2({ datos, setDatos, imagenPortada, setImagenPortada, imagenActualUrl }) {
  const [generando, setGenerando] = useState(false)
  const [generandoCierre, setGenerandoCierre] = useState(false)
  const [error, setError] = useState('')
  const setHistoria = (historia) => setDatos((d) => ({ ...d, historia }))
  const setTono = (tono) => setDatos((d) => ({ ...d, tono }))

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
          model: 'claude-sonnet-4-5', max_tokens: 300,
          system: 'Eres un escritor creativo para escape rooms educativos de matemáticas. Escribe un mensaje de cierre épico de 60-80 palabras para cuando el jugador completa el escape room. Debe celebrar la victoria, cerrar la historia y destacar los logros matemáticos. Solo devuelve el texto, sin títulos ni comillas.',
          messages: [{ role: 'user', content: `Escape room: "${datos.nombre}". Tema: ${datos.tema}. Nivel: ${datos.nivel}. Historia: ${datos.historia || '(sin historia)'}` }],
        }),
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      const json = await resp.json()
      setDatos((d) => ({ ...d, retroalimentacion_final: json.content?.[0]?.text ?? '' }))
    } catch { /* silently fail */ } finally { setGenerandoCierre(false) }
  }

  const generarHistoria = async () => {
    setGenerando(true); setError('')
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
          model: 'claude-sonnet-4-5', max_tokens: 500,
          system: 'Eres un escritor creativo para escape rooms educativos de matemáticas. Crea una historia de introducción de 80 a 120 palabras. Solo devuelve la historia, sin títulos ni comillas.',
          messages: [{ role: 'user', content: `Escape room: "${datos.nombre}". Tema: ${datos.tema}. Nivel: ${datos.nivel}. Estaciones: ${datos.num_estaciones}. Tono: ${datos.tono}.` }],
        }),
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      const json = await resp.json()
      setHistoria(json.content?.[0]?.text ?? '')
    } catch {
      setError('No se pudo generar la historia.')
    } finally { setGenerando(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Historia de introducción</h2>
        <p className="text-sm text-gray-500">Edita la historia o genera una nueva con IA.</p>
      </div>

      {/* Imagen de portada */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <ImageIcon className="w-4 h-4 text-blue-500" /> Imagen de portada
          <span className="text-xs text-gray-400 font-normal">(opcional — fondo de la introducción)</span>
        </p>
        {imagenPortada ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
            <img src={URL.createObjectURL(imagenPortada)} alt="Portada" className="w-full h-full object-cover" />
            <button onClick={() => setImagenPortada(null)}
              className="absolute top-2 right-2 bg-gray-900/70 hover:bg-red-600 text-white rounded-full p-1 transition">
              <X className="w-4 h-4" />
            </button>
            <span className="absolute bottom-2 left-2 bg-gray-900/60 text-white text-xs px-2 py-0.5 rounded-full">{imagenPortada.name}</span>
          </div>
        ) : imagenActualUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
            <img src={imagenActualUrl} alt="Portada actual" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/40 opacity-0 hover:opacity-100 transition gap-2">
              <button onClick={() => document.getElementById('portada-input-editar').click()}
                className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition">
                Cambiar imagen
              </button>
            </div>
            <input id="portada-input-editar" type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f && f.size <= 5 * 1024 * 1024) setImagenPortada(f); e.target.value = '' }} />
          </div>
        ) : (
          <div onClick={() => document.getElementById('portada-input-editar').click()}
            className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 rounded-xl cursor-pointer transition flex flex-col items-center gap-2 py-8">
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-500">Haz clic para subir una imagen</p>
            <p className="text-xs text-gray-400">JPG o PNG · recomendado 1600×900px · máx. 5MB</p>
            <input id="portada-input-editar" type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f && f.size <= 5 * 1024 * 1024) setImagenPortada(f); e.target.value = '' }} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1"><BookOpen className="w-4 h-4 text-violet-500" /> Historia</p>
        <textarea value={datos.historia} onChange={(e) => setHistoria(e.target.value)} rows={6}
          placeholder="Escribe aquí la historia... (opcional)"
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 transition leading-relaxed" />
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

      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1 list-none">
          <Wand2 className="w-4 h-4" /> Regenerar con IA (opcional)
        </summary>
        <div className="mt-4 space-y-4 pl-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TONOS.map((t) => (
              <button key={t.id} onClick={() => setTono(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                  datos.tono === t.id ? `${t.bg} ${t.color} border-current shadow-sm scale-105` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <span className={datos.tono === t.id ? t.color : 'text-gray-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={generarHistoria} disabled={generando || !datos.tono}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl transition">
            {generando ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</> : <><Wand2 className="w-4 h-4" /> Generar con IA</>}
          </button>
        </div>
      </details>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

// ─── Paso 3 ────────────────────────────────────────────────────
function Paso3({ estaciones, setEstaciones, errorPaso, datos }) {
  const [tab, setTab] = useState('manual')
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
            'Para cada estación genera: retroalimentacion (35-50 palabras que celebran el éxito y sirven de puente narrativo a la siguiente estación, o de cierre épico si es la última). ' +
            'Responde SOLO con JSON válido sin markdown: [{"numero":1,"retroalimentacion":"..."}, ...]',
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
            ? { ...e, retroalimentacion: gen.retroalimentacion || e.retroalimentacion }
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
  const addEst = () => {
    const sig = estaciones.length > 0 ? Math.max(...estaciones.map((e) => e.numero)) + 1 : 1
    setEstaciones((prev) => [...prev, { numero: sig, titulo: '', problema: '', respuesta: '', pista_1: '', pista_2: '', puntos: 100, retroalimentacion: '' }])
  }
  const updateEst = (idx, key, val) => setEstaciones((prev) => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e))
  const removeEst = (idx) => setEstaciones((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Estaciones</h2>
        <p className="text-sm text-gray-500">Edita las estaciones existentes, agrega o elimina.</p>
      </div>
      <div className="flex border-b border-gray-200">
        {[['manual', <PenLine className="w-4 h-4" />, 'Editar manualmente'], ['csv', <Upload className="w-4 h-4" />, 'Reemplazar con CSV']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'csv' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> Subir un CSV reemplazará todas las estaciones actuales.
          </div>
          <button onClick={descargarPlantilla} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 px-4 py-2 rounded-xl transition">
            <Download className="w-4 h-4" /> Descargar plantilla CSV
          </button>
          <div onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }} onDragLeave={() => setArrastrando(false)} onDrop={onDrop}
            onClick={() => document.getElementById('csv-input-edit').click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition ${arrastrando ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
            <Upload className={`w-8 h-8 ${arrastrando ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600 font-medium text-center">Arrastra tu archivo CSV aquí<br /><span className="text-gray-400 font-normal">o haz clic para seleccionar</span></p>
            <input id="csv-input-edit" type="file" accept=".csv" className="hidden" onChange={(e) => procesarArchivo(e.target.files[0])} />
          </div>
          {erroresCSV.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              {erroresCSV.map((e, i) => <p key={i} className="text-red-600 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {e}</p>)}
            </div>
          )}
          {preview.length > 0 && (
            <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><Table2 className="w-4 h-4" /> {preview.length} estaciones listas para reemplazar</p>
          )}
        </div>
      )}

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
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">N°</label>
                  <input type="number" value={est.numero} min={1} onChange={(e) => updateEst(idx, 'numero', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Título <span className="text-red-500">*</span></label>
                  <input type="text" value={est.titulo} placeholder="Título" onChange={(e) => updateEst(idx, 'titulo', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Problema <span className="text-red-500">*</span></label>
                <textarea value={est.problema} rows={2} placeholder="Describe el problema..." onChange={(e) => updateEst(idx, 'problema', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Respuesta <span className="text-red-500">*</span></label>
                <input type="text" value={est.respuesta} placeholder="Respuesta correcta" onChange={(e) => updateEst(idx, 'respuesta', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['pista_1', 'Pista 1'], ['pista_2', 'Pista 2']].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{l}</label>
                    <input type="text" value={est[k]} placeholder="Opcional" onChange={(e) => updateEst(idx, k, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Puntos</label>
                  <input type="number" value={est.puntos} min={0} onChange={(e) => updateEst(idx, 'puntos', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-green-600 mb-1 block flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Retroalimentación
                  <span className="text-gray-400 font-normal">(opcional — aparece al resolver correctamente)</span>
                </label>
                <textarea value={est.retroalimentacion || ''} rows={2}
                  placeholder="Mensaje de celebración y puente narrativo a la siguiente estación..."
                  onChange={(e) => updateEst(idx, 'retroalimentacion', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
            </div>
          ))}
          <button onClick={addEst}
            className="flex items-center gap-2 w-full justify-center text-sm font-semibold text-blue-600 hover:text-blue-500 border-2 border-dashed border-blue-300 hover:border-blue-400 py-3 rounded-xl transition">
            <Plus className="w-4 h-4" /> Agregar estación
          </button>
        </div>
      )}

      {errorPaso && (
        <p className="text-red-500 text-sm flex items-center gap-1 mt-2"><AlertCircle className="w-4 h-4" /> {errorPaso}</p>
      )}
    </div>
  )
}

// ─── Paso 4: Resumen ──────────────────────────────────────────
function Paso4({ datos, estaciones, errorGuardar }) {
  const filas = [
    { label: 'Nombre',        value: datos.nombre },
    { label: 'Tema',          value: datos.tema },
    { label: 'Nivel',         value: datos.nivel },
    { label: 'Descripción',   value: datos.descripcion || '—' },
    { label: 'Tiempo límite', value: `${datos.tiempo_limite} min` },
    { label: 'Estaciones',    value: estaciones.length },
  ]
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Guardar cambios</h2>
      <p className="text-sm text-gray-500">Revisa los datos antes de guardar.</p>
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {filas.map(({ label, value }) => (
          <div key={label} className="flex items-start px-4 py-3 text-sm">
            <span className="w-36 font-semibold text-gray-500 shrink-0">{label}</span>
            <span className="text-gray-800">{value}</span>
          </div>
        ))}
      </div>
      {datos.historia && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Historia</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {datos.historia.length > 120 ? datos.historia.slice(0, 120) + '...' : datos.historia}
          </div>
        </div>
      )}
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
export default function EditarEscapeRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState({ nombre: '', tema: '', nivel: '', descripcion: '', tiempo_limite: 30, num_estaciones: 5, tono: '', historia: '', retroalimentacion_final: '' })
  const [estaciones, setEstaciones] = useState([])
  const [errores, setErrores] = useState({})
  const [errorPaso3, setErrorPaso3] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(false)
  const [imagenPortada, setImagenPortada] = useState(null)
  const [imagenActualUrl, setImagenActualUrl] = useState(null)

  // Cargar datos existentes
  useEffect(() => {
    const cargar = async () => {
      const { data: room } = await supabase.from('escape_rooms').select('*').eq('id', id).single()
      if (!room) { navigate('/dashboard'); return }
      setDatos({
        nombre:         room.nombre ?? '',
        tema:           room.tema ?? '',
        nivel:          room.nivel ?? '',
        descripcion:    room.descripcion ?? '',
        tiempo_limite:  room.tiempo_limite ?? 30,
        num_estaciones: room.num_estaciones ?? 5,
        tono:                   room.tono ?? '',
        historia:               room.historia ?? '',
        retroalimentacion_final: room.retroalimentacion_final ?? '',
      })
      setImagenActualUrl(room.imagen_portada ?? null)
      const { data: ests } = await supabase.from('estaciones').select('*').eq('escape_room_id', id).order('numero')
      setEstaciones(ests ?? [])
      setCargando(false)
    }
    cargar()
  }, [id, navigate])

  const validarPaso1 = () => {
    const e = {}
    if (!datos.nombre.trim()) e.nombre = 'El nombre es requerido.'
    if (!datos.tema.trim())   e.tema   = 'El tema es requerido.'
    if (!datos.nivel.trim())  e.nivel  = 'El nivel es requerido.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso3 = () => {
    if (estaciones.length === 0) { setErrorPaso3('Debes tener al menos una estación.'); return false }
    const invalidas = estaciones.filter((e) => !e.respuesta.trim() || !e.titulo.trim() || !e.problema.trim())
    if (invalidas.length > 0) { setErrorPaso3('Todas las estaciones deben tener título, problema y respuesta.'); return false }
    setErrorPaso3(''); return true
  }

  const siguiente = () => {
    if (paso === 0 && !validarPaso1()) return
    if (paso === 2 && !validarPaso3()) return
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const anterior = () => { setErrores({}); setErrorPaso3(''); setPaso((p) => Math.max(p - 1, 0)) }

  const guardar = async () => {
    setGuardando(true); setErrorGuardar('')

    // Subir nueva imagen si se seleccionó una
    let nuevaImagenUrl = imagenActualUrl
    if (imagenPortada) {
      const ext = imagenPortada.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('portadas')
        .upload(`public/${fileName}`, imagenPortada, { contentType: imagenPortada.type, upsert: true })
      if (uploadErr || !uploadData?.path) {
        setErrorGuardar(`Error al subir la imagen: ${uploadErr?.message ?? 'respuesta inesperada del servidor'}. Verifica que el bucket "portadas" exista y sea público en Supabase.`)
        setGuardando(false)
        return
      }
      const { data: urlData } = supabase.storage.from('portadas').getPublicUrl(uploadData.path)
      nuevaImagenUrl = urlData.publicUrl
    }

    // Actualizar escape room
    const { error: errRoom } = await supabase.from('escape_rooms').update({
      nombre:         datos.nombre,
      tema:           datos.tema,
      nivel:          datos.nivel,
      descripcion:    datos.descripcion,
      tiempo_limite:  datos.tiempo_limite,
      num_estaciones: estaciones.length,
      tono:           datos.tono,
      historia:               datos.historia,
      retroalimentacion_final: datos.retroalimentacion_final,
      imagen_portada:         nuevaImagenUrl,
    }).eq('id', id)

    if (errRoom) { setErrorGuardar(`Error: ${errRoom.message}`); setGuardando(false); return }

    // Reemplazar estaciones: borrar las viejas e insertar las nuevas
    await supabase.from('estaciones').delete().eq('escape_room_id', id)
    const rows = estaciones.map((e) => ({
      numero: e.numero, titulo: e.titulo, problema: e.problema,
      respuesta: e.respuesta, pista_1: e.pista_1, pista_2: e.pista_2,
      puntos: e.puntos, escape_room_id: id,
      retroalimentacion: e.retroalimentacion || '',
    }))
    const { error: errEst } = await supabase.from('estaciones').insert(rows)
    if (errEst) { setErrorGuardar(`Error en estaciones: ${errEst.message}`); setGuardando(false); return }

    setGuardando(false)
    setToast(true)
    setTimeout(() => { setToast(false); navigate('/dashboard') }, 2000)
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Editar Escape Room</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BarraProgreso paso={paso} />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          {paso === 0 && <Paso1 datos={datos} setDatos={setDatos} errores={errores} />}
          {paso === 1 && <Paso2 datos={datos} setDatos={setDatos} imagenPortada={imagenPortada} setImagenPortada={setImagenPortada} imagenActualUrl={imagenActualUrl} />}
          {paso === 2 && <Paso3 estaciones={estaciones} setEstaciones={setEstaciones} errorPaso={errorPaso3} datos={datos} />}
          {paso === 3 && <Paso4 datos={datos} estaciones={estaciones} errorGuardar={errorGuardar} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button onClick={anterior} disabled={paso === 0}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 disabled:text-gray-300 hover:text-gray-800 transition px-4 py-2 rounded-xl border border-gray-200 disabled:border-gray-100">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            {paso < PASOS.length - 1 ? (
              <button onClick={siguiente}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl transition shadow-sm">
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={guardar} disabled={guardando}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:bg-gray-400 px-6 py-2.5 rounded-xl transition shadow-sm">
                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Toast éxito */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold z-50">
          <Check className="w-4 h-4" /> ¡Cambios guardados!
        </div>
      )}
    </div>
  )
}

