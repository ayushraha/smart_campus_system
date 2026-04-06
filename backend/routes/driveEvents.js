// backend/routes/driveEvents.js
const express = require('express');
const router = express.Router();
const { auth, checkRole, checkApproved } = require('../middleware/auth');
const DriveEvent = require('../models/DriveEvent');
const { notifySubscribers } = require('../services/notificationService');

// ─── Apply auth to all routes ─────────────────────────────────────────────────
router.use(auth);

// ─── GET all events ──────────────────────────────────────────────────────────
// Students see all upcoming; recruiters see only their own
router.get('/', checkApproved, async (req, res) => {
  try {
    const { month, year, company, type } = req.query;
    const filter = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      filter.eventDate = { $gte: start, $lte: end };
    }
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (type)    filter.type = type;

    // Recruiters only see their own events
    if (req.user.role === 'recruiter') {
      filter.recruiterId = req.userId;
    }

    const events = await DriveEvent.find(filter)
      .populate('recruiterId', 'name email')
      .sort({ eventDate: 1 });

    res.json({ success: true, events });
  } catch (error) {
    console.error('Get drive events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// ─── GET single event ─────────────────────────────────────────────────────────
router.get('/:id', checkApproved, async (req, res) => {
  try {
    const event = await DriveEvent.findById(req.params.id)
      .populate('recruiterId', 'name email')
      .populate('registeredStudents', 'name email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// ─── POST create event (recruiter / admin only) ───────────────────────────────
router.post('/', checkRole('recruiter', 'admin'), checkApproved, async (req, res) => {
  try {
    const {
      title, company, type, eventDate, applicationDeadline,
      description, venue, eligibility, salary, maxSlots
    } = req.body;

    if (!title || !company || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, company and event date are required'
      });
    }

    const event = new DriveEvent({
      title, company, type, eventDate, applicationDeadline,
      description, venue, eligibility, salary, maxSlots,
      recruiterId: req.userId,
      status: 'upcoming'
    });

    await event.save();

    // Notify subscribed students in background (non-blocking)
    setImmediate(async () => {
      try {
        const typeLabel = type === 'placement-drive' ? 'Placement Drive' : 'Event';
        const count = await notifySubscribers(
          company,
          `🎉 New ${typeLabel}: ${company}`,
          `${company} has posted "${title}" on ${new Date(eventDate).toLocaleDateString('en-IN')}. Check the Drive Calendar!`,
          'drive',
          '/student/calendar',
          event._id
        );
        if (count > 0) console.log(`📢 Notified ${count} students about ${company} drive`);
      } catch (e) {
        console.error('Background notification error:', e.message);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Drive event created successfully! Subscribed students have been notified.',
      event
    });
  } catch (error) {
    console.error('Create drive event error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create event' });
  }
});

// ─── PUT update event (owner recruiter / admin) ───────────────────────────────
router.put('/:id', checkRole('recruiter', 'admin'), checkApproved, async (req, res) => {
  try {
    const event = await DriveEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (req.user.role !== 'admin' && event.recruiterId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const updated = await DriveEvent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Event updated successfully', event: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// ─── DELETE event (owner recruiter / admin) ───────────────────────────────────
router.delete('/:id', checkRole('recruiter', 'admin'), checkApproved, async (req, res) => {
  try {
    const event = await DriveEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (req.user.role !== 'admin' && event.recruiterId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await DriveEvent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// ─── POST register / unregister for event (students only) ────────────────────
router.post('/:id/register', checkRole('student'), checkApproved, async (req, res) => {
  try {
    const event = await DriveEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Event is cancelled' });
    }

    const alreadyRegistered = event.registeredStudents.some(
      id => id.toString() === req.userId.toString()
    );

    if (alreadyRegistered) {
      // Toggle: unregister
      event.registeredStudents = event.registeredStudents.filter(
        id => id.toString() !== req.userId.toString()
      );
      await event.save();
      return res.json({ success: true, message: 'Unregistered from event', registered: false, event });
    }

    // Check max slots
    if (event.maxSlots > 0 && event.registeredStudents.length >= event.maxSlots) {
      return res.status(400).json({ success: false, message: 'No slots remaining for this event' });
    }

    event.registeredStudents.push(req.userId);
    await event.save();

    res.json({ success: true, message: 'Registered for event successfully!', registered: true, event });
  } catch (error) {
    console.error('Register event error:', error);
    res.status(500).json({ success: false, message: 'Failed to register' });
  }
});

module.exports = router;
