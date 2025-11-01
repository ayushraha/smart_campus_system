

const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Public route - Get all active jobs (no auth required)
router.get('/', async (req, res) => {
  try {
    const { search, location, jobType, company } = req.query;
    const filter = { status: 'active', isApproved: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (company) filter.company = { $regex: company, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('recruiterId', 'recruiterProfile.companyName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Public route - Get job by ID
router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      status: 'active',
      isApproved: true
    }).populate('recruiterId', 'name recruiterProfile');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

module.exports = router;