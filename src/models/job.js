const mongoose = require('mongoose');
const { Schema } = mongoose;

const jobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  payload: {
    type: Schema.Types.Mixed,
    default: {}
  },
  scheduleType: {
    type: String,
    enum: ['once', 'recurring'],
    default: 'once'
  },
  scheduleTime: {
    type: Date,
    required: true
  },
  nextRunAt: {
    type: Date,
    required: true,
    index: true
  },
  cronExpression: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  retries: {
    type: Number,
    default: 0,
    min: 0
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRunAt: Date,
  lastError: String,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  lastNotificationAt: Date,
  claimedAt: Date,
  lockedBy: String
}, { timestamps: true });

jobSchema.index({ status: 1, nextRunAt: 1, isActive: 1 });

jobSchema.pre('validate', function() {
  if (this.scheduleTime && !this.nextRunAt) {
    this.nextRunAt = this.scheduleTime;
  }

  if (!this.scheduleTime && this.nextRunAt) {
    this.scheduleTime = this.nextRunAt;
  }

  if (this.scheduleType === 'recurring' && !this.cronExpression) {
    this.invalidate('cronExpression', 'cronExpression is required for recurring jobs');
  }
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);