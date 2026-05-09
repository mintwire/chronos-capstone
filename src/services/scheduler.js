const cron = require('node-cron');
const cronParser = require('cron-parser');
const Job = require('../models/job');
const JobExecution = require('../models/jobExecution');
const JobNotification = require('../models/jobNotification');
const executeJob = require('./jobExecutor');

let schedulerStarted = false;

const workerId = `${require('os').hostname()}-${process.pid}`;

const calculateNextRun = (cronExpression, referenceDate = new Date()) => {
  try {
    if (typeof cronParser.parseExpression === 'function') {
      return cronParser.parseExpression(cronExpression, {
        currentDate: referenceDate
      }).next().toDate();
    }

    if (cronParser.CronExpressionParser && typeof cronParser.CronExpressionParser.parse === 'function') {
      return cronParser.CronExpressionParser.parse(cronExpression, {
        currentDate: referenceDate
      }).next().toDate();
    }

    return null;
  } catch (error) {
    return null;
  }
};

const calculateBackoffMs = (retryCount) => {
  const baseDelay = 60 * 1000;
  const capDelay = 15 * 60 * 1000;
  return Math.min(baseDelay * (2 ** Math.max(retryCount - 1, 0)), capDelay);
};

const processDueJobs = async (now = new Date()) => {
  console.log('⏱ Running scheduler...');

  try {
    const jobs = await Job.find({
      isActive: true,
      nextRunAt: { $lte: now },
      status: 'pending'
    }).sort({ nextRunAt: 1 }).lean();

    for (const scheduledJob of jobs) {
      const job = await Job.findOneAndUpdate(
        {
          _id: scheduledJob._id,
          isActive: true,
          status: 'pending',
          nextRunAt: { $lte: now }
        },
        {
          $set: {
            status: 'running',
            claimedAt: now,
            lockedBy: workerId
          }
        },
        { returnDocument: 'after' }
      );

      if (!job) {
        continue;
      }

      console.log(`🚀 Executing job: ${job.name}`);

      const execution = await JobExecution.create({
        job: job._id,
        attempt: job.retries + 1,
        status: 'running',
        startedAt: now,
        worker: workerId
      });

      try {
        const result = await executeJob(job);
        const finishedAt = new Date();

        execution.status = 'success';
        execution.result = result;
        execution.finishedAt = finishedAt;
        execution.durationMs = finishedAt.getTime() - now.getTime();
        await execution.save();

        job.lastRunAt = finishedAt;
        job.lastError = null;
        job.retries = 0;
        job.claimedAt = null;
        job.lockedBy = null;

        if (job.scheduleType === 'recurring') {
          const nextRunAt = calculateNextRun(job.cronExpression, finishedAt);

          if (!nextRunAt) {
            throw new Error('Unable to calculate next run time for recurring job');
          }

          job.status = 'pending';
          job.nextRunAt = nextRunAt;
        } else {
          job.status = 'completed';
          job.completedAt = finishedAt;
          job.isActive = false;
        }

        await job.save();
        console.log(`✅ Job executed: ${job.name}`);
      } catch (error) {
        const finishedAt = new Date();

        execution.status = 'failed';
        execution.error = error.message;
        execution.finishedAt = finishedAt;
        execution.durationMs = finishedAt.getTime() - now.getTime();
        await execution.save();

        job.lastRunAt = finishedAt;
        job.lastError = error.message;
        job.retries += 1;
        job.claimedAt = null;
        job.lockedBy = null;

        if (job.retries >= job.maxRetries) {
          job.status = 'failed';
          job.failedAt = finishedAt;
          job.isActive = false;
          job.lastNotificationAt = finishedAt;
          await JobNotification.create({
            job: job._id,
            type: 'failure',
            title: `Job failed permanently: ${job.name}`,
            message: `Job ${job.name} reached the maximum retry limit after ${job.retries} attempt(s).`,
            metadata: {
              attempts: job.retries,
              maxRetries: job.maxRetries,
              lastError: error.message,
              workerId
            }
          });

          console.error(`Job failed permanently: ${job.name}. Notification recorded.`);
        } else {
          job.status = 'pending';
          job.nextRunAt = new Date(finishedAt.getTime() + calculateBackoffMs(job.retries));
          console.warn(`Job failed, retry scheduled: ${job.name} (attempt ${job.retries}/${job.maxRetries})`);
        }

        await job.save();
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error.message);
  }
};

const startScheduler = () => {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  cron.schedule('* * * * *', async () => {
    await processDueJobs(new Date());
  });
};

module.exports = startScheduler;
module.exports.processDueJobs = processDueJobs;
module.exports.calculateNextRun = calculateNextRun;