# FleetFlow — Logistics & Supply Chain Management (Source Only)

This archive intentionally excludes Dockerfiles, Docker Compose, and Nginx configuration so you can implement DevOps yourself.

## Stack
- Frontend: React + Vite
- Backend: Python FastAPI + SQLAlchemy
- Database: PostgreSQL

## Run locally without Docker

### 1. Start PostgreSQL
Create a database and user (replace the example password):

```sql
CREATE USER fleetflow WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
CREATE DATABASE fleetflow OWNER fleetflow;
```

### 2. Start the backend
From the project root:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell activation:
```powershell
.venv\Scripts\Activate.ps1
```

Linux/macOS activation:
```bash
source .venv/bin/activate
```

Install packages:
```bash
pip install -r requirements.txt
```

Windows PowerShell:
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

### 3. Start the frontend
Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The included Vite configuration proxies `/api` requests to the local Python backend. The API creates its tables and inserts demo data at startup.

### Demo tracking IDs
- `FF-10001`
- `FF-10002`
- `FF-10003`

## Included functionality
- Dashboard and shipment metrics
- Create shipments and update shipment status
- Search/filter shipments
- Track deliveries by tracking number
- Inventory listing, search, add, quantity updates, deletion and low-stock filtering

## Your DevOps practice
This source-only version intentionally has no Dockerfile, docker-compose.yml, Kubernetes manifests, Helm chart, Jenkinsfile, GitHub Actions workflow, Terraform, or monitoring setup. Add those yourself as you progress.

Do not commit real database passwords to Git. This is a learning/demo app; add authentication, authorization, migrations, TLS, secrets management, backups, and production hardening before public deployment.
