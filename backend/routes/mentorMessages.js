const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');
const MentorMessage = require('../models/MentorMessage');
const Mentor = require('../models/Mentor');
const User = require('../models/User');


// ===============================
// GET: Student views their chat with a mentor
// ===============================
router.get('/chat/:mentorId', auth, async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    // Fetch all messages between THIS student and the mentor
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
// GET: Mentor views all conversations (grouped by student)
// ===============================
router.get('/inbox/:mentorId', auth, async (req, res) => {
  try {
    const mentorId = req.params.mentorId;

    // Verify the mentor exists and belongs to this user
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    if (mentor.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all messages for this mentor, populated with student info
    const messages = await MentorMessage.find({ mentorId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    // Group by student to build conversation list
    const convMap = {};
    messages.forEach(msg => {
      const sId = msg.studentId?._id?.toString();
      if (!sId) return;
      if (!convMap[sId]) {
        convMap[sId] = {
          studentId:   sId,
          studentName: msg.studentId?.name || 'Unknown Student',
          studentEmail: msg.studentId?.email || '',
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unread: 0
        };
      }
      if (msg.sender === 'student' && !msg.isRead) convMap[sId].unread++;
    });

    res.status(200).json(Object.values(convMap));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ===============================
// GET: Mentor views one student's full conversation
// ===============================
router.get('/thread/:mentorId/:studentId', auth, async (req, res) => {
  try {
    const { mentorId, studentId } = req.params;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    if (mentor.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await MentorMessage.find({ mentorId, studentId })
      .sort({ createdAt: 1 });

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
router.post('/mentor-response', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const { studentId, mentorId, content } = req.body;

    if (!studentId || !mentorId || !content) {
      return res.status(400).json({ message: 'Student ID, mentor ID, and content are required' });
    }

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    if (mentor.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied. You are not this mentor.' });
    }

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
