// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { auth, checkApproved } = require('../middleware/auth');
const Notification = require('../models/Notification');
const CompanySubscription = require('../models/CompanySubscription');

// ─── Apply auth to all routes ─────────────────────────────────────────────────
router.use(auth, checkApproved);

// ─── GET all notifications for current user ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─── PUT mark ALL notifications as read ──────────────────────────────────────
// NOTE: This route MUST be defined before /:id routes to avoid route conflicts
router.put('/read-all/all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// ─── GET subscriptions ────────────────────────────────────────────────────────
// NOTE: Must be before /subscribe/:companyName to avoid conflict
router.get('/subscriptions/list', async (req, res) => {
  try {
    const subs = await CompanySubscription.find({ studentId: req.userId })
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// ─── POST subscribe to company ────────────────────────────────────────────────
router.post('/subscribe', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const existing = await CompanySubscription.findOne({
      studentId: req.userId,
      companyName: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Already subscribed to ${companyName}`
      });
    }

    const sub = await CompanySubscription.create({
      studentId: req.userId,
      companyName: companyName.trim()
    });

    res.status(201).json({
      success: true,
      message: `Subscribed to ${companyName}! You'll be notified when they post a drive.`,
      subscription: sub
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

// ─── PUT mark single notification as read ─────────────────────────────────────
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// ─── DELETE a single notification ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// ─── DELETE unsubscribe from company ─────────────────────────────────────────
router.delete('/subscribe/:companyName', async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    await CompanySubscription.findOneAndDelete({
      studentId: req.userId,
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });
    res.json({ success: true, message: `Unsubscribed from ${companyName}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
});

module.exports = router;
