const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  company: String,
  role: String,
  salary: Number,
  batch: String,
  bio: String,
  profileImage: String,
  skills: [String],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalMentees: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  availability: { 
    type: String, 
    enum: ['Available', 'Busy', 'Unavailable'],
    default: 'Available'
  },
  responseTime: String,
  specializations: [String],
  yearsOfExperience: Number,
  companyLink: String,
  certificates: [String],
  activeStatus: { type: Boolean, default: true },
  sessionCount: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 }, // in minutes
  
  // ✅ AI Mentor Matchmaker Security & Verification Fields
  isApproved: { type: Boolean, default: false },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  linkedinProfile: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mentor', mentorSchema);