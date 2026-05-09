# Chronos Job Scheduler System

Chronos is a Node.js and MongoDB-backed job scheduling backend for one-time and recurring jobs. It provides REST APIs for submitting jobs, monitoring execution, cancelling and rescheduling jobs, and reviewing failure notifications.

## What It Demonstrates

- RESTful job submission and management
- One-time and recurring job scheduling
- Automatic retries with backoff
- Persistent execution history and failure notifications
- Health monitoring and database status reporting
- API-key based authentication with read/write separation

## Requirement Coverage

- Recurring jobs: implemented with cron expressions and next-run calculation.
- Job management APIs: implemented for list, details, cancel, reschedule, and execution history.
- Monitoring system: implemented through the `/health` endpoint, which reports database state and collection counts.
- Authentication: implemented with admin and read-only API keys.
- Scalability: designed around MongoDB-backed state, atomic claiming of jobs, and a scheduler that can run on multiple instances.

## Tech Stack

- Node.js
- Express
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

Create a `.env` file from `.env.example` and set:

- `MONGO_URI`
- `JOB_ADMIN_API_KEY`
- `JOB_READ_API_KEY` if you want a separate read-only key
- `PORT` if you want a custom port

### Run

```bash
npm run dev
```

or

```bash
npm start
```

### Test

```bash
npm test
```

## Authentication

When `JOB_ADMIN_API_KEY` is set, all job and notification routes require a valid API key.

Use one of these headers:

- `x-api-key: your-api-key`
- `Authorization: Bearer your-api-key`

`JOB_READ_API_KEY` can be used for read-only `GET` requests, while the admin key is required for create, cancel, and reschedule actions.

## API Summary

### Health

- `GET /health`

Returns MongoDB status plus counts for jobs, executions, and notifications.

### Jobs

Base path: `/api/jobs`

- `POST /` - create a job
- `GET /` - list jobs
- `GET /:id` - fetch a job by id
- `GET /:id/executions` - fetch execution history for a job
- `PATCH /:id/cancel` - cancel a job
- `PATCH /:id/reschedule` - reschedule a job

### Notifications

Base path: `/api/notifications`

- `GET /` - list failure notifications
- Optional query: `jobId=<job id>`

## Example Job Payload

```json
{
  "name": "Daily report",
  "type": "report",
  "payload": {
    "channel": "ops"
  },
  "scheduleType": "recurring",
  "scheduleTime": "2026-05-06T10:00:00.000Z",
  "cronExpression": "0 9 * * *",
  "maxRetries": 3
}
```

## Design Notes

- The scheduler polls MongoDB every minute and atomically claims due jobs.
- Execution history is stored in a dedicated collection for auditing and monitoring.
- Recurring jobs advance using cron expressions, which keeps the system flexible.
- Retry backoff is exponential with a cap to avoid immediate retry loops.
- Permanent failures create notification records so the system can surface them through the API.

## Scalability Considerations

- Job state lives in MongoDB, so multiple API instances can read and update the same source of truth.
- The scheduler claims jobs with an atomic update before execution, which reduces duplicate processing when the app is scaled horizontally.
- Execution history and notifications are stored separately from the main job record, which keeps the job document compact.
- The current polling scheduler is simple and reliable for a capstone project; a production system could later move to a queue or worker pool for higher throughput.

## Current Limitations

- Execution handlers are generic stubs, so external integrations like email providers or queue workers are not wired in yet.
- Failure notifications are persisted and queryable, but not sent to an external channel.

## Suggested Demo Flow

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a short walkthrough you can use while recording.