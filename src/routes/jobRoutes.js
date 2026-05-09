const express = require('express');
const router = express.Router();

const {
	requireReadAccess,
	requireWriteAccess,
} = require('../middleware/auth');

const {
	createJob,
	getJobs,
	getJobById,
	getJobExecutions,
	cancelJob,
	rescheduleJob
} = require('../controllers/jobController');

	router.get('/', requireReadAccess, getJobs);
	router.get('/:id', requireReadAccess, getJobById);
	router.get('/:id/executions', requireReadAccess, getJobExecutions);
	router.post('/', requireWriteAccess, createJob);
	router.patch('/:id/cancel', requireWriteAccess, cancelJob);
	router.patch('/:id/reschedule', requireWriteAccess, rescheduleJob);

module.exports = router;
