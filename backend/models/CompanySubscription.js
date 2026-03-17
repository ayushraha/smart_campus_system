const mongoose = require('mongoose');

const companySubscriptionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// Prevent duplicate subscriptions
companySubscriptionSchema.index({ studentId: 1, companyName: 1 }, { unique: true });

module.exports = mongoose.model('CompanySubscription', companySubscriptionSchema);
