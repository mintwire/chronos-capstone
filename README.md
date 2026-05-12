# Chronos Job Scheduler

A Node.js and MongoDB-backed job scheduling backend for one-time and recurring jobs.

## What It Demonstrates

- RESTful job submission and management
- One-time and recurring job scheduling with cron expressions
- Automatic retries with exponential backoff
- Persistent execution history and failure notifications
- Health monitoring and database status reporting
- API-key based authentication with read/write separation

## Requirement Coverage

- **Recurring jobs:** Implemented with cron expressions and automatic next-run calculation.
- **Job management APIs:** List, details, cancel, reschedule, and execution history endpoints.
- **Monitoring system:** `/health` endpoint reports database state and collection counts.
- **Authentication:** Admin and read-only API keys for access control.
- **Scalability:** MongoDB-backed state, atomic job claiming, and multi-instance scheduler support.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- node-cron and cron-parser
- Node test runner, Supertest, and mongodb-memory-server for integration tests

## Setup

### Prerequisites

- Node.js 18 or newer
- MongoDB running locally or in the cloud

### Install

```bash
npm install
```

### Environment

Create a `.env` file:

```env
MONGO_URI=mongodb://127.0.0.1:27017/chronosDB
PORT=5050
JOB_ADMIN_API_KEY=your-admin-secret-key
JOB_READ_API_KEY=your-read-only-key
```

### Start the Server

```bash
npm start
```

Server runs on `http://localhost:5050`

## API Endpoints

All endpoints (except `/health`) require `x-api-key` header for authentication.

### Health

- `GET /health` — Server and database status

### Jobs

- `POST /api/jobs` — Create a new job (requires admin key)
- `GET /api/jobs` — List all jobs
- `GET /api/jobs/:id` — Get job details
- `GET /api/jobs/:id/executions` — Get execution history for a job
- `PATCH /api/jobs/:id/cancel` — Cancel a pending job (requires admin key)
- `PATCH /api/jobs/:id/reschedule` — Reschedule a job (requires admin key)

### Notifications

- `GET /api/notifications` — List failure notifications

## Request Examples

### Create One-time Job

```bash
curl -X POST http://localhost:5050/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-admin-secret-key" \
  -d '{
    "name": "Daily Report",
    "type": "report",
    "payload": {"channel": "ops"},
    "scheduleType": "once",
    "scheduleTime": "2026-05-12T15:00:00Z",
    "maxRetries": 2
  }'
```

### Create Recurring Job (Every Minute)

```bash
curl -X POST http://localhost:5050/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-admin-secret-key" \
  -d '{
    "name": "Recurring Task",
    "type": "report",
    "payload": {"channel": "ops"},
    "scheduleType": "recurring",
    "scheduleTime": "2026-05-12T00:00:00Z",
    "cronExpression": "*/1 * * * *",
    "maxRetries": 1
  }'
```

### List Jobs

```bash
curl http://localhost:5050/api/jobs \
  -H "x-api-key: your-admin-secret-key"
```

## Demo with Postman

Import `postman_collection.json` into Postman Desktop:

1. File → Import → Choose `postman_collection.json`
2. Set collection variables:
   - `baseUrl` = `http://localhost:5050`
   - `adminKey` = Your admin API key
3. Run requests in the collection
4. Collection Runner automatically captures `jobId` and uses it in follow-up requests

## Testing

```bash
npm test
```

Runs 2 integration tests:
- Job creation and listing with authentication
- Automatic retry and notification recording on failure

## Architecture

### Services

- **Scheduler** (`src/services/scheduler.js`) — Runs every minute, claims and executes eligible jobs
- **Job Executor** (`src/services/jobExecutor.js`) — Executes job logic, handles retries with backoff
- **Database** (`src/config/db.js`) — MongoDB connection and initialization

### Models

- **Job** — Stores job definition and state
- **JobExecution** — Records each execution attempt
- **JobNotification** — Records failures for review

## License

ISC
