


const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const DriveEvent = require('../models/DriveEvent');

const checkEligibility = (job, profile) => {
  if (!job.eligibility || !profile) return true;
  const edu = profile.education || {};
  const e = job.eligibility;
  if (e.minCGPA && (edu.cgpa || 0) < e.minCGPA) return false;
  if (e.tenthPercent && (edu.tenthPercent || 0) < e.tenthPercent) return false;
  if (e.twelfthPercent && (edu.twelfthPercent || 0) < e.twelfthPercent) return false;
  if (e.maxActiveBacklogs !== undefined && e.maxActiveBacklogs !== null && (edu.activeBacklogs || 0) > e.maxActiveBacklogs) return false;
  return true;
};
const { auth, checkRole, checkApproved } = require('../middleware/auth');

// All student routes require authentication and student role
router.use(auth, checkRole('student'));

// Get available jobs
router.get('/jobs', checkApproved, async (req, res) => {
  try {
    const { search, location, jobType, minSalary } = req.query;
    const filter = { status: 'active', isApproved: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };

    const jobs = await Job.find(filter)
      .populate('recruiterId', 'name recruiterProfile')
      .sort({ createdAt: -1 });

    const studentProfile = await StudentProfile.findOne({ userId: req.userId });
    
    const jobsWithElig = jobs.map(j => {
      const jobObj = j.toObject();
      jobObj.isEligible = checkEligibility(j, studentProfile);
      return jobObj;
    });

    res.json(jobsWithElig);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get job details
router.get('/jobs/:jobId', checkApproved, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('recruiterId', 'name email recruiterProfile');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: req.params.jobId,
      studentId: req.userId
    });

    const studentProfile = await StudentProfile.findOne({ userId: req.userId });
    const jobObj = job.toObject();
    jobObj.isEligible = checkEligibility(job, studentProfile);

    res.json({ job: jobObj, hasApplied: !!existingApplication });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Apply for job
router.post('/jobs/:jobId/apply', checkApproved, async (req, res) => {
  try {
    const { coverLetter, resume } = req.body;

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: req.params.jobId,
      studentId: req.userId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Check if job exists and is active
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== 'active') {
      return res.status(400).json({ message: 'Job not available' });
    }

    const studentProfile = await StudentProfile.findOne({ userId: req.userId });
    if (!checkEligibility(job, studentProfile)) {
      return res.status(403).json({ message: 'You do not meet the eligibility criteria for this job' });
    }

    // Create application
    const application = new Application({
      jobId: req.params.jobId,
      studentId: req.userId,
      coverLetter,
      resume
    });

    await application.save();

    // Update job applications count
    job.applicationsCount += 1;
    await job.save();

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
});

// Get my applications
router.get('/applications', checkApproved, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { studentId: req.userId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('jobId', 'title company location salary jobType')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get application details
router.get('/applications/:applicationId', checkApproved, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.applicationId,
      studentId: req.userId
    })
      .populate('jobId')
      .populate('studentId', 'name email studentProfile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

// Withdraw application
router.delete('/applications/:applicationId', checkApproved, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.applicationId,
      studentId: req.userId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw processed application' });
    }

    await Application.findByIdAndDelete(req.params.applicationId);

    // Update job applications count
    await Job.findByIdAndUpdate(application.jobId, {
      $inc: { applicationsCount: -1 }
    });

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error withdrawing application', error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', checkApproved, async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments({ studentId: req.userId });
    const pendingApplications = await Application.countDocuments({ 
      studentId: req.userId, 
      status: 'pending' 
    });
    const shortlisted = await Application.countDocuments({ 
      studentId: req.userId, 
      status: 'shortlisted' 
    });
    const selected = await Application.countDocuments({ 
      studentId: req.userId, 
      status: 'selected' 
    });
    const availableJobs = await Job.countDocuments({ status: 'active', isApproved: true });
    const upcomingDrives = await DriveEvent.countDocuments({ eventDate: { $gte: new Date() }, status: 'upcoming' });

    res.json({
      totalApplications,
      pendingApplications,
      shortlisted,
      selected,
      availableJobs,
      upcomingDrives
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;