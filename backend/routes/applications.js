// backend/routes/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, checkRole, checkApproved, checkCurrentStudent } = require('../middleware/auth');

// GET: application by ID (any authenticated user with permission)
router.get('/:applicationId', auth, checkApproved, async (req, res, next) => {
  if (req.user.role === 'student') return checkCurrentStudent(req, res, next);
  next();
}, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('jobId', 'title company location salary jobType')
      .populate('studentId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Students can only view their own; recruiters/admins can view any
    if (
      req.user.role === 'student' &&
      application.studentId._id.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

module.exports = router;