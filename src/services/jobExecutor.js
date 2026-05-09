const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const executeJob = async (job) => {
  const jobType = String(job.type || '').toLowerCase();
  const payload = job.payload || {};

  if (payload.delayMs) {
    await delay(Number(payload.delayMs));
  }

  if (payload.shouldFail || jobType === 'fail') {
    throw new Error(payload.errorMessage || `Job ${job.name} failed intentionally`);
  }

  switch (jobType) {
    case 'noop':
      return {
        message: 'No-op job completed',
        payload
      };
    case 'report':
      return {
        message: 'Report job completed',
        generatedAt: new Date().toISOString(),
        payload
      };
    case 'cleanup':
      return {
        message: 'Cleanup job completed',
        cleanedAt: new Date().toISOString(),
        payload
      };
    case 'notification':
    case 'email':
      return {
        message: 'Notification job completed',
        payload,
        dispatched: false,
        note: 'Hook a real provider into this handler for production'
      };
    default:
      return {
        message: 'Job completed',
        jobType,
        payload
      };
  }
};

module.exports = executeJob;