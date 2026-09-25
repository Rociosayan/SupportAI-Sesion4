# SupportAI · Sesión 4 (producto docente)

Versión docente del **Laboratorio 4**: el SupportAI de la sesión 3 más **RAG**.

## URLs

- **Vercel (vitrina + backend, Gemini en internet):** https://supportai-sesion4.vercel.app/
- **GitHub Pages (solo vitrina estática):** https://rociosayan.github.io/SupportAI-Sesion4/

GitHub Pages no ejecuta el backend ni Gemini: es HTML/CSS/JS. Para analizar un caso con Gemini API hay que usar **Vercel** o el arranque local.

## Arranque local (dos terminales)

1. Copia `backend/.env.example` a `backend/.env` y completa `GEMINI_API_KEY`.  
   Si usas Supabase: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. No subas `.env` a GitHub.
2. Frontend: `npm install` y `npm run dev` → http://localhost:5173/SupportAI-Sesion4/
3. Backend: `npm run backend` → http://localhost:3001

En local el frontend llama a `http://localhost:3001`. En Vercel llama a `/api` en la misma URL pública.

Comprobaciones:

- Salud local: `GET http://localhost:3001/api/health`
- Salud en Vercel: `GET https://supportai-sesion4.vercel.app/api/health` → `{ "ok": true }`
- Casos → Diego Salazar → **Analizar con Gemini API**

Se conservan el análisis simulado (lab 1), el flujo manual (lab 2) y Gemini API (lab 3). Las claves no van en React ni en GitHub.
