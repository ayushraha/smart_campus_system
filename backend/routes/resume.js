const express = require('express');
const router = express.Router();
const multer = require('multer');
const Resume = require('../models/Resume');
const { auth } = require('../middleware/auth');
const { analyzeResume } = require('../services/aiService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Create new resume
router.post('/', auth, async (req, res) => {
  try {
    const resume = new Resume({
      userId: req.userId,
      ...req.body
    });

    await resume.save();
    res.status(201).json({ message: 'Resume created successfully', resume });
  } catch (error) {
    res.status(500).json({ message: 'Error creating resume', error: error.message });
  }
});

// Get all resumes for user
router.get('/my-resumes', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId, isActive: true })
      .sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resumes', error: error.message });
  }
});

// Get resume by ID
router.get('/:resumeId', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume', error: error.message });
  }
});

// Update resume
router.put('/:resumeId', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Save current version before updating
    resume.previousVersions.push({
      versionNumber: resume.version,
      savedAt: new Date(),
      data: resume.toObject()
    });

    // Update resume
    Object.assign(resume, req.body);
    resume.version += 1;

    await resume.save();
    res.json({ message: 'Resume updated successfully', resume });
  } catch (error) {
    res.status(500).json({ message: 'Error updating resume', error: error.message });
  }
});

// Delete resume
router.delete('/:resumeId', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.resumeId, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resume', error: error.message });
  }
});

// Upload and Parse Resume
router.post('/upload-parse', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse the uploaded file
    const parsedData = await parseResumeFile(req.file);

    const resume = new Resume({
      userId: req.userId,
      ...parsedData,
      parsed: {
        originalFileName: req.file.originalname,
        uploadedAt: new Date(),
        parsedSuccessfully: true
      }
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume uploaded and parsed successfully',
      resume,
      completeness: resume.calculateCompleteness()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error parsing resume', error: error.message });
  }
});

// AI-Powered Resume Analysis - REAL AI INTEGRATION
router.post('/:resumeId/analyze', auth, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Use REAL AI Service from aiService.js
    console.log('🤖 Analyzing resume with AI...');
    const analysis = await analyzeResume(resume, jobDescription);

    resume.aiAnalysis = {
      ...analysis,
      lastAnalyzed: new Date()
    };

    await resume.save();

    res.json({
      message: 'Analysis completed',
      analysis: resume.aiAnalysis,
      completeness: resume.calculateCompleteness(),
      usingRealAI: process.env.AI_PROVIDER !== 'mock'
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: 'Error analyzing resume', error: error.message });
  }
});

// Get AI Suggestions for Improvement
router.post('/:resumeId/suggestions', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const suggestions = generateAISuggestions(resume);

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Error generating suggestions', error: error.message });
  }
});

// ATS Score Check - REAL AI INTEGRATION
router.post('/:resumeId/ats-score', auth, async (req, res) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('🎯 Calculating ATS score with AI...');
    const analysis = await analyzeResume(resume, jobDescription);
    
    const atsAnalysis = {
      score: analysis.atsScore,
      matchedKeywords: analysis.keywordMatches?.filter(k => k.present).map(k => k.keyword) || [],
      missedKeywords: analysis.keywordMatches?.filter(k => !k.present).map(k => k.keyword) || [],
      recommendations: analysis.suggestions || [],
      breakdown: {
        keywordMatch: Math.round(analysis.atsScore * 0.6),
        titleRelevance: Math.round(analysis.atsScore * 0.2),
        formatting: Math.round(analysis.atsScore * 0.2)
      },
      usingRealAI: process.env.AI_PROVIDER !== 'mock'
    };

    res.json(atsAnalysis);
  } catch (error) {
    console.error('ATS score calculation error:', error);
    res.status(500).json({ message: 'Error calculating ATS score', error: error.message });
  }
});

// Get resume completeness
router.get('/:resumeId/completeness', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const completeness = resume.calculateCompleteness();
    const missing = [];

    if (!resume.personalInfo?.firstName) missing.push('Personal Information');
    if (!resume.education || resume.education.length === 0) missing.push('Education');
    if (!resume.experience || resume.experience.length === 0) missing.push('Work Experience');
    if (!resume.skills?.technical || resume.skills.technical.length === 0) missing.push('Skills');
    if (!resume.projects || resume.projects.length === 0) missing.push('Projects');

    res.json({
      completeness,
      missing,
      sections: {
        personalInfo: !!resume.personalInfo?.firstName,
        education: resume.education?.length > 0,
        experience: resume.experience?.length > 0,
        skills: resume.skills?.technical?.length > 0,
        projects: resume.projects?.length > 0,
        certifications: resume.certifications?.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking completeness', error: error.message });
  }
});

// ===== Helper Functions =====

async function parseResumeFile(file) {
  // Mock parser - In production, use libraries like:
  // - pdf-parse for PDF files
  // - mammoth for DOCX files
  // - Or AI services like OpenAI Document Intelligence
  
  return {
    personalInfo: {
      firstName: 'Parsed',
      lastName: 'User',
      email: 'parsed@example.com',
      phone: '1234567890'
    },
    education: [{
      degree: 'Bachelor of Technology',
      institution: 'Parsed University',
      fieldOfStudy: 'Computer Science',
      startDate: '2018',
      endDate: '2022',
      cgpa: 8.5
    }],
    skills: {
      technical: ['JavaScript', 'Python', 'React', 'Node.js'],
      soft: ['Communication', 'Leadership', 'Problem Solving']
    },
    experience: [],
    projects: []
  };
}

function generateAISuggestions(resume) {
  const suggestions = [];

  if (!resume.personalInfo?.professionalSummary) {
    suggestions.push({
      section: 'Professional Summary',
      type: 'missing',
      suggestion: 'Add a compelling professional summary highlighting your key skills and achievements',
      priority: 'high',
      example: 'Results-driven software engineer with 3+ years of experience in full-stack development...'
    });
  }

  if (!resume.projects || resume.projects.length < 2) {
    suggestions.push({
      section: 'Projects',
      type: 'incomplete',
      suggestion: 'Add at least 2-3 significant projects to showcase your practical skills',
      priority: 'high'
    });
  }

  if (!resume.certifications || resume.certifications.length === 0) {
    suggestions.push({
      section: 'Certifications',
      type: 'missing',
      suggestion: 'Add relevant certifications to boost credibility',
      priority: 'medium'
    });
  }

  if (!resume.experience || resume.experience.length === 0) {
    suggestions.push({
      section: 'Experience',
      type: 'missing',
      suggestion: 'Add internships, part-time work, or volunteer experience',
      priority: 'high'
    });
  }

  suggestions.push({
    section: 'General',
    type: 'improvement',
    suggestion: 'Use action verbs like "developed", "implemented", "led" to start bullet points',
    priority: 'medium'
  });

  suggestions.push({
    section: 'General',
    type: 'improvement',
    suggestion: 'Quantify achievements with numbers and metrics (e.g., "Improved performance by 40%")',
    priority: 'high'
  });

  return suggestions;
}

module.exports = router;