const UserAnalytics = require('../models/UserAnalytics');

const updateAnalytics = async (userId, data) => {
  try {
    await UserAnalytics.findOneAndUpdate(
      { userId },
      { $set: data },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const analytics = await UserAnalytics.findOne({ userId: req.params.userId });
    res.status(200).json(analytics || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  updateAnalytics,
  getUserAnalytics
};
