const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Information
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    linkedin: String,
    github: String,
    portfolio: String,
    professionalSummary: String
  },

  // Education
  education: [{
    degree: String,
    institution: String,
    location: String,
    startDate: Date,
    endDate: Date,
    cgpa: Number,
    maxCgpa: Number,
    percentage: Number,
    major: String,
    achievements: [String]
  }],

  // Work Experience
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    responsibilities: [String],
    achievements: [String]
  }],

  // Projects
  projects: [{
    title: String,
    description: String,
    technologies: [String],
    role: String,
    startDate: Date,
    endDate: Date,
    url: String,
    github: String,
    highlights: [String]
  }],

  // Skills
  skills: {
    technical: [String],
    soft: [String],
    languages: [{
      name: String,
      proficiency: String // Beginner, Intermediate, Advanced, Native
    }],
    tools: [String],
    frameworks: [String]
  },

  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    url: String
  }],

  // Achievements & Awards
  achievements: [{
    title: String,
    description: String,
    date: Date,
    issuer: String
  }],

  // Publications
  publications: [{
    title: String,
    authors: [String],
    publishedIn: String,
    date: Date,
    url: String,
    description: String
  }],

  // Volunteer Work
  volunteer: [{
    organization: String,
    role: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],

  // Resume Metadata
  template: {
    type: String,
    enum: ['professional', 'modern', 'creative', 'minimal', 'executive'],
    default: 'professional'
  },
  
  theme: {
    primaryColor: {
      type: String,
      default: '#667eea'
    },
    fontSize: {
      type: String,
      default: 'medium'
    }
  },

  // AI Analysis
  aiAnalysis: {
    atsScore: Number, // 0-100
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    keywordMatches: [{
      keyword: String,
      present: Boolean,
      importance: String // high, medium, low
    }],
    overallRating: String, // excellent, good, average, needs-improvement
    lastAnalyzed: Date
  },

  // Parsing Information (when uploaded)
  parsed: {
    originalFileName: String,
    uploadedAt: Date,
    fileUrl: String,
    parsedSuccessfully: Boolean,
    parsingErrors: [String]
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },

  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    versionNumber: Number,
    savedAt: Date,
    data: Object
  }]

}, { timestamps: true });

// Index for faster queries
resumeSchema.index({ userId: 1, isActive: 1 });

// Method to calculate completeness percentage
resumeSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const weights = {
    personalInfo: 15,
    education: 20,
    experience: 25,
    skills: 15,
    projects: 15,
    certifications: 5,
    achievements: 5
  };

  if (this.personalInfo?.firstName && this.personalInfo?.email) score += weights.personalInfo;
  if (this.education?.length > 0) score += weights.education;
  if (this.experience?.length > 0) score += weights.experience;
  if (this.skills?.technical?.length > 0) score += weights.skills;
  if (this.projects?.length > 0) score += weights.projects;
  if (this.certifications?.length > 0) score += weights.certifications;
  if (this.achievements?.length > 0) score += weights.achievements;

  return score;
};

module.exports = mongoose.model('Resume', resumeSchema);