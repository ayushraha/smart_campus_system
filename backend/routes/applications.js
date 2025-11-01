const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { auth } = require('../middleware/auth');

// Get application by ID (authenticated users only)
router.get('/:applicationId', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('jobId', 'title company location')
      .populate('studentId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view
    if (req.user.role === 'student' && application.studentId._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

module.exports = router;