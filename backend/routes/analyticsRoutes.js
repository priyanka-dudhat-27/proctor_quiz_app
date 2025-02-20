const express = require('express');
const { getUserAnalytics } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:userId').get(protect, admin, getUserAnalytics);

module.exports = router;
