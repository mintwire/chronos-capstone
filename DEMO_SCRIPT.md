# Chronos Demo Script

Use this as a short walkthrough for the capstone video.

## 1. Open with the problem

Say that Chronos is a backend job scheduling system for one-time and recurring jobs, built with Node.js, Express, MongoDB, and Mongoose.

Explain that the goal is to submit jobs, run them on schedule, retry failures, and keep execution history and notifications in the database.

## 2. Show the project structure

Briefly point to the main folders:

- `src/routes` for REST endpoints
- `src/controllers` for request handling
- `src/models` for MongoDB schemas
- `src/services` for the scheduler and execution logic
- `README.md` for setup and API documentation

## 3. Show the API basics

Demonstrate that the app is running and mention these endpoints:

- `GET /health`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `PATCH /api/jobs/:id/cancel`
- `PATCH /api/jobs/:id/reschedule`
- `GET /api/jobs/:id/executions`
- `GET /api/notifications`

## 4. Create a one-time job

Submit a simple job with a future `scheduleTime`.

Mention that the API validates required fields and stores the job in MongoDB with `pending` status.

## 5. Create a recurring job

Submit a recurring job with a cron expression.

Explain that the scheduler advances the next run time after each successful execution.

## 6. Show retries and failure handling

Create a job that is designed to fail.

Explain that the scheduler records an execution attempt, retries with backoff, and marks the job as failed after the maximum retry count.

Show that a failure notification is created and can be retrieved from `/api/notifications`.

## 7. Show job management

Demonstrate listing jobs, fetching a single job, cancelling a job, and rescheduling it.

Point out that the system supports operational control instead of only submission.

## 8. Show monitoring

Open `/health` and explain that it reports database state and counts for jobs, executions, and notifications.

## 9. Close with design decisions

Summarize these points:

- MongoDB is the source of truth
- The scheduler claims jobs atomically to reduce duplicate execution
- Execution history is persisted for traceability
- Authentication protects job management endpoints
- The code is structured so real worker integrations can be added later

## 10. Final line

End by saying Chronos is a scalable backend foundation for scheduled work, and that the current implementation already covers one-time jobs, recurring jobs, retries, monitoring, and notification tracking.