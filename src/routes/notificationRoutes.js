const express = require('express');
const { getNotifications } = require('../controllers/notificationController');
const { requireReadAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireReadAccess, getNotifications);

module.exports = router;