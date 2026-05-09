const express = require('express');
const jobRoutes = require('./routes/jobRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { authenticateApiKey } = require('./middleware/auth');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		name: 'Chronos Job Scheduler System',
		status: 'ok'
	});
});

app.use('/health', healthRoutes);
app.use('/api/notifications', authenticateApiKey, notificationRoutes);
app.use('/api/jobs', authenticateApiKey, jobRoutes);

module.exports = app;