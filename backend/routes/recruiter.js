const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, checkRole, checkApproved } = require('../middleware/auth');

// All recruiter routes require authentication and recruiter role
router.use(auth, checkRole('recruiter'));

// Get dashboard statistics
router.get('/dashboard/stats', checkApproved, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ recruiterId: req.userId });
    const activeJobs = await Job.countDocuments({ 
      recruiterId: req.userId, 
      status: 'active',
      isApproved: true 
    });
    const pendingJobs = await Job.countDocuments({ 
      recruiterId: req.userId, 
      isApproved: false 
    });
    
    const jobs = await Job.find({ recruiterId: req.userId });
    const jobIds = jobs.map(job => job._id);
    
    const totalApplications = await Application.countDocuments({ 
      jobId: { $in: jobIds } 
    });
    const pendingApplications = await Application.countDocuments({ 
      jobId: { $in: jobIds },
      status: 'pending' 
    });
    const shortlisted = await Application.countDocuments({ 
      jobId: { $in: jobIds },
      status: 'shortlisted' 
    });
    const selected = await Application.countDocuments({ 
      jobId: { $in: jobIds },
      status: 'selected' 
    });

    res.json({
      totalJobs,
      activeJobs,
      pendingJobs,
      totalApplications,
      pendingApplications,
      shortlisted,
      selected
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Create job posting
router.post('/jobs', checkApproved, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      recruiterId: req.userId,
      isApproved: true // Auto-approve for testing (change to false for production)
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({ 
      message: 'Job posted successfully', 
      job 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Get my jobs
router.get('/jobs', checkApproved, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { recruiterId: req.userId };
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get job details
router.get('/jobs/:jobId', checkApproved, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Update job
router.put('/jobs/:jobId', checkApproved, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    Object.assign(job, req.body);
    job.isApproved = false; // Requires re-approval after edit
    await job.save();

    res.json({ message: 'Job updated successfully. Pending admin approval.', job });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
});

// Delete job
router.delete('/jobs/:jobId', checkApproved, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Job.findByIdAndDelete(req.params.jobId);
    await Application.deleteMany({ jobId: req.params.jobId });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

// Close job posting
router.put('/jobs/:jobId/close', checkApproved, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, recruiterId: req.userId },
      { status: 'closed' },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job closed successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Error closing job', error: error.message });
  }
});

// Get applications for a job
router.get('/jobs/:jobId/applications', checkApproved, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const { status } = req.query;
    const filter = { jobId: req.params.jobId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('studentId', 'name email phone studentProfile')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get all applications for recruiter's jobs
router.get('/applications', checkApproved, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.userId });
    const jobIds = jobs.map(job => job._id);

    const { status } = req.query;
    const filter = { jobId: { $in: jobIds } };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('studentId', 'name email phone studentProfile')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get application details
router.get('/applications/:applicationId', checkApproved, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('studentId', 'name email phone studentProfile')
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the job belongs to this recruiter
    const job = await Job.findOne({
      _id: application.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

// Update application status
router.put('/applications/:applicationId/status', checkApproved, async (req, res) => {
  try {
    const { status, feedback, interviewDetails } = req.body;

    const application = await Application.findById(req.params.applicationId)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the job belongs to this recruiter
    const job = await Job.findOne({
      _id: application.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    if (feedback) application.feedback = feedback;
    if (interviewDetails) application.interviewDetails = interviewDetails;

    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Shortlist multiple applications
router.post('/applications/bulk-shortlist', checkApproved, async (req, res) => {
  try {
    const { applicationIds } = req.body;

    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { status: 'shortlisted' }
    );

    res.json({ message: 'Applications shortlisted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error shortlisting applications', error: error.message });
  }
});

// Schedule interview
router.put('/applications/:applicationId/interview', checkApproved, async (req, res) => {
  try {
    const { date, time, mode, location, meetingLink, notes } = req.body;

    const application = await Application.findById(req.params.applicationId)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the job belongs to this recruiter
    const job = await Job.findOne({
      _id: application.jobId,
      recruiterId: req.userId
    });

    if (!job) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = 'interview';
    application.interviewDetails = {
      date,
      time,
      mode,
      location,
      meetingLink,
      notes
    };

    await application.save();

    res.json({ message: 'Interview scheduled successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
});

module.exports = router;