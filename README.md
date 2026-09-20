# SupportAI · Sesión 4 (producto docente)

Versión docente del **Laboratorio 4**: el SupportAI de la sesión 3 más **RAG** con Gemini embeddings y Supabase + pgvector.

- Demo publicada: https://Rociosayan.github.io/SupportAI-Sesion4/
- En GitHub Pages no corre el backend. RAG y Gemini se prueban en `localhost`.

## Arranque local (dos terminales)

1. Copia `backend/.env.example` a `backend/.env` y completa:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. En el SQL Editor de Supabase ejecuta `backend/sql/setup.sql`.
3. Frontend: `npm install` y `npm run dev` → http://localhost:5173/SupportAI-Sesion4/
4. Backend: `npm run backend` → http://localhost:3001
5. Indexar conocimiento (una vez, o cuando cambien los `.txt`):

```bash
npm run knowledge:index --prefix backend
```

Comprobaciones:

- Fuente: `npm run knowledge:check --prefix backend`
- Salud: `GET http://localhost:3001/api/health`
- Recuperación: **IA Lab → Buscar contexto / Preguntar con RAG**
- Casos: Diego Salazar y María Gómez → **Consultar conocimiento con RAG**

Se conservan el análisis simulado (lab 1), el flujo manual (lab 2) y Gemini API (lab 3). Las claves no van en React ni en GitHub.
