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

// Get my interviews — MUST come before /:interviewId (static before dynamic)
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

// Get interview by room ID — MUST come before /:interviewId (static before dynamic)
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

// Get interview details by ID (dynamic — must be after all static GET routes)
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('studentId', 'name email studentProfile')
      .populate('recruiterId', 'name email recruiterProfile')
      .populate('jobId', 'title company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

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

// Start interview
router.put('/:interviewId/start', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    interview.status = 'in-progress';
    interview.recording = { ...interview.recording, startTime: new Date() };
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

// End interview — preserves real live feedback scores, only fills text if nothing saved yet
router.put('/:interviewId/end', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    interview.status = 'completed';
    interview.recording = { ...interview.recording, endTime: new Date() };

    const lastParticipant = interview.participantsJoined[interview.participantsJoined.length - 1];
    if (lastParticipant) lastParticipant.leftAt = new Date();

    // Only fill in default text summaries if analysis hasn't been set by recruiter
    const a = interview.analysis || {};
    const hasRealScores = a.overallScore !== undefined && a.overallScore !== null;

    if (!hasRealScores) {
      // No live feedback was given — leave analysis empty so recruiter can fill post-interview
      interview.analysis = {
        overallScore: null,
        communicationScore: null,
        technicalScore: null,
        confidenceScore: null,
        aiSummary: '',
        detailedFeedback: '',
        strengths: [],
        weaknesses: [],
        recommendations: []
      };
    } else {
      // Real scores exist — just ensure text fields have defaults if missing
      if (!a.aiSummary) {
        interview.analysis.aiSummary = `Interview completed. Overall score: ${a.overallScore}/100.`;
      }
    }

    await interview.save();
    res.json({ message: 'Interview ended', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error ending interview', error: error.message });
  }
});

// LIVE FEEDBACK — Recruiter saves scores & notes during the interview
router.put('/:interviewId/live-feedback', auth, checkRole('recruiter'), async (req, res) => {
  try {
    const { technicalScore, communicationScore, confidenceScore, notes, strengths, weaknesses } = req.body;

    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Compute overall as average of provided scores
    const scores = [technicalScore, communicationScore, confidenceScore].filter(s => s !== undefined && s !== null);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : (interview.analysis?.overallScore || null);

    const aObj = interview.analysis && typeof interview.analysis.toObject === 'function' ? interview.analysis.toObject() : (interview.analysis || {});

    interview.analysis = {
      ...aObj,
      overallScore,
      technicalScore: technicalScore !== undefined ? technicalScore : aObj.technicalScore,
      communicationScore: communicationScore !== undefined ? communicationScore : aObj.communicationScore,
      confidenceScore: confidenceScore !== undefined ? confidenceScore : aObj.confidenceScore,
      strengths: strengths || aObj.strengths || [],
      weaknesses: weaknesses || aObj.weaknesses || []
    };

    if (notes) interview.recruiterNotes = notes;

    await interview.save();
    res.json({ message: 'Live feedback saved', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error saving live feedback', error: error.message });
  }
});

// Submit interview analysis
router.post('/:interviewId/analysis', auth, checkRole('recruiter', 'admin'), async (req, res) => {
  try {
    const { analysis } = req.body;
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

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
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    interview.questionsAsked.push({ question, askedAt: new Date(), category });
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
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    interview.responses.push({ questionId, response, duration, timestamp: new Date(), sentiment, score });
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
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
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
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    await Application.findByIdAndUpdate(interview.applicationId, {
      status: result === 'selected' ? 'selected' : result === 'rejected' ? 'rejected' : 'interview',
      feedback: finalFeedback
    });

    res.json({ message: 'Decision submitted', interview });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting decision', error: error.message });
  }
});

// NOTE: /my/interviews route has been moved above /:interviewId — see line ~53

// Generate descriptive AI analysis based on REAL stored scores
router.post('/:interviewId/generate-analysis', auth, checkRole('recruiter', 'admin'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const a = interview.analysis && typeof interview.analysis.toObject === 'function' ? interview.analysis.toObject() : (interview.analysis || {});
    const overall = a.overallScore ?? 0;
    const comm = a.communicationScore ?? 0;
    const tech = a.technicalScore ?? 0;
    const conf = a.confidenceScore ?? 0;

    // Derive text feedback from real scores
    const quality = overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 55 ? 'average' : 'poor';
    const commFeedback = comm >= 80 ? 'Communicated clearly and confidently.' : comm >= 60 ? 'Communication was adequate with minor gaps.' : 'Communication needs improvement.';
    const techFeedback = tech >= 80 ? 'Demonstrated strong technical knowledge.' : tech >= 60 ? 'Showed basic technical understanding.' : 'Technical responses lacked depth.';
    const confFeedback = conf >= 80 ? 'Presented ideas with confidence.' : conf >= 60 ? 'Moderate confidence — some hesitation noted.' : 'Appeared nervous during responses.';

    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (tech >= 75) strengths.push('Good technical knowledge');
    else weaknesses.push('Technical skills need further development');

    if (comm >= 75) strengths.push('Clear and professional communication');
    else weaknesses.push('Communication could be more structured');

    if (conf >= 75) strengths.push('Confident and assertive responses');
    else weaknesses.push('Work on confidence and clarity under pressure');

    if (interview.questionsAsked?.length > 0) strengths.push(`Engaged with ${interview.questionsAsked.length} questions`);

    recommendations.push('Practice the STAR method for behavioral questions');
    if (tech < 75) recommendations.push('Review core technical concepts for the role');
    if (comm < 75) recommendations.push('Work on structuring responses concisely');
    if (conf < 75) recommendations.push('Mock interview practice to build confidence');

    const aiSummary = `The candidate scored ${overall}/100 overall. ${techFeedback} ${commFeedback} ${confFeedback}`;
    const detailedFeedback = `Technical: ${tech}/100 — ${techFeedback} Communication: ${comm}/100 — ${commFeedback} Confidence: ${conf}/100 — ${confFeedback}`;

    const updatedAnalysis = {
      ...a,
      responseQuality: quality,
      strengths: a.strengths?.length ? a.strengths : strengths,
      weaknesses: a.weaknesses?.length ? a.weaknesses : weaknesses,
      recommendations,
      aiSummary,
      detailedFeedback
    };

    interview.analysis = updatedAnalysis;
    await interview.save();

    res.json({ message: 'AI analysis generated', analysis: updatedAnalysis });
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({ message: 'Error generating analysis', error: error.message });
  }
});

module.exports = router;