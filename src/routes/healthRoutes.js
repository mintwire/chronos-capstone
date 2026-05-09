const express = require('express');
const mongoose = require('mongoose');
const Job = require('../models/job');
const JobExecution = require('../models/jobExecution');
const JobNotification = require('../models/jobNotification');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [jobStatusCounts, executionStatusCounts, notificationStatusCounts, totalJobs, totalExecutions, totalNotifications] = await Promise.all([
      Job.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      JobExecution.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      JobNotification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Job.countDocuments(),
      JobExecution.countDocuments(),
      JobNotification.countDocuments()
    ]);

    const jobs = jobStatusCounts.reduce((accumulator, item) => {
      accumulator[item._id || 'unknown'] = item.count;
      return accumulator;
    }, {});

    const executions = executionStatusCounts.reduce((accumulator, item) => {
      accumulator[item._id || 'unknown'] = item.count;
      return accumulator;
    }, {});

    const notifications = notificationStatusCounts.reduce((accumulator, item) => {
      accumulator[item._id || 'unknown'] = item.count;
      return accumulator;
    }, {});

    return res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      jobs: {
        total: totalJobs,
        ...jobs
      },
      executions: {
        total: totalExecutions,
        ...executions
      },
      notifications: {
        total: totalNotifications,
        ...notifications
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;