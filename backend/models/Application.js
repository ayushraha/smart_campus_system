const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String
  },
  resume: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected', 'interview', 'selected'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  interviewDetails: {
    date: Date,
    time: String,
    mode: {
      type: String,
      enum: ['online', 'offline']
    },
    location: String,
    meetingLink: String,
    notes: String
  },
  feedback: {
    type: String
  },
  documents: [{
    name: String,
    url: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);