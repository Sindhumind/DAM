# DAM --- Digital Asset Management

A web-based Digital Asset Management (DAM) application for uploading,
organizing, viewing, and processing digital assets. The project uses a
React/TypeScript frontend, a Node.js/Express backend, and a background
worker with supporting infrastructure services.

> **Project status:** The assignment code has been pushed to GitHub.
> Validate the current build, Docker configuration, and end-to-end
> workflows before treating the application as production-ready.

## Repository

-   GitHub: https://github.com/Sindhumind/DAM
-   Main branch: `main`

## Technology Stack

-   **Frontend:** React, TypeScript, Vite
-   **Backend:** Node.js, Express, TypeScript
-   **Database:** PostgreSQL
-   **Object storage:** MinIO
-   **Message broker:** RabbitMQ
-   **Cache / queue-related support:** Redis
-   **Background processing:** Node.js/TypeScript worker
-   **Containerization:** Docker and Docker Compose
-   **Web server / reverse proxy:** Nginx (frontend container
    configuration; validation is still required)

## Main Components

### Frontend

The frontend provides the user interface for authentication and
asset-library workflows. The source includes components for asset cards,
grid/list views, upload flows, previews, metadata editing, and dashboard
statistics.

### Backend API

The Express API contains routes, controllers, repositories, and services
for asset operations, authentication, user management, and
worker-related operations.

### Background worker

The worker consumes asset-processing jobs from RabbitMQ and processes
assets asynchronously. MinIO is used for object storage.

### Infrastructure

The current Compose setup includes these services:

  Service    Purpose                            Default host port
  ---------- ---------------------------------- -------------------
  MinIO      Object storage and web console     `9000`, `9001`
  RabbitMQ   Message broker and management UI   `5672`, `15672`
  Redis      In-memory data store               `127.0.0.1:6379`

PostgreSQL is used by the backend, but confirm its configuration and
availability in your environment before starting the full application.
The frontend Nginx configuration and full-stack Compose integration also
need validation.

## Prerequisites

Install the following tools:

-   Git
-   Node.js and npm (Node.js 22 is used in the frontend Docker build)
-   Docker Desktop with Docker Compose
-   PostgreSQL, if it is not provided by your development environment

## Clone the Repository

``` bash
git clone https://github.com/Sindhumind/DAM.git
cd DAM
```

## Environment Configuration

Create local environment files as needed for the backend, worker, and
root Docker Compose configuration. Use the variable names expected by
the project code and Compose file.

The root Compose configuration expects these variables in the root
`.env` file:

``` dotenv
RABBITMQ_DEFAULT_USER=your_rabbitmq_user
RABBITMQ_DEFAULT_PASS=replace_with_a_strong_password
MINIO_ROOT_USER=your_minio_user
MINIO_ROOT_PASSWORD=replace_with_a_strong_password
```

The backend also uses database connection settings:

``` dotenv
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=replace_with_a_strong_password
DB_NAME=your_database_name
PORT=3000
```

The backend and worker use a RabbitMQ connection URL. The backend also
uses a Redis URL or defaults to `redis://127.0.0.1:6379` when running
outside Docker. When running in Compose, use the service hostname (for
example, `redis`) rather than `127.0.0.1` to reach another container.

``` dotenv
RABBITMQ_URL=amqp://your_rabbitmq_user:your_rabbitmq_password@rabbitmq:5672
REDIS_URL=redis://redis:6379
```

**Security notes:**

-   Never commit `.env` files, real passwords, access tokens, or
    production secrets.
-   Use strong, unique credentials and rotate any credentials that may
    have been exposed.
-   Do not copy the example placeholder values into a production
    environment.
-   Confirm all required environment variables in the source code before
    deployment.

## Run the Infrastructure Services

From the repository root, start the currently configured infrastructure
services:

``` bash
docker compose up -d minio rabbitmq redis
```

Check service status:

``` bash
docker compose ps
```

View logs for an individual service:

``` bash
docker compose logs -f minio
docker compose logs -f rabbitmq
docker compose logs -f redis
```

The MinIO console is normally available at `http://localhost:9001`, and
the RabbitMQ management UI is normally available at
`http://localhost:15672`. Sign in with the credentials configured in
your local `.env` file.

> Do not run `docker compose down -v` unless you deliberately intend to
> remove named volumes and their stored data.

## Backend

Install dependencies:

``` bash
cd backend
npm ci
```

Build the TypeScript backend:

``` bash
npm run build
```

Start the development server:

``` bash
npm run dev
```

The backend uses port `3000` by default. A health endpoint is configured
at `/health`; it depends on the database and Redis connections, so a
successful response requires those dependencies to be reachable.

### Database migrations

The repository includes SQL migration files under `backend/migrations`.
The backend package defines a migration script:

``` bash
npm run migrate
```

Run migrations only after confirming the database connection settings
and reviewing the migrations for your environment.

## Frontend

Install dependencies:

``` bash
cd frontend
npm ci
```

Build the frontend:

``` bash
npm run build
```

Run the Vite development server:

``` bash
npm run dev
```

The frontend Dockerfile builds the Vite application and copies the
generated `dist` files into an Nginx image. **The current Nginx
configuration has reported an `unknown directive "server"` error and
must be fixed and validated before relying on the frontend container.**

## Worker

Install dependencies and build the worker:

``` bash
cd worker
npm ci
npm run build
```

The package defines a start command:

``` bash
npm start
```

Configure the worker with a valid `RABBITMQ_URL` and verify that the
RabbitMQ service is reachable before starting it. Review the worker logs
to confirm that it connects and processes jobs as expected.

## Useful Validation Checklist

Before presenting the project as complete, verify each item in your own
environment:

-   [ ] Root `.env` and service-specific `.env` files are excluded from
    Git.
-   [ ] Backend dependencies install successfully.
-   [ ] `npm run build` succeeds in `backend`.
-   [ ] `npm run build` succeeds in `frontend`.
-   [ ] `npm run build` succeeds in `worker`.
-   [ ] PostgreSQL is reachable and migrations complete successfully.
-   [ ] Backend health endpoint responds as expected.
-   [ ] Login and authentication flows work.
-   [ ] Asset upload, listing, preview, metadata editing, and download
    work.
-   [ ] RabbitMQ jobs are consumed by the worker.
-   [ ] MinIO stores and serves the expected objects.
-   [ ] Redis connectivity works.
-   [ ] Nginx configuration passes `nginx -t`.
-   [ ] Docker Compose startup and service health are verified.
-   [ ] No credentials, tokens, or sensitive files are included in the
    commit.

## Troubleshooting

### Backend health check fails

Check the backend logs and verify PostgreSQL and Redis connection
settings. Inside Docker, use service names as hosts rather than
`localhost` or `127.0.0.1` for other containers.

### Worker does not process jobs

Verify `RABBITMQ_URL`, RabbitMQ credentials, queue names, and worker
logs. Confirm the backend publishes jobs to the queues the worker
consumes.

### Nginx reports `unknown directive "server"`

The `server` directive must be inside the Nginx `http` context. Inspect
the active main configuration and the file included from
`/etc/nginx/conf.d/`, then run `nginx -t` after correcting the
configuration.

### Docker data safety

The project uses named volumes for MinIO, RabbitMQ, and Redis in the
current Compose setup. Avoid deleting volumes during routine
troubleshooting.

## Development Notes

-   Work on a feature branch when making significant changes.
-   Review `git status` and `git diff` before committing.
-   Keep `.env` files and secrets out of version control.
-   Test changes locally before pushing to `main`.
-   Record known issues clearly rather than marking unverified features
    as complete.

## License

No license information is specified in this README. Add a `LICENSE` file
if you intend to publish the project under an open-source license.
