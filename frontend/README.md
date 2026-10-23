# FleetFlow Frontend

The FleetFlow frontend provides the user interface for the logistics management platform. It is built with React and Vite and served through Nginx in the containerized setup.

## Technology Stack

- React
- Vite
- JavaScript
- Nginx
- Docker

## Responsibilities

- Render the FleetFlow user interface.
- Request dashboard, shipment, and inventory data from the backend APIs.
- Serve the production frontend build using Nginx.
- Forward `/api/` requests to the FastAPI backend through Nginx.

## Docker Architecture

The frontend uses a multi-stage Docker build:

1. **Build stage:** Node.js installs dependencies and generates the production build.
2. **Runtime stage:** Nginx serves the generated static files and handles API proxy requests.

This approach keeps the runtime container focused on serving the built frontend rather than running the development server.

## Run with Docker Compose

From the project root:

```bash
docker compose up -d --build frontend
```

The frontend is available at:

http://localhost:8080

The backend API documentation is available at:

http://localhost:8000/docs

## Important Configuration

The `nginx.conf` file defines the routing behavior.

- `/api/` requests are proxied to `http://backend:8000/`.
- Other frontend paths are served through the React application's `index.html`, supporting client-side navigation.

The Nginx configuration is copied into `/etc/nginx/conf.d/default.conf` in the runtime image.

## Troubleshooting

Check frontend logs:

```bash
docker compose logs --tail=100 frontend
```

Check the running services:

```bash
docker compose ps
```

After modifying `Dockerfile` or `nginx.conf`, rebuild and recreate the frontend container to apply the changes.

## Learning Outcomes

- Built a production frontend image using a multi-stage Dockerfile.
- Served static frontend assets using Nginx.
- Configured reverse-proxy routing for backend API requests.
- Investigated and resolved frontend API routing and 404 errors.

For the complete architecture and setup instructions, see the root project README.
