const mongoose = require('mongoose');

const jobNotificationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['failure'],
    default: 'failure'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readAt: Date
}, { timestamps: true });

module.exports = mongoose.models.JobNotification || mongoose.model('JobNotification', jobNotificationSchema);