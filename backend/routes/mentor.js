const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');

const Mentor = require('../models/Mentor');
const User = require('../models/User');
const MentorSession = require('../models/MentorSession');


// ==========================
// GET: Discover Mentors
// ==========================
router.get('/discover', async (req, res) => {
  try {
    const mentors = await Mentor.find({ activeStatus: true })
      .sort({ rating: -1 })
      .limit(50);

    res.status(200).json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// GET: Mentor Profile
// ==========================
router.get('/profile/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    res.status(200).json(mentor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// POST: Register as Mentor
// Only logged-in users can register as mentors
// ==========================
router.post('/register', auth, checkRole('student', 'mentor'), async (req, res) => {
  try {
    const { company, role, salary, skills, bio } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate mentor profiles
    const existingMentor = await Mentor.findOne({ userId: req.user.id });
    if (existingMentor) {
      return res.status(400).json({ message: 'You are already registered as a mentor' });
    }

    const mentor = new Mentor({
      userId: req.user.id,
      name: user.name,
      company,
      role,
      salary,
      skills,
      bio,
      activeStatus: true
    });

    await mentor.save();
    res.status(201).json({ message: 'Mentor registered successfully', mentor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// POST: Book a Mentor Session
// Only students can book mentor sessions
// ==========================
router.post('/book-session', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const { mentorId, title, description, sessionType, scheduledDate } = req.body;

    if (!mentorId || !title) {
      return res.status(400).json({ message: 'Mentor ID and title are required' });
    }

    const mentorExists = await Mentor.findById(mentorId);
    if (!mentorExists) return res.status(404).json({ message: 'Mentor not found' });

    const session = new MentorSession({
      mentorId,
      studentId: req.user.id,
      title,
      description,
      sessionType,
      scheduledDate,
      status: 'scheduled'
    });

    await session.save();
    res.status(201).json({ message: 'Session booked successfully', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// PUT: Update Mentor Profile
// Only mentors can update their own profile
// ==========================
router.put('/profile/:id', auth, checkRole('mentor'), async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    // Prevent mentors from editing others' profiles
    if (mentor.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(mentor, req.body);
    await mentor.save();

    res.status(200).json({ message: 'Profile updated successfully', mentor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// PUT: Rate a Session
// Only students who attended can rate
// ==========================
router.put('/rate-session/:sessionId', auth, checkRole('student'), async (req, res) => {
  try {
    const { rating, studentReview } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating value (1–5)' });
    }

    const session = await MentorSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You cannot rate this session' });
    }

    session.rating = rating;
    if (studentReview) session.studentReview = studentReview;
    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();
    res.status(200).json({ message: 'Session rated successfully', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================
// GET: View All Sessions of a Mentor
// ==========================
router.get('/sessions/:mentorId', auth, async (req, res) => {
  try {
    const sessions = await MentorSession.find({ mentorId: req.params.mentorId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
