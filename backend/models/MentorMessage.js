// ================================================================
// backend/models/MentorMessage.js
// Database schema for mentor-student chat messages
// ================================================================

const mongoose = require('mongoose');

const mentorMessageSchema = new mongoose.Schema({
  // References
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true,
    index: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorSession',
    default: null
  },

  // Message Content
  sender: {
    type: String,
    enum: ['mentor', 'student'],
    required: true
  },

  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },

  messageType: {
    type: String,
    enum: ['text', 'resource-link', 'file', 'tip', 'question', 'answer'],
    default: 'text'
  },

  // Optional: Resource/Link Information
  resourceLink: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },

  resourceTitle: {
    type: String,
    default: null,
    maxlength: 500
  },

  // Optional: File attachment
  attachmentUrl: {
    type: String,
    default: null
  },

  attachmentName: {
    type: String,
    default: null
  },

  // Engagement metrics
  isAnsweredDoubt: {
    type: Boolean,
    default: false
  },

  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },

  usersWhoMarkedHelpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Edit/Delete tracking
  isEdited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date,
    default: null
  },

  editHistory: [{
    content: String,
    editedAt: Date
  }],

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
mentorMessageSchema.index({ mentorId: 1, studentId: 1 });
mentorMessageSchema.index({ mentorId: 1, createdAt: -1 });
mentorMessageSchema.index({ studentId: 1, createdAt: -1 });
mentorMessageSchema.index({ sessionId: 1 });

// Virtual: Check if message is read
mentorMessageSchema.virtual('isRead').get(function() {
  return this.readAt !== null;
});

// Method: Mark as read
mentorMessageSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  return this.save();
};

// Method: Edit message
mentorMessageSchema.methods.editMessage = function(newContent) {
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method: Delete message (soft delete)
mentorMessageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[Message deleted]';
  return this.save();
};

// Method: Mark as helpful
mentorMessageSchema.methods.markAsHelpful = function(userId) {
  if (!this.usersWhoMarkedHelpful.includes(userId)) {
    this.usersWhoMarkedHelpful.push(userId);
    this.helpfulCount += 1;
  }
  return this.save();
};

// Static: Get conversation between mentor and student
mentorMessageSchema.statics.getConversation = function(mentorId, studentId) {
  return this.find({
    $or: [
      { mentorId, studentId },
      { mentorId, studentId }
    ],
    isDeleted: false
  }).sort({ createdAt: 1 });
};

// Static: Get unanswered questions
mentorMessageSchema.statics.getUnansweredQuestions = function(mentorId) {
  return this.find({
    mentorId,
    sender: 'student',
    isAnsweredDoubt: false,
    isDeleted: false,
    messageType: { $in: ['question', 'text'] }
  }).sort({ createdAt: -1 });
};

// Middleware: Update updatedAt on save
mentorMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware: Prevent re-saving deleted messages
mentorMessageSchema.pre('save', function(next) {
  if (this.isDeleted && this.deletedAt && !this.isModified('isDeleted') && !this.wasNew) {
    return next(new Error('Cannot modify a deleted message'));
  }
  next();
});

// Export
module.exports = mongoose.model('MentorMessage', mentorMessageSchema);