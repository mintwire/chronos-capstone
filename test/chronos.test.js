const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Job = require('../src/models/job');
const JobExecution = require('../src/models/jobExecution');
const JobNotification = require('../src/models/jobNotification');
const { processDueJobs } = require('../src/services/scheduler');

let mongoServer;
let app;

const adminKey = 'test-admin-key';
const readKey = 'test-read-key';

const clearCollections = async () => {
  await Promise.all([
    Job.deleteMany({}),
    JobExecution.deleteMany({}),
    JobNotification.deleteMany({})
  ]);
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri('chronos-test');
  process.env.JOB_ADMIN_API_KEY = adminKey;
  process.env.JOB_READ_API_KEY = readKey;

  await mongoose.connect(process.env.MONGO_URI);
  app = require('../src/app');
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test.beforeEach(async () => {
  await clearCollections();
});

test('creates and lists jobs with auth', async () => {
  const createResponse = await request(app)
    .post('/api/jobs')
    .set('x-api-key', adminKey)
    .send({
      name: 'Daily report',
      type: 'report',
      payload: { channel: 'ops' },
      scheduleType: 'once',
      scheduleTime: new Date(Date.now() + 60_000).toISOString(),
      maxRetries: 2
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.name, 'Daily report');
  assert.equal(createResponse.body.status, 'pending');

  const listResponse = await request(app)
    .get('/api/jobs')
    .set('x-api-key', readKey);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.length, 1);
  assert.equal(listResponse.body[0].name, 'Daily report');
});

test('records notifications when a job permanently fails', async () => {
  const dueTime = new Date(Date.now() - 60_000);

  const failingJob = await Job.create({
    name: 'Failing job',
    type: 'fail',
    payload: { shouldFail: true, errorMessage: 'expected failure' },
    scheduleType: 'once',
    scheduleTime: dueTime,
    nextRunAt: dueTime,
    status: 'pending',
    retries: 0,
    maxRetries: 1,
    isActive: true
  });

  await processDueJobs(new Date());

  const updatedJob = await Job.findById(failingJob._id).lean();
  assert.equal(updatedJob.status, 'failed');
  assert.equal(updatedJob.isActive, false);
  assert.equal(updatedJob.lastError, 'expected failure');

  const notifications = await JobNotification.find({ job: failingJob._id }).lean();
  assert.equal(notifications.length, 1);
  assert.match(notifications[0].message, /maximum retry limit/i);

  const notificationsResponse = await request(app)
    .get('/api/notifications')
    .set('x-api-key', readKey);

  assert.equal(notificationsResponse.status, 200);
  assert.equal(notificationsResponse.body.length, 1);
  assert.equal(notificationsResponse.body[0].title, `Job failed permanently: ${failingJob.name}`);
});