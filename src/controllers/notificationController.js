const mongoose = require('mongoose');
const JobNotification = require('../models/jobNotification');

exports.getNotifications = async (req, res) => {
  try {
    const filter = {};

    if (req.query.jobId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.jobId)) {
        return res.status(400).json({ error: 'Invalid job id' });
      }

      filter.job = req.query.jobId;
    }

    const notifications = await JobNotification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};