const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');
const MentorMessage = require('../models/MentorMessage');
const Mentor = require('../models/Mentor');
const User = require('../models/User');


// ===============================
// GET: Get all chat messages between mentor & student
// ===============================
router.get('/chat/:mentorId', auth, async (req, res) => {
  try {
    const mentorId = req.params.mentorId;

    // Verify mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Fetch all messages between this student and mentor
    const messages = await MentorMessage.find({
      mentorId,
      studentId: req.user.id
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ===============================
// POST: Student sends a message to mentor
// ===============================
router.post('/send', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const { mentorId, content } = req.body;
    if (!mentorId || !content) {
      return res.status(400).json({ message: 'Mentor ID and content are required' });
    }

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const message = new MentorMessage({
      mentorId,
      studentId: req.user.id,
      sender: 'student',
      content,
      createdAt: new Date()
    });

    await message.save();
    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ===============================
// POST: Mentor responds to a student’s message
// ===============================
router.post('/mentor-response', auth, checkRole('mentor'), checkApproved, async (req, res) => {
  try {
    const { studentId, mentorId, content } = req.body;

    if (!studentId || !mentorId || !content) {
      return res.status(400).json({ message: 'Student ID, mentor ID, and content are required' });
    }

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const message = new MentorMessage({
      mentorId,
      studentId,
      sender: 'mentor',
      content,
      isAnsweredDoubt: true,
      createdAt: new Date()
    });

    await message.save();
    res.status(201).json({ message: 'Response sent successfully', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ===============================
// PUT: Mark message as helpful (students or mentors can mark)
// ===============================
router.put('/mark-helpful/:messageId', auth, async (req, res) => {
  try {
    const message = await MentorMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.helpfulCount = (message.helpfulCount || 0) + 1;
    await message.save();

    res.status(200).json({ message: 'Marked as helpful', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
