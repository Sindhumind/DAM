# DAM — Digital Asset Management

A full-stack Digital Asset Management (DAM) application for uploading, organizing, searching, previewing, and asynchronously processing image and video assets. Built with a React 19 + TypeScript frontend, a Node.js + Express + TypeScript REST API, and a background media-processing worker backed by PostgreSQL, MinIO, RabbitMQ, and Redis.

## Repository

* **GitHub:** https://github.com/Sindhumind/DAM
* **Main branch:** `main`

---

## Architecture Overview

```text
+-------------------------------------------------------------------------+

|                           Browser (User / Admin)                        |
|               React 19 + TypeScript + Tailwind CSS (Port 8080)          |
+------------------------------------+------------------------------------+
                                     | HTTPS / HTTP (HttpOnly JWT Cookie)
                                     v
+-------------------------------------------------------------------------+

|                        Backend API (Node.js / Express)                  |
|   - Auth & RBAC Ownership Checks      - Swagger UI (/api-docs)          |
|   - Magic-Byte File Validation        - Redis-Backed Rate Limiting      |
+--------+---------------------+---------------------+--------------------+

         |                     |                     |
         v                     v                     v
+----------------+   +-------------------+   +----------------------------+

| PostgreSQL 16  |   |     Redis 7       |   |         MinIO (S3)         |
| Assets, Users, |   | Stats Cache &     |   | Originals & Thumbnails     |
| JSONB & Trgm   |   | Rate-Limit Store  |   | (Ports 9000 / 9001)        |
+----------------+   +-------------------+   +-------------+--------------+
         ^                                                 ^

         | Lease & Metadata Updates                        | Read/Write Media
         |           +-------------------+                 |
         +-----------+   RabbitMQ 4      +-----------------+

                     | Processing & DLQ  |
                     | (Ports 5672/15672)|
                     +---------+---------+
                               |
                               v
                     +-------------------+

                     | Background Worker |
                     | FFmpeg & Sharp    |
                     +-------------------+
```

---

## Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express 5, TypeScript, Swagger UI (`swagger-ui-express`)
* **Database:** PostgreSQL 16 (JSONB metadata, `pg_trgm` trigram search indexes, transactional migrations)
* **Object Storage:** MinIO (S3-compatible storage for originals and generated thumbnails)
* **Message Broker:** RabbitMQ 4 (asynchronous job queue with retry and dead-letter routing)
* **Cache & Throttling:** Redis 7 (dashboard stats cache + distributed rate limiting)
* **Background Worker:** Node.js / TypeScript worker with distributed lease-token locking
* **Containerization & CI:** Docker, Docker Compose, Nginx, GitHub Actions

---

## Prerequisites

* [Docker Desktop](https://docker.com) (with Docker Compose v2)
* [Node.js 22+](https://nodejs.org) and `npm` (for local development and running tests outside Docker)

---

## Quick Start (Docker Compose — Recommended)

The entire stack—including PostgreSQL, Redis, RabbitMQ, MinIO, Backend, Worker, and Frontend—is configured to run out of the box with Docker Compose.

### 1. Clone the repository
```bash
git clone https://github.com/Sindhumind/DAM.git
cd DAM
```

### 2. Configure environment variables
Copy the provided `.env.example` templates and replace placeholder passwords/secrets with strong values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
```

> **Security note:** Never commit `.env` files or real credentials to version control.

### 3. Build and start all services
```bash
docker compose up --build -d
```

Verify that all containers are running and healthy:
```bash
docker compose ps
```

### 4. Run database migrations
Apply the PostgreSQL schema, foreign keys, and trigram search indexes:
```bash
docker compose exec backend npm run migrate
```

### 5. Access the running services

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:8080` | Nginx serving the React production build |
| **Backend Health Check** | `http://localhost:3000/health` | Verifies PostgreSQL and Redis connectivity |
| **Swagger / OpenAPI Docs** | `http://localhost:3000/api-docs` | Interactive REST API explorer (`/api-docs.json` for raw spec) |
| **MinIO Console** | `http://localhost:9001` | Object storage browser (sign in with `MINIO_ROOT_USER`) |
| **RabbitMQ Management** | `http://localhost:15672` | Queue monitor (sign in with `RABBITMQ_DEFAULT_USER`) |

> Do not run `docker compose down -v` unless you intend to delete the persistent named volumes (`postgres_data`, `minio_test_data`, `rabbitmq_data`, `redis_data`).

---

## Local Development (Without Full Compose)

The repository uses **npm workspaces** at the root (`backend`, `frontend`, `worker`).

### Install dependencies
```bash
npm install
```

### Start infrastructure only
```bash
docker compose up -d postgres minio rabbitmq redis
```

### Run individual services
* **Backend API (Port 3000):**
  ```bash
  cd backend
  npm run migrate
  npm run dev
  ```
* **Background Worker:**
  ```bash
  cd worker
  npm run dev
  ```
* **Frontend Dev Server (Port 5173):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## Testing & CI

Automated unit and integration tests are implemented with **Vitest**, **Supertest**, and **React Testing Library** across all workspaces.

Run all test suites from the repository root:
```bash
npm test
```

Build all workspaces:
```bash
npm run build
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) automatically runs linting, unit/integration tests, TypeScript/Vite builds, and Docker Compose image builds on every push and pull request to `main`.

---

## API Documentation

Interactive OpenAPI 3.0 documentation is served automatically by the backend at:
* **Swagger UI:** `http://localhost:3000/api-docs`
* **OpenAPI JSON Spec:** `http://localhost:3000/api-docs.json`

Core endpoint groups include:
* `GET /health` — Database and Redis health check
* `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — HttpOnly cookie session authentication
* `GET /api/assets`, `GET /api/assets/stats` — Paginated search/filtering and cached dashboard stats
* `POST /api/assets/upload` — Multi-file batch upload (up to 10 files) with binary magic-byte validation
* `GET /api/assets/:id/preview`, `GET /api/assets/:id/download` — Owner-authorized, ETag-cached streaming
* `PATCH /api/assets/:id/metadata`, `DELETE /api/assets/:id` — Metadata updates and atomic storage + DB deletion

---

## Troubleshooting

* **Backend health check fails:** Ensure PostgreSQL and Redis containers are healthy (`docker compose ps`) and verify `DB_HOST=postgres` and `REDIS_URL=redis://redis:6379` inside Docker.
* **Worker does not process jobs:** Check `docker compose logs -f worker` and verify `RABBITMQ_URL` and `WORKER_API_TOKEN` match between `backend/.env` and `worker/.env`.
* **Port conflicts:** Stop any local PostgreSQL, Redis, or Nginx processes occupying ports `3000`, `5672`, `6379`, `8080`, or `9000` before starting Docker Compose.