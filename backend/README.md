# FleetFlow Backend API

The FleetFlow backend provides REST API endpoints for shipment operations, tracking, dashboard metrics, and inventory management. It is built with FastAPI and runs using Uvicorn.

## Technology Stack

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- Psycopg
- Docker

## API Documentation

When the application is running, interactive API documentation is available at:

http://localhost:8000/docs

The OpenAPI schema is available at:

http://localhost:8000/openapi.json

## Architecture

The backend runs as a separate Docker Compose service and communicates with PostgreSQL over the internal Compose network.

The frontend reaches backend endpoints through Nginx, which forwards `/api/` requests to the backend service.

The backend uses environment variables for database connectivity and CORS configuration.

## Run with Docker Compose

From the project root:

```bash
docker compose up -d --build backend
```

Check the backend logs:

```bash
docker compose logs --tail=100 backend
```

Verify that the API schema responds successfully:

```bash
curl http://localhost:8000/openapi.json
```

On Windows PowerShell, you can also use:

```powershell
Invoke-WebRequest http://localhost:8000/openapi.json
```

A successful response should return HTTP status `200 OK`.

## Database Configuration

The backend connects to PostgreSQL using the `DATABASE_URL` environment variable.

In Docker Compose, the database hostname is the service name `db`, not `localhost`. The database service listens on port `5432` inside the Compose network.

Database credentials should be configured locally and must not be committed to version control.

If a database password contains reserved URL characters, encode those characters correctly when constructing the database connection URL.

## Troubleshooting

If the backend fails to start:

1. Inspect the backend logs.
2. Verify that the database container is healthy.
3. Check the `DATABASE_URL` format and credentials.
4. Confirm that the backend can resolve the `db` service hostname.
5. Verify port publishing if accessing the API directly from the host machine.

## Learning Outcomes

- Ran a FastAPI application in a Docker container.
- Configured database connectivity between Compose services.
- Published the backend API port for local testing.
- Used OpenAPI documentation to verify API availability.
- Diagnosed database connection and application startup errors.

For complete setup instructions, refer to the root project README.
