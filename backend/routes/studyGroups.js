// backend/routes/studyGroups.js
const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');
const StudyGroup = require('../models/StudyGroup');
const StudyGroupMessage = require('../models/StudyGroupMessage');
const Application = require('../models/Application');

// All routes require auth + account approved
router.use(auth, checkApproved);

// ─── Helper: check if student is shortlisted in any application ────────────────
const checkShortlisted = async (userId) => {
  const app = await Application.findOne({
    studentId: userId,
    status: { $in: ['shortlisted', 'interview', 'selected'] }
  });
  return !!app;
};

// ─── Middleware: only shortlisted students can interact ───────────────────────
const requireShortlisted = async (req, res, next) => {
  try {
    const eligible = await checkShortlisted(req.userId);
    if (!eligible) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted. Only shortlisted students can create, join, or chat in study groups.',
        reason: 'not_shortlisted'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET all active groups — visible to all authenticated students ─────────────
// (viewing list is open, but joining/chatting requires shortlisted status)
router.get('/', async (req, res) => {
  try {
    const { company, search } = req.query;
    const filter = { isActive: true };

    if (company) filter.company = { $regex: company, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await StudyGroup.find(filter)
      .populate('createdBy', 'name')
      .populate('members', 'name')
      .sort({ createdAt: -1 });

    // Also return current user's shortlist eligibility so frontend can show/hide controls
    const isShortlisted = await checkShortlisted(req.userId);

    res.json({ success: true, groups, isShortlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET single group details ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id.toString() === req.userId.toString());
    const isShortlisted = await checkShortlisted(req.userId);

    res.json({ success: true, group, isMember, isShortlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST create a new group — shortlisted students only ─────────────────────
router.post('/', checkRole('student'), requireShortlisted, async (req, res) => {
  try {
    const { name, company, description, tags, maxMembers } = req.body;

    if (!name || !company) {
      return res.status(400).json({ success: false, message: 'Name and company are required' });
    }

    const group = new StudyGroup({
      name: name.trim(),
      company: company.trim(),
      description: description?.trim(),
      tags: tags || [],
      createdBy: req.userId,
      maxMembers: maxMembers || 30
    });

    await group.save();
    await group.populate('createdBy', 'name');
    await group.populate('members', 'name');

    res.status(201).json({ success: true, message: 'Study group created!', group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST join or leave a group — shortlisted students only ──────────────────
router.post('/:id/join', checkRole('student'), requireShortlisted, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.userId.toString());

    if (isMember) {
      // Leave — but creator cannot leave their own group
      if (group.createdBy.toString() === req.userId.toString()) {
        return res.status(400).json({ success: false, message: 'You are the creator. Delete the group instead.' });
      }
      group.members = group.members.filter(m => m.toString() !== req.userId.toString());
      await group.save();
      return res.json({ success: true, message: 'Left the group', joined: false });
    }

    // Join — check capacity
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'Group is full' });
    }

    group.members.push(req.userId);
    await group.save();
    res.json({ success: true, message: 'Joined the group!', joined: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE group (only creator or admin) ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (
      group.createdBy.toString() !== req.userId.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    group.isActive = false;
    await group.save();
    await StudyGroupMessage.deleteMany({ groupId: req.params.id });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET messages in a group — member must be shortlisted ─────────────────────
router.get('/:id/messages', requireShortlisted, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only members can read messages
    const isMember = group.members.some(m => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Join the group to read messages' });
    }

    const filter = { groupId: req.params.id };
    if (req.query.since) {
      filter.createdAt = { $gt: new Date(req.query.since) };
    }

    const messages = await StudyGroupMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(req.query.since ? 100 : 60);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST send a message — shortlisted students only ─────────────────────────
router.post('/:id/messages', checkRole('student'), requireShortlisted, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Join the group to send messages' });
    }

    const { content, type } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const message = await StudyGroupMessage.create({
      groupId: req.params.id,
      senderId: req.userId,
      senderName: req.user.name,
      content: content.trim(),
      type: type || 'text'
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
