const mongoose = require('mongoose');

const mentorSessionSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  description: String,
  sessionType: {
    type: String,
    enum: ['interview-prep', 'company-process', 'resume-review', 'general-doubt', 'mock-interview'],
    default: 'general-doubt'
  },
  scheduledDate: Date,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  duration: Number, // in minutes
  rating: { type: Number, min: 1, max: 5 },
  studentReview: String,
  feedbackFromMentor: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('MentorSession', mentorSessionSchema);