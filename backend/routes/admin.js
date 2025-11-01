const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, checkRole } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(auth, checkRole('admin'));

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active', isApproved: true });
    const totalApplications = await Application.countDocuments();
    const pendingApprovals = await User.countDocuments({ 
      role: 'recruiter', 
      isApproved: false 
    });
    const pendingJobs = await Job.countDocuments({ isApproved: false });

    res.json({
      totalStudents,
      totalRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApprovals,
      pendingJobs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, isApproved, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Approve/Reject user
router.put('/users/:userId/approval', async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isApproved },
      { new: true }
    ).select('-password');

    res.json({ message: 'User approval status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating approval', error: error.message });
  }
});

// Activate/Deactivate user
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password');

    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const { status, isApproved, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(filter)
      .populate('recruiterId', 'name email recruiterProfile')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Approve/Reject job
router.put('/jobs/:jobId/approval', async (req, res) => {
  try {
    const { isApproved } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.jobId,
      { isApproved, status: isApproved ? 'active' : 'draft' },
      { new: true }
    );

    res.json({ message: 'Job approval status updated', job });
  } catch (error) {
    res.status(500).json({ message: 'Error updating approval', error: error.message });
  }
});

// Delete job
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.jobId);
    await Application.deleteMany({ jobId: req.params.jobId });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('studentId', 'name email studentProfile')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get placement reports
router.get('/reports/placements', async (req, res) => {
  try {
    const selectedApplications = await Application.find({ status: 'selected' })
      .populate('studentId', 'name email studentProfile')
      .populate('jobId', 'title company salary');
    
    res.json(selectedApplications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
});

module.exports = router;