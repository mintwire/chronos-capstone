const mongoose = require('mongoose');

const jobExecutionSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  attempt: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['running', 'success', 'failed'],
    default: 'running'
  },
  startedAt: {
    type: Date,
    required: true
  },
  finishedAt: Date,
  durationMs: Number,
  result: mongoose.Schema.Types.Mixed,
  error: String,
  worker: String
}, { timestamps: true });

module.exports = mongoose.models.JobExecution || mongoose.model('JobExecution', jobExecutionSchema);