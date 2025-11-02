// ============================================
// FINAL: backend/server.js (Corrected)
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Environment validation
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  WARNING: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'mock (default)'}`);

// ✅ MongoDB Connection with better error handling
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_campus_recruitment';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.error('   Retrying in 5 seconds...');
  
  // Retry connection after 5 seconds
  setTimeout(() => {
    mongoose.connect(mongoUri);
  }, 5000);
});

// ✅ Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// ✅ Routes (IMPORT BEFORE USING)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const recruiterRoutes = require('./routes/recruiter');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/Interview');
const resumeRoutes = require('./routes/resume');
const aiChatRoutes = require('./routes/aiChat');
const resumeParserRoutes = require('./routes/resumeParser');

// ✅ Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/resume-parser', resumeParserRoutes);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler (before error middleware)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ✅ Error handling middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Multer error handling
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size: 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   - Health: GET http://localhost:${PORT}/health`);
  console.log(`   - AI Chat: /api/ai-chat/*`);
  console.log(`   - Resume Parser: /api/resume-parser/*`);
});