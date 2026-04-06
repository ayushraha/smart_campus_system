// backend/models/StudyGroupMessage.js
const mongoose = require('mongoose');

const studyGroupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: function() { return this.type === 'text'; }, // Content is only required for text messages
    trim: true,
    maxlength: 1000
  },
  fileUrl: String,
  fileName: String,
  fileType: String,
  type: {
    type: String,
    enum: ['text', 'link', 'resource', 'file'],
    default: 'text'
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyGroupMessage', studyGroupMessageSchema);
