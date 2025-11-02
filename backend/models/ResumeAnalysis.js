// backend/models/ResumeAnalysis.js
const mongoose = require("mongoose");

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    resumeText: {
      type: String,
      required: true,
    },
    parsedData: {
      personalInfo: {
        name: String,
        email: String,
        phone: String,
        location: String,
        summary: String,
      },
      skills: {
        technical: [String],
        soft: [String],
        languages: [String],
        tools: [String],
      },
      experience: [
        {
          jobTitle: String,
          company: String,
          duration: String,
          description: String,
          skills_used: [String],
        },
      ],
      education: [
        {
          degree: String,
          institution: String,
          field: String,
          graduationYear: String,
          grade: String,
        },
      ],
      certifications: [
        {
          name: String,
          issuer: String,
          date: String,
          credentialId: String,
        },
      ],
      projects: [
        {
          title: String,
          description: String,
          technologies: [String],
          link: String,
        },
      ],
      analysis: {
        strengths: [String],
        weaknesses: [String],
        suggestions: [String],
        careerPath: String,
        industryFit: String,
        experienceLevel: String,
        overall_score: Number,
      },
      keywords: {
        ats_friendly_keywords: [String],
        missing_keywords: [String],
        ats_score: Number,
      },
    },
    recommendations: {
      resumeImprovements: [
        {
          section: String,
          currentIssue: String,
          recommendation: String,
          priority: String,
          example: String,
        },
      ],
      skillGaps: [
        {
          skill: String,
          importance: String,
          learningPath: String,
          estimatedTime: String,
        },
      ],
      certifications: [
        {
          name: String,
          provider: String,
          benefit: String,
          link: String,
        },
      ],
      jobTargets: [
        {
          jobTitle: String,
          matchScore: Number,
          why: String,
          preparation: String,
        },
      ],
    },
    jobComparisons: [
      {
        jobDescription: String,
        comparisonResult: {
          overallMatchScore: Number,
          matchBreakdown: {
            skillsMatch: {
              score: Number,
              matchedSkills: [String],
              missingSkills: [String],
            },
            experienceMatch: {
              score: Number,
              analysis: String,
            },
            educationMatch: {
              score: Number,
              analysis: String,
            },
          },
          readiness: String,
          recommendations: [String],
        },
        comparedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);