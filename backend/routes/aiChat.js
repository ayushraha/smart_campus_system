// ============================================
// UPDATED: backend/routes/aiChat.js
// ============================================

const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const aiChatService = require('../services/aiChatService');
const { validationResult, body } = require('express-validator');

// ✅ Validation middleware
const validateMessage = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
];

// ✅ 1. POST: Send message to AI
router.post('/send-message', auth, checkRole('student'), validateMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation error:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { message, conversationId, topic } = req.body;
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    console.log('📥 Message received:', message.substring(0, 50) + '...');

    // ✅ Check if Chat model exists
    if (!Chat) {
      return res.status(500).json({ success: false, error: 'Chat model not initialized' });
    }

    // ✅ Get or create conversation
    let chat;
    if (conversationId) {
      chat = await Chat.findOne({ conversationId, studentId });
    }

    if (!chat) {
      const newConversationId = `conv_${studentId}_${Date.now()}`;
      chat = new Chat({
        studentId,
        conversationId: newConversationId,
        topic: topic || 'general',
        title: `Chat - ${new Date().toLocaleDateString()}`
      });
      console.log('✅ Created new conversation:', newConversationId);
    }

    // ✅ Add user message
    chat.messages.push({
      sender: 'user',
      message: message.trim(),
      type: 'text'
    });

    // ✅ Call AI service with proper error handling
    console.log('🤖 Calling AI service...');
    let aiResponse;
    try {
      aiResponse = await aiChatService.generateResponse(message, {
        topic: chat.topic,
        studentId: studentId.toString()
      });

      if (!aiResponse) {
        throw new Error('Empty response from AI service');
      }
    } catch (aiError) {
      console.error('❌ AI Service Error:', aiError.message);
      return res.status(500).json({
        success: false,
        message: 'AI service error',
        error: aiError.message
      });
    }

    console.log('✅ AI response received');

    // ✅ Add AI response to chat
    chat.messages.push({
      sender: 'ai',
      message: aiResponse,
      type: 'text'
    });

    // ✅ Save to database
    await chat.save();
    console.log('💾 Chat saved to database');

    res.json({
      success: true,
      conversationId: chat.conversationId,
      aiResponse: aiResponse,
      messages: chat.messages
    });

  } catch (error) {
    console.error('❌ Error in send-message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
});

// ✅ 2. GET: Get conversation history
router.get('/conversations', auth, checkRole('student'), async (req, res) => {
  try {
    const chats = await Chat.find({ studentId: req.userId })
      .select('conversationId title topic createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, conversations: chats });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching conversations', 
      error: error.message 
    });
  }
});

// ✅ 3. GET: Get specific conversation
router.get('/conversation/:conversationId', auth, checkRole('student'), async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'Conversation ID is required' });
    }

    const chat = await Chat.findOne({
      conversationId: conversationId,
      studentId: req.userId
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('❌ Error fetching conversation:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching conversation', 
      error: error.message 
    });
  }
});

// ✅ 4. DELETE: Delete conversation
router.delete('/conversation/:conversationId', auth, checkRole('student'), async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'Conversation ID is required' });
    }

    const result = await Chat.findOneAndDelete({
      conversationId: conversationId,
      studentId: req.userId
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('❌ Error deleting conversation:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting conversation', 
      error: error.message 
    });
  }
});

// ✅ 5. POST: Generate interview questions
router.post('/generate-questions', auth, checkRole('student'), async (req, res) => {
  try {
    const { jobTitle, skills } = req.body;

    if (!jobTitle || jobTitle.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Job title is required' });
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, error: 'Skills array is required (minimum 1 skill)' });
    }

    console.log('🎯 Generating questions for:', jobTitle);

    const questions = await aiChatService.generateInterviewQuestions(jobTitle, skills);

    res.json({ success: true, questions });
  } catch (error) {
    console.error('❌ Error generating questions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
      error: error.message
    });
  }
});

// ✅ 6. POST: Analyze resume
router.post('/analyze-resume', auth, checkRole('student'), async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Resume text is required' });
    }

    if (resumeText.length > 5000) {
      return res.status(400).json({ success: false, error: 'Resume text too long (max 5000 characters)' });
    }

    console.log('📄 Analyzing resume...');

    const analysis = await aiChatService.analyzeResumeContent(resumeText);

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('❌ Error analyzing resume:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error analyzing resume',
      error: error.message
    });
  }
});

// ✅ 7. POST: Get job matching advice
router.post('/job-matching-advice', auth, checkRole('student'), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    if (jobDescription.length > 3000) {
      return res.status(400).json({ success: false, error: 'Job description too long (max 3000 characters)' });
    }

    const student = await User.findById(req.userId).select('studentProfile name email');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    const advice = await aiChatService.getJobMatchingAdvice(
      student.studentProfile || {}, 
      jobDescription
    );

    res.json({ success: true, advice });
  } catch (error) {
    console.error('❌ Error generating advice:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating advice',
      error: error.message
    });
  }
});

// ✅ 8. GET: Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Chat service is running',
    provider: process.env.AI_PROVIDER || 'mock',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;