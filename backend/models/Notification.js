const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['drive', 'reminder', 'interview', 'deadline', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  link: {
    type: String,
    default: '/student/calendar'
  },
  relatedEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriveEvent',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
