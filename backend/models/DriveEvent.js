const mongoose = require('mongoose');

const driveEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['placement-drive', 'interview', 'deadline', 'info-session', 'workshop', 'ppt'],
    default: 'placement-drive'
  },
  eventDate: {
    type: Date,
    required: true
  },
  applicationDeadline: {
    type: Date
  },
  description: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    default: 'To be announced'
  },
  eligibility: {
    minCGPA: {
      type: Number,
      default: 0
    },
    departments: {
      type: [String],
      default: []
    },
    yearOfStudy: {
      type: [Number],
      default: []
    }
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' }
  },
  maxSlots: {
    type: Number,
    default: 0  // 0 = unlimited
  },
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, { timestamps: true });

// Virtual: registered count
driveEventSchema.virtual('registeredCount').get(function () {
  return this.registeredStudents ? this.registeredStudents.length : 0;
});

driveEventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DriveEvent', driveEventSchema);
