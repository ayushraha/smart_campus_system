// backend/routes/studentProfile.js
const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { auth, checkRole, checkApproved } = require('../middleware/auth');

// ─── Student Routes ───────────────────────────────────────────────────────────

// POST: Create or update own profile
router.post('/create-profile', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const {
      personalInfo, address, education, skills,
      workExperience, projects, certifications, socialLinks, careerPreferences
    } = req.body;

    if (!personalInfo || !personalInfo.firstName || !personalInfo.email) {
      return res.status(400).json({ success: false, error: 'First name and email are required' });
    }

    let profile = await StudentProfile.findOne({ studentId: req.userId });

    if (profile) {
      // Update existing
      profile.personalInfo      = personalInfo      || profile.personalInfo;
      profile.address           = address           || profile.address;
      profile.education         = education         || profile.education;
      profile.skills            = skills            || profile.skills;
      profile.workExperience    = workExperience    || profile.workExperience;
      profile.projects          = projects          || profile.projects;
      profile.certifications    = certifications    || profile.certifications;
      profile.socialLinks       = socialLinks       || profile.socialLinks;
      profile.careerPreferences = careerPreferences || profile.careerPreferences;
    } else {
      // Create new with QR code
      const qrCodeId = crypto.randomBytes(16).toString('hex');
      profile = new StudentProfile({
        studentId: req.userId,
        userId: req.userId,
        personalInfo, address, education, skills,
        workExperience, projects, certifications, socialLinks, careerPreferences,
        qrCode: { code: qrCodeId, generatedAt: new Date() }
      });
    }

    profile.overallProfileCompletion = calculateProfileCompletion(profile);
    await profile.save();

    const qrCodeImage = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/student-qr/${profile.qrCode.code}`
    );

    res.json({
      success: true,
      profile,
      qrCode: qrCodeImage,
      profileCompletion: profile.overallProfileCompletion,
      message: 'Profile saved successfully'
    });
  } catch (error) {
    console.error('Error in /create-profile:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Failed to save profile' });
  }
});

// GET: Student's own profile
router.get('/my-profile', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ studentId: req.userId });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const qrCodeImage = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/student-qr/${profile.qrCode.code}`
    );

    res.json({ success: true, profile, qrCode: qrCodeImage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Download QR Code
router.get('/download-qr', auth, checkRole('student'), checkApproved, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ studentId: req.userId });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const qrCodeImage = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/student-qr/${profile.qrCode.code}`
    );

    res.json({
      success: true,
      qrCode: qrCodeImage,
      fileName: `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}_ID.png`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET: Scan QR Code
router.get('/scan-qr/:qrCode', auth, checkRole('admin'), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ 'qrCode.code': req.params.qrCode })
      .populate('studentId', 'name email role');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    profile.qrCode.lastAccessedBy.push({
      adminId: req.userId,
      adminName: req.user.name || 'Admin',
      accessedAt: new Date()
    });

    if (profile.qrCode.lastAccessedBy.length > 50) {
      profile.qrCode.lastAccessedBy = profile.qrCode.lastAccessedBy.slice(-50);
    }

    await profile.save();

    res.json({ success: true, profile, accessLog: profile.qrCode.lastAccessedBy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: All student profiles (admin)
router.get('/admin/all-profiles', auth, checkRole('admin'), async (req, res) => {
  try {
    const profiles = await StudentProfile.find()
      .populate('studentId', 'name email')
      .select('personalInfo education skills overallProfileCompletion qrCode applicationStatus')
      .sort({ createdAt: -1 });

    res.json({ success: true, profiles, total: profiles.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Search student profiles (admin)
router.get('/admin/search/:searchTerm', auth, checkRole('admin'), async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm.trim();
    if (!searchTerm) {
      return res.status(400).json({ success: false, error: 'Search term cannot be empty' });
    }

    const regexOptions = { $regex: searchTerm, $options: 'i' };
    
    // For handling spaces in full names: "Aayush Rahangdale" -> /Aayush.*Rahangdale/i
    const flexRegex = new RegExp(searchTerm.split(' ').join('.*'), 'i');

    const profiles = await StudentProfile.find({
      $or: [
        { 'personalInfo.firstName': regexOptions },
        { 'personalInfo.lastName':  regexOptions },
        { 'personalInfo.email':     regexOptions },
        { 'qrCode.code':            regexOptions },
        { 'personalInfo.firstName': flexRegex }, // fallback for flex
        { 'personalInfo.lastName':  flexRegex },
        { 
          $expr: {
             $regexMatch: {
                input: { $concat: ["$personalInfo.firstName", " ", "$personalInfo.lastName"] },
                regex: searchTerm,
                options: "i"
             }
          }
        }
      ]
    }).limit(20);

    res.json({ success: true, profiles, total: profiles.length, searchTerm });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Update application status (admin)
router.post('/admin/update-status/:profileId', auth, checkRole('admin'), async (req, res) => {
  try {
    const { status, comments } = req.body;
    const profile = await StudentProfile.findByIdAndUpdate(
      req.params.profileId,
      {
        applicationStatus: {
          status, comments,
          reviewedBy: req.userId,
          reviewedAt: new Date()
        }
      },
      { new: true }
    );

    res.json({ success: true, profile, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Export students to CSV (admin)
router.get('/admin/export-csv', auth, checkRole('admin'), async (req, res) => {
  try {
    const profiles = await StudentProfile.find();
    let csv = 'First Name,Last Name,Email,Phone,Institution,Degree,Skills,QR Code\n';

    profiles.forEach(profile => {
      const row = [
        profile.personalInfo?.firstName || '',
        profile.personalInfo?.lastName  || '',
        profile.personalInfo?.email     || '',
        profile.personalInfo?.phone     || '',
        profile.education?.institution  || '',
        profile.education?.degree       || '',
        (profile.skills?.technical || []).join(';'),
        profile.qrCode?.code            || ''
      ].map(cell => `"${cell}"`).join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function calculateProfileCompletion(profile) {
  const sections = {
    personalInfo: !!(profile.personalInfo?.firstName && profile.personalInfo?.email),
    education:    !!(profile.education?.institution && profile.education?.degree),
    skills:       (profile.skills?.technical?.length || 0) > 0,
    experience:   (profile.workExperience?.length    || 0) > 0,
    projects:     (profile.projects?.length          || 0) > 0,
    socialLinks:  !!(profile.socialLinks?.linkedin || profile.socialLinks?.github)
  };
  const completed = Object.values(sections).filter(Boolean).length;
  return Math.round((completed / Object.keys(sections).length) * 100);
}

module.exports = router;