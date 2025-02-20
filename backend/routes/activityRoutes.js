const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:userId').get(protect, admin, getActivityLogs);

module.exports = router;
