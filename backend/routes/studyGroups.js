// backend/routes/studyGroups.js
const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');
const StudyGroup = require('../models/StudyGroup');
const StudyGroupMessage = require('../models/StudyGroupMessage');

// All routes require auth
router.use(auth, checkApproved);

// ─── GET all active groups (with optional company filter) ─────────────────────
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

    res.json({ success: true, groups });
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
    res.json({ success: true, group, isMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST create a new group (students only) ──────────────────────────────────
router.post('/', checkRole('student'), async (req, res) => {
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

// ─── POST join or leave a group (toggle) ─────────────────────────────────────
router.post('/:id/join', checkRole('student'), async (req, res) => {
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
    // Clean up messages older than the group
    await StudyGroupMessage.deleteMany({ groupId: req.params.id });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET messages in a group ──────────────────────────────────────────────────
// Supports ?since=ISO-timestamp for efficient polling (only fetch new messages)
router.get('/:id/messages', async (req, res) => {
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
      .limit(req.query.since ? 100 : 60); // full load vs poll update

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST send a message ──────────────────────────────────────────────────────
router.post('/:id/messages', checkRole('student'), async (req, res) => {
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
