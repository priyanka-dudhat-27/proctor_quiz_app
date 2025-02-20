const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, description) => {
  try {
    const log = new ActivityLog({
      userId,
      description,
      timestamp: Date.now()
    });
    await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const getActivityLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const logs = await ActivityLog.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  logActivity,
  getActivityLogs
};
