# FleetFlow — Logistics Management Platform

A full-stack logistics management application containerized with Docker Compose. FleetFlow combines a React frontend, FastAPI backend, and PostgreSQL database to provide a foundation for shipment operations, tracking, dashboard metrics, and inventory management.

## Project Overview

FleetFlow is a three-tier application that I used as a hands-on lab to integrate Docker into an existing full-stack application and understand how its components communicate in a containerized environment.

The focus of this lab was application containerization, service connectivity, frontend-to-backend API routing, and troubleshooting deployment-related issues.

## Architecture

```text
                   User / Browser
                         |
                         v
              React Frontend + Nginx
                    Port 8080
                         |
                  /api/ requests
                         |
                         v
                  FastAPI Backend
                    Port 8000
                         |
                         v
                    PostgreSQL
                    Port 5432
```

The application runs using three Docker Compose services:

- **Frontend:** React application built with Vite and served by Nginx.
- **Backend:** FastAPI application served by Uvicorn.
- **Database:** PostgreSQL running in a separate container with a persistent Docker volume.

Nginx forwards API requests to the backend service over the Docker Compose network. PostgreSQL is accessed by the backend through the internal service hostname.

## Technology Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Python, FastAPI, Uvicorn
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose
- **Web Server / Reverse Proxy:** Nginx
- **Version Control:** Git and GitHub

## Key Hands-on Work

- Containerized the frontend and backend using separate Docker images.
- Configured PostgreSQL as a dedicated Docker Compose service.
- Connected application services using Docker Compose networking.
- Published the frontend and backend ports for local access.
- Configured Nginx to route `/api/` requests to the FastAPI backend.
- Integrated the Nginx configuration into the frontend Docker image.
- Troubleshot backend database connection issues and URL-encoding problems.
- Fixed Dockerfile configuration and API routing issues that caused 404 responses.
- Verified backend availability through the FastAPI OpenAPI endpoint.

## Run Locally with Docker Compose

### Prerequisites

- Docker Desktop
- Docker Compose
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd fleetflow-3tier-source-only
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Configure environment variables

Create a `.env` file in the project root and configure the variables referenced by `compose.yaml`:

```dotenv
POSTGRES_DB=fleetflow
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=replace_with_a_strong_local_password
```

Use a strong local password. Do not commit `.env` or production secrets to GitHub.

Ensure the backend database URL correctly references the Compose database service and URL-encodes special characters in credentials when required.

### 3. Build and start the services

```bash
docker compose up -d --build
```

### 4. Verify container status

```bash
docker compose ps
```

### 5. Access the application

| Component | Local URL |
|---|---|
| FleetFlow frontend | http://localhost:8080 |
| FastAPI Swagger documentation | http://localhost:8000/docs |
| FastAPI OpenAPI schema | http://localhost:8000/openapi.json |

PostgreSQL is available internally to the Compose services on port `5432`. It does not need to be exposed to the host for this setup.

## Useful Docker Commands

Check running services:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 db
```

Rebuild the frontend after changing its Dockerfile or Nginx configuration:

```bash
docker compose up -d --build frontend
```

Stop the services:

```bash
docker compose down
```

**Data note:** The PostgreSQL data volume is intended to persist database data when containers are recreated. Do not remove volumes unless you intentionally want to delete the stored database data.

## What I Learned

This lab helped me understand the practical relationship between Docker images, containers, port publishing, service discovery, persistent volumes, environment variables, and reverse-proxy configuration.

I also learned that a container reporting as running does not automatically mean every application endpoint is reachable. Validating logs, port mappings, API responses, and frontend network requests is an important part of troubleshooting.

## Current Scope

This project demonstrates local containerization and service integration. It is not presented as a production deployment. CI/CD, Kubernetes, cloud deployment, automated security scanning, and production monitoring can be added as future improvements.

## Future Improvements

- Implement CI/CD with Jenkins or GitHub Actions.
- Add automated testing and image vulnerability scanning.
- Deploy the application to AWS.
- Explore Kubernetes-based orchestration.
- Add application health monitoring and centralized logging.

---

**Project:** FleetFlow — Logistics Management Platform  
**Lab focus:** Docker Integration and Full-Stack Containerization
