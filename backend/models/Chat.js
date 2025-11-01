const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    unique: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'suggestion', 'interview_prep', 'resume_advice'],
      default: 'text'
    }
  }],
  topic: {
    type: String,
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: function() {
      return new Date().toLocaleDateString();
    }
  }
}, { timestamps: true });

// Index for faster queries
chatSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);