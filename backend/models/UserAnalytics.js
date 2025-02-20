const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  focusPercentage: { type: Number, default: 0 },
  activityLevel: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);
