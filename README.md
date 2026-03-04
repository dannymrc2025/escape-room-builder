# Escape Room Builder 🔐

Aplicación web para crear, gestionar y jugar escape rooms educativos de matemáticas.

## Stack

- **React 19 + Vite** — frontend
- **Tailwind CSS 3** — estilos
- **Supabase** — base de datos y tiempo real
- **Anthropic Claude** — generación de historias con IA
- **Recharts** — gráficas de resultados

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_APP_PASSWORD=tu_password
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build para producción

```bash
npm run build
```
