import { useParams } from 'react-router-dom'

export default function JuegoActivo() {
  const { codigoSala } = useParams()
  return <div className="p-8"><h1 className="text-2xl font-bold">Juego Activo — Sala: {codigoSala}</h1></div>
}
