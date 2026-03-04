import { useParams } from 'react-router-dom'

export default function EditarEscapeRoom() {
  const { id } = useParams()
  return <div className="p-8"><h1 className="text-2xl font-bold">Editar Escape Room — ID: {id}</h1></div>
}
