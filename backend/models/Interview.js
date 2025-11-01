const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'],
    default: 'scheduled'
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  meetingLink: {
    type: String
  },
  roomId: {
    type: String,
    unique: true
  },
  // Interview Recording and Analysis
  recording: {
    url: String,
    duration: Number,
    startTime: Date,
    endTime: Date
  },
  analysis: {
    // Overall Scores (0-100)
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    communicationScore: {
      type: Number,
      min: 0,
      max: 100
    },
    technicalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Detailed Analysis
    sentimentAnalysis: {
      positive: Number,
      neutral: Number,
      negative: Number
    },
    keywordMatches: [String],
    responseQuality: String, // 'excellent', 'good', 'average', 'poor'
    
    // Behavioral Analysis
    eyeContact: {
      score: Number,
      feedback: String
    },
    bodyLanguage: {
      score: Number,
      feedback: String
    },
    speakingPace: {
      score: Number,
      feedback: String
    },
    
    // Response Analysis
    averageResponseTime: Number, // in seconds
    totalSpeakingTime: Number, // in seconds
    fillerWordsCount: Number,
    
    // Strengths and Weaknesses
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    
    // AI Generated Summary
    aiSummary: String,
    detailedFeedback: String
  },
  
  // Questions and Responses
  questionsAsked: [{
    question: String,
    askedAt: Date,
    category: String // 'technical', 'behavioral', 'situational'
  }],
  
  responses: [{
    questionId: mongoose.Schema.Types.ObjectId,
    response: String,
    duration: Number, // in seconds
    timestamp: Date,
    sentiment: String,
    score: Number
  }],
  
  // Interview Notes
  recruiterNotes: {
    type: String
  },
  
  // Technical Details
  participantsJoined: [{
    userId: mongoose.Schema.Types.ObjectId,
    joinedAt: Date,
    leftAt: Date,
    role: String
  }],
  
  // Final Decision
  result: {
    type: String,
    enum: ['selected', 'rejected', 'on-hold', 'pending'],
    default: 'pending'
  },
  finalFeedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { timestamps: true });

// Generate unique room ID
interviewSchema.pre('save', function(next) {
  if (!this.roomId && this.mode === 'online') {
    this.roomId = `interview-${this._id}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);