const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'recruiter'],
    required: true
  },
  phone: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Student specific fields
  studentProfile: {
    rollNumber: String,
    department: String,
    year: Number,
    cgpa: Number,
    resume: String,
    skills: [String],
    projects: [{
      title: String,
      description: String,
      link: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: Number,
      percentage: Number
    }]
  },
  // Recruiter specific fields
  recruiterProfile: {
    companyName: String,
    designation: String,
    companyWebsite: String,
    companyDescription: String,
    companyLogo: String,
    verified: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);