const mongoose = require('mongoose');
const Job = require('../models/job');
const JobExecution = require('../models/jobExecution');

const buildJobFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.scheduleType) {
    filter.scheduleType = query.scheduleType;
  }

  if (query.type) {
    filter.type = query.type;
  }

  return filter;
};

// ✅ CREATE JOB
exports.createJob = async (req, res) => {
  console.log("POST /jobs hit", req.body);

  try {
    const {
      name,
      type,
      payload = {},
      scheduleType = 'once',
      scheduleTime,
      cronExpression,
      maxRetries = 3
    } = req.body;

    if (!name || !type || !scheduleTime) {
      return res.status(400).json({
        error: 'name, type, and scheduleTime are required'
      });
    }

    if (scheduleType === 'recurring' && !cronExpression) {
      return res.status(400).json({
        error: 'cronExpression is required for recurring jobs'
      });
    }

    const job = await Job.create({
      name,
      type,
      payload,
      scheduleType,
      scheduleTime,
      nextRunAt: scheduleTime,
      cronExpression,
      maxRetries
    });

    return res.status(201).json(job);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }
};

// ✅ GET ALL JOBS
exports.getJobs = async (req, res) => {
  console.log("GET /jobs hit");

  try {
    const jobs = await Job.find(buildJobFilter(req.query))
      .sort({ createdAt: -1 })
      .lean();

    console.log("Jobs fetched:", jobs.length);

    return res.json(jobs);
  } catch (error) {
    console.error("GET ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getJobExecutions = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const executions = await JobExecution.find({ job: req.params.id })
      .sort({ startedAt: -1, createdAt: -1 })
      .lean();

    return res.json(executions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'completed') {
      return res.status(400).json({ error: 'Completed jobs cannot be cancelled' });
    }

    job.status = 'cancelled';
    job.isActive = false;
    job.cancelledAt = new Date();
    job.lockedBy = null;
    job.claimedAt = null;

    await job.save();

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.rescheduleJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job id' });
    }

    const { scheduleTime, cronExpression, scheduleType } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!scheduleTime) {
      return res.status(400).json({ error: 'scheduleTime is required' });
    }

    if (scheduleType === 'recurring' && !cronExpression) {
      return res.status(400).json({ error: 'cronExpression is required for recurring jobs' });
    }

    job.scheduleTime = scheduleTime;
    job.nextRunAt = scheduleTime;
    job.status = 'pending';
    job.isActive = true;
    job.cancelledAt = null;
    job.failedAt = null;
    job.lastError = null;
    job.retries = 0;

    if (scheduleType) {
      job.scheduleType = scheduleType;
    }

    if (cronExpression !== undefined) {
      job.cronExpression = cronExpression;
    }

    await job.save();

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};