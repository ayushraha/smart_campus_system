// backend/models/StudentProfile.js
const mongoose = require("mongoose");

const StudentProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: String, // Changed from ObjectId to String for flexibility
      required: true,
      unique: true,
    },
    userId: String, // From auth

    // Personal Information
    personalInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      dateOfBirth: Date,
      gender: String,
      profilePhoto: String, // URL
    },

    // Address Information
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // Education Information
    education: {
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      cgpa: Number,
      tenthPercent: Number,
      twelfthPercent: Number,
      activeBacklogs: { type: Number, default: 0 },
    },

    // Skills
    skills: {
      technical: [String],
      soft: [String],
      languages: [String],
      tools: [String],
    },

    // Experience
    workExperience: [
      {
        jobTitle: String,
        company: String,
        duration: String,
        description: String,
        skillsUsed: [String],
      },
    ],

    // Projects
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        link: String,
      },
    ],

    // Certifications
    certifications: [
      {
        name: String,
        issuer: String,
        date: Date,
        credentialId: String,
        credentialLink: String,
      },
    ],

    // Social Links
    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String,
      twitter: String,
    },

    // Career Preferences
    careerPreferences: {
      preferredRoles: [String],
      preferredIndustries: [String],
      willingToRelocate: Boolean,
      workPreference: String, // Remote, On-site, Hybrid
      salaryExpectation: Number,
    },

    // Achievement & Assessment Data
    achievements: {
      resumeParsingScore: Number,
      interviewReadiness: Number,
      portfolioScore: Number,
      personalityType: String,
      skillAssessmentScores: {}, // Dynamic scoring
    },

    // QR Code
    qrCode: {
      code: String, // Unique QR code identifier
      generatedAt: { type: Date, default: Date.now },
      lastAccessedBy: [
        {
          adminId: mongoose.Schema.Types.ObjectId,
          adminName: String,
          accessedAt: Date,
        },
      ],
    },

    // Application Status
    applicationStatus: {
      status: { type: String, enum: ["pending", "reviewed", "approved", "rejected"], default: "pending" },
      reviewedBy: mongoose.Schema.Types.ObjectId,
      reviewedAt: Date,
      comments: String,
    },

    // Profile Completion
    profileCompletion: {
      personalInfo: { type: Boolean, default: false },
      education: { type: Boolean, default: false },
      skills: { type: Boolean, default: false },
      experience: { type: Boolean, default: false },
      projects: { type: Boolean, default: false },
      socialLinks: { type: Boolean, default: false },
    },

    overallProfileCompletion: { type: Number, default: 0 }, // 0-100%
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);