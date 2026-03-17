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
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'link', 'resource'],
    default: 'text'
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyGroupMessage', studyGroupMessageSchema);
