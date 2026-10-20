# Run FleetFlow locally — no Docker

This version deliberately contains no Dockerfile, Docker Compose, or Nginx config.
You will add those yourself as DevOps practice.

## 1. Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ running locally

## 2. Create the PostgreSQL database
Open psql or pgAdmin and create a database and user (replace the password):

```sql
CREATE USER fleetflow WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
CREATE DATABASE fleetflow OWNER fleetflow;
```

If you already have a local PostgreSQL user you prefer, use that user's credentials
in DATABASE_URL instead. Do not commit real passwords to Git.

## 3. Start the Python API
Open terminal 1 in the project root:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

Linux/macOS:
```bash
source .venv/bin/activate
```

Then run:
```bash
pip install -r requirements.txt
```

Set the database URL before starting. Windows PowerShell:
```powershell
$env:DATABASE_URL="postgresql+psycopg://fleetflow:YOUR_POSTGRES_PASSWORD@localhost:5432/fleetflow"
$env:CORS_ORIGINS="http://localhost:5173"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Linux/macOS:
```bash
export DATABASE_URL="postgresql+psycopg://fleetflow:YOUR_POSTGRES_PASSWORD@localhost:5432/fleetflow"
export CORS_ORIGINS="http://localhost:5173"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs
Health: http://127.0.0.1:8000/health

## 4. Start the React frontend
Open terminal 2 in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The frontend source currently calls `/api`. For local development, configure Vite to proxy
`/api` to the Python API by adding this to `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

This proxy is for local development only; later you can create your own Nginx config and Docker setup.

## 5. Verify
- Visit http://localhost:5173
- Visit http://127.0.0.1:8000/docs
- Test the demo tracking IDs FF-10001, FF-10002, FF-10003

## Important
The API creates its tables and demo data at startup. Keep PostgreSQL running first.
If the database connection fails, check the database name, username, password, and port.
