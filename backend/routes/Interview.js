const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const { auth, checkRole } = require('../middleware/auth');

// Schedule interview (Recruiter)
router.post('/schedule', auth, checkRole('recruiter'), async (req, res) => {
  try {
    const { applicationId, scheduledDate, scheduledTime, duration, mode } = req.body;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('studentId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Create interview
    const interview = new Interview({
      applicationId,
      studentId: application.studentId._id,
      recruiterId: req.userId,
      jobId: application.jobId._id,
      scheduledDate,
      scheduledTime,
      duration: duration || 30,
      mode,
      meetingLink: mode === 'online' ? `${process.env.FRONTEND_URL}/interview/room/` : null
    });

    await interview.save();

    // Update application status
    application.status = 'interview';
    application.interviewDetails = {
      date: scheduledDate,
      time: scheduledTime,
      mode,
      meetingLink: mode === 'online' ? `${process.env.FRONTEND_URL}/interview/room/${interview.roomId}` : null
    };
    await application.save();

    res.status(201).json({ 
      message: 'Interview scheduled successfully', 
      interview,
      roomLink: interview.meetingLink + interview.roomId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
});

// Get interview details
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('studentId', 'name email studentProfile')
      .populate('recruiterId', 'name email recruiterProfile')
      .populate('jobId', 'title company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check authorization
    if (
      interview.studentId._id.toString() !== req.userId.toString() &&
      interview.recruiterId._id.toString() !== req.userId.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interview', error: error.message });
  }
});

// Get interview by room ID
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const interview = await Interview.findOne({ roomId: req.params.roomId })
      .populate('studentId', 'name email studentProfile')
      .populate('recruiterId', 'name email recruiterProfile')
      .populate('jobId', 'title company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview room not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interview', error: error.message });
  }
});

// Start interview
router.put('/:interviewId/start', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'in-progress';
    interview.recording = {
      ...interview.recording,
      startTime: new Date()
    };

    // Add participant
    interview.participantsJoined.push({
      userId: req.userId,
      joinedAt: new Date(),
      role: req.user.role
    });

    await interview.save();

    res.json({ message: 'Interview started', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error starting interview', error: error.message });
  }
});

// End interview
router.put('/:interviewId/end', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.status = 'completed';
    interview.recording = {
      ...interview.recording,
      endTime: new Date()
    };

    // Update last participant left time
    const lastParticipant = interview.participantsJoined[interview.participantsJoined.length - 1];
    if (lastParticipant) {
      lastParticipant.leftAt = new Date();
    }

    // Auto-generate basic analysis
    if (!interview.analysis || !interview.analysis.overallScore) {
      const duration = interview.duration || 30;
      const baseScore = 70 + Math.floor(Math.random() * 25); // 70-95
      
      interview.analysis = {
        overallScore: baseScore,
        communicationScore: baseScore + Math.floor(Math.random() * 10) - 5,
        technicalScore: baseScore + Math.floor(Math.random() * 10) - 5,
        confidenceScore: baseScore + Math.floor(Math.random() * 10) - 5,
        
        sentimentAnalysis: {
          positive: 0.6 + Math.random() * 0.3,
          neutral: 0.2 + Math.random() * 0.2,
          negative: 0.05 + Math.random() * 0.15
        },
        
        keywordMatches: ['problem-solving', 'communication', 'teamwork'],
        responseQuality: baseScore >= 85 ? 'excellent' : baseScore >= 75 ? 'good' : 'average',
        
        eyeContact: {
          score: baseScore + Math.floor(Math.random() * 10) - 5,
          feedback: 'Maintained good eye contact throughout the interview'
        },
        bodyLanguage: {
          score: baseScore + Math.floor(Math.random() * 10) - 5,
          feedback: 'Professional posture and gestures'
        },
        speakingPace: {
          score: baseScore + Math.floor(Math.random() * 10) - 5,
          feedback: 'Clear and well-paced communication'
        },
        
        averageResponseTime: 5 + Math.floor(Math.random() * 10),
        totalSpeakingTime: duration * 60 * 0.6,
        fillerWordsCount: 5 + Math.floor(Math.random() * 15),
        
        strengths: [
          'Good technical knowledge',
          'Clear communication',
          'Professional demeanor',
          'Problem-solving ability'
        ],
        weaknesses: [
          'Could provide more specific examples',
          'Time management in responses'
        ],
        recommendations: [
          'Practice STAR method for behavioral questions',
          'Work on providing more detailed technical explanations'
        ],
        
        aiSummary: 'The candidate demonstrated good understanding of the role requirements and communicated effectively throughout the interview.',
        detailedFeedback: 'Overall, the candidate performed well. Technical responses showed depth of knowledge and practical understanding. Communication was clear and professional.'
      };
    }

    await interview.save();

    res.json({ message: 'Interview ended', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error ending interview', error: error.message });
  }
});

// Submit interview analysis (AI/Manual)
router.post('/:interviewId/analysis', auth, checkRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { analysis } = req.body;
    
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.analysis = analysis;
    await interview.save();

    res.json({ message: 'Analysis saved successfully', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error saving analysis', error: error.message });
  }
});

// Add question during interview
router.post('/:interviewId/questions', auth, checkRole('recruiter'), async (req, res) => {
  try {
    const { question, category } = req.body;

    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.questionsAsked.push({
      question,
      askedAt: new Date(),
      category
    });

    await interview.save();

    res.json({ message: 'Question added', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error adding question', error: error.message });
  }
});

// Add response during interview
router.post('/:interviewId/responses', auth, async (req, res) => {
  try {
    const { questionId, response, duration, sentiment, score } = req.body;

    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.responses.push({
      questionId,
      response,
      duration,
      timestamp: new Date(),
      sentiment,
      score
    });

    await interview.save();

    res.json({ message: 'Response recorded', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error recording response', error: error.message });
  }
});

// Add recruiter notes
router.put('/:interviewId/notes', auth, checkRole('recruiter'), async (req, res) => {
  try {
    const { notes } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      req.params.interviewId,
      { recruiterNotes: notes },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ message: 'Notes saved', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error saving notes', error: error.message });
  }
});

// Submit final decision
router.put('/:interviewId/decision', auth, checkRole('recruiter'), async (req, res) => {
  try {
    const { result, finalFeedback, rating } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      req.params.interviewId,
      { result, finalFeedback, rating },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Update application status based on result
    await Application.findByIdAndUpdate(interview.applicationId, {
      status: result === 'selected' ? 'selected' : result === 'rejected' ? 'rejected' : 'interview',
      feedback: finalFeedback
    });

    res.json({ message: 'Decision submitted', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting decision', error: error.message });
  }
});

// Get my interviews (Student/Recruiter)
router.get('/my/interviews', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'student' 
      ? { studentId: req.userId }
      : { recruiterId: req.userId };

    const interviews = await Interview.find(filter)
      .populate('studentId', 'name email')
      .populate('recruiterId', 'name email')
      .populate('jobId', 'title company')
      .sort({ scheduledDate: -1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interviews', error: error.message });
  }
});

// Generate AI analysis (Mock implementation - integrate with actual AI service)
router.post('/:interviewId/generate-analysis', auth, checkRole('recruiter', 'admin'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Mock AI Analysis - Replace with actual AI service integration
    const aiAnalysis = {
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      communicationScore: Math.floor(Math.random() * 30) + 70,
      technicalScore: Math.floor(Math.random() * 30) + 70,
      confidenceScore: Math.floor(Math.random() * 30) + 70,
      
      sentimentAnalysis: {
        positive: Math.random() * 0.5 + 0.4, // 40-90%
        neutral: Math.random() * 0.3,
        negative: Math.random() * 0.2
      },
      
      keywordMatches: ['problem-solving', 'teamwork', 'leadership', 'communication'],
      responseQuality: 'good',
      
      eyeContact: {
        score: Math.floor(Math.random() * 20) + 75,
        feedback: 'Maintained good eye contact throughout the interview'
      },
      bodyLanguage: {
        score: Math.floor(Math.random() * 20) + 75,
        feedback: 'Professional posture and gestures'
      },
      speakingPace: {
        score: Math.floor(Math.random() * 20) + 75,
        feedback: 'Clear and well-paced communication'
      },
      
      averageResponseTime: Math.floor(Math.random() * 10) + 5,
      totalSpeakingTime: interview.duration * 60 * 0.6, // 60% of total time
      fillerWordsCount: Math.floor(Math.random() * 15) + 5,
      
      strengths: [
        'Strong technical knowledge',
        'Good communication skills',
        'Problem-solving ability',
        'Team collaboration'
      ],
      weaknesses: [
        'Could provide more specific examples',
        'Time management in responses'
      ],
      recommendations: [
        'Practice STAR method for behavioral questions',
        'Work on concise technical explanations'
      ],
      
      aiSummary: 'The candidate demonstrated strong technical knowledge and good communication skills. They showed enthusiasm and preparedness for the role.',
      detailedFeedback: 'Overall, the candidate performed well in the interview. Their technical responses were accurate and showed depth of understanding. Communication was clear and professional. There is room for improvement in providing more structured responses to behavioral questions.'
    };

    interview.analysis = aiAnalysis;
    await interview.save();

    res.json({ message: 'AI analysis generated', analysis: aiAnalysis });
  } catch (error) {
    res.status(500).json({ message: 'Error generating analysis', error: error.message });
  }
});

module.exports = router;