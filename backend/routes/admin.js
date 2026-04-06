const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const DriveEvent = require('../models/DriveEvent');
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
    
    // Application stats
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const shortlisted = await Application.countDocuments({ status: 'shortlisted' });
    
    // Unique selected students count
    const uniqueSelectedStudents = await Application.distinct('studentId', { 
      status: 'selected',
      studentId: { $ne: null }
    });
    const selected = uniqueSelectedStudents.length;
    
    // Other admin metrics
    const pendingApprovals = await User.countDocuments({ 
      role: 'recruiter', 
      isApproved: false 
    });
    const pendingJobs = await Job.countDocuments({ isApproved: false });
    const upcomingDrives = await DriveEvent.countDocuments({ eventDate: { $gte: new Date() }, status: 'upcoming' });

    res.json({
      totalStudents,
      totalRecruiters,
      totalJobs,
      activeJobs,
      availableJobs: activeJobs, // Added for frontend compatibility
      totalApplications,
      pendingApplications,     // Added for frontend compatibility
      shortlisted,             // Added for frontend compatibility
      selected,                // Added for frontend compatibility
      pendingApprovals,
      pendingJobs,
      upcomingDrives
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

// Get applications for a specific job
router.get('/jobs/:jobId/applications', async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('studentId', 'name email studentProfile')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications for job', error: error.message });
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

// GET /api/admin/analytics/placements — full placement analytics
router.get('/analytics/placements', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });

    // All selected (placed) applications with full info
    const placedApplications = await Application.find({ status: 'selected' })
      .populate('studentId', 'name email studentProfile')
      .populate('jobId', 'title company salary jobType');

    // Calculate unique student placements
    const uniquePlacedStudentIds = [...new Set(placedApplications
      .filter(app => app.studentId)
      .map(app => app.studentId._id.toString())
    )];
    const totalUniquePlacements = uniquePlacedStudentIds.length;
    
    // totalPlacements for backward compatibility with frontend, but representing unique count
    const totalPlacements = totalUniquePlacements; 

    const placementRate = totalStudents > 0
      ? parseFloat(((totalPlacements / totalStudents) * 100).toFixed(1))
      : 0;

    // Average package (salary midpoint in LPA, assuming INR)
    let totalSalary = 0;
    let salaryCount = 0;
    const salaryBuckets = { '0–5 LPA': 0, '5–10 LPA': 0, '10–20 LPA': 0, '20+ LPA': 0 };

    placedApplications.forEach(app => {
      const min = app.jobId?.salary?.min || 0;
      const max = app.jobId?.salary?.max || 0;
      if (min || max) {
        const mid = (min + max) / 2;
        totalSalary += mid;
        salaryCount++;
        const lpa = mid / 100000;
        if (lpa < 500000 / 100000) {
          if (lpa < 5) salaryBuckets['0–5 LPA']++;
          else if (lpa < 10) salaryBuckets['5–10 LPA']++;
          else if (lpa < 20) salaryBuckets['10–20 LPA']++;
          else salaryBuckets['20+ LPA']++;
        } else {
          // mid is raw INR
          const lpaVal = mid / 100000;
          if (lpaVal < 5) salaryBuckets['0–5 LPA']++;
          else if (lpaVal < 10) salaryBuckets['5–10 LPA']++;
          else if (lpaVal < 20) salaryBuckets['10–20 LPA']++;
          else salaryBuckets['20+ LPA']++;
        }
      }
    });

    const avgPackage = salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0;

    // Application funnel
    const [pending, shortlisted, interview, selected, rejected] = await Promise.all([
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'shortlisted' }),
      Application.countDocuments({ status: 'interview' }),
      Application.countDocuments({ status: 'selected' }),
      Application.countDocuments({ status: 'rejected' }),
    ]);

    const applicationFunnel = [
      { stage: 'Applied', count: pending + shortlisted + interview + selected + rejected },
      { stage: 'Shortlisted', count: shortlisted + interview + selected },
      { stage: 'Interview', count: interview + selected },
      { stage: 'Selected', count: selected },
    ];

    const statusBreakdown = [
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Shortlisted', value: shortlisted, color: '#3b82f6' },
      { name: 'Interview', value: interview, color: '#8b5cf6' },
      { name: 'Selected', value: selected, color: '#10b981' },
      { name: 'Rejected', value: rejected, color: '#ef4444' },
    ];

    // Company-wise placements (top 10)
    const companyMap = {};
    placedApplications.forEach(app => {
      const company = app.jobId?.company || 'Unknown';
      companyMap[company] = (companyMap[company] || 0) + 1;
    });
    const companyWise = Object.entries(companyMap)
      .map(([company, count]) => ({ company, placements: count }))
      .sort((a, b) => b.placements - a.placements)
      .slice(0, 10);

    const uniqueCompanies = Object.keys(companyMap).length;

    // Department-wise placements
    const deptMap = {};
    placedApplications.forEach(app => {
      const dept = app.studentId?.studentProfile?.department || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentWise = Object.entries(deptMap)
      .map(([department, count]) => ({ department, placements: count }))
      .sort((a, b) => b.placements - a.placements);

    // Monthly trend (last 12 months)
    const now = new Date();
    const monthlyMap = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap[key] = 0;
    }
    placedApplications.forEach(app => {
      const d = new Date(app.updatedAt);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyMap.hasOwnProperty(key)) {
        monthlyMap[key]++;
      }
    });
    const monthlyTrend = Object.entries(monthlyMap).map(([month, placements]) => ({
      month,
      placements,
    }));

    // Salary distribution
    const salaryDistribution = Object.entries(salaryBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    // Job type breakdown
    const jobTypeMap = {};
    placedApplications.forEach(app => {
      const type = app.jobId?.jobType || 'Unknown';
      jobTypeMap[type] = (jobTypeMap[type] || 0) + 1;
    });
    const jobTypeBreakdown = Object.entries(jobTypeMap).map(([type, count]) => ({
      type,
      count,
    }));

    res.json({
      summary: {
        totalStudents,
        totalPlacements,
        placementRate,
        uniqueCompanies,
        avgPackage,
      },
      applicationFunnel,
      statusBreakdown,
      companyWise,
      departmentWise,
      monthlyTrend,
      salaryDistribution,
      jobTypeBreakdown,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// ==========================================
// MENTOR APPROVAL ROUTES (ALUMNI VERIFICATION)
// ==========================================

// Get pending mentors
router.get('/mentors/pending', async (req, res) => {
  try {
    const Mentor = require('../models/Mentor');
    const pendingMentors = await Mentor.find({ approvalStatus: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(pendingMentors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending mentors', error: error.message });
  }
});

// Approve mentor
router.put('/mentors/:id/approve', async (req, res) => {
  try {
    const Mentor = require('../models/Mentor');
    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvalStatus: 'approved' },
      { new: true }
    );
    res.json({ message: 'Mentor approved', mentor });
  } catch (error) {
    res.status(500).json({ message: 'Error approving mentor', error: error.message });
  }
});

// Reject mentor
router.put('/mentors/:id/reject', async (req, res) => {
  try {
    const Mentor = require('../models/Mentor');
    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, approvalStatus: 'rejected' },
      { new: true }
    );
    res.json({ message: 'Mentor rejected', mentor });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting mentor', error: error.message });
  }
});

module.exports = router;