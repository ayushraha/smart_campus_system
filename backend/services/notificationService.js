// backend/services/notificationService.js
const Notification = require('../models/Notification');
const CompanySubscription = require('../models/CompanySubscription');

/**
 * Create a single notification for a user
 */
async function createNotification(userId, title, message, type = 'general', link = '/student/calendar', relatedEventId = null) {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      link,
      relatedEventId
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
}

/**
 * Notify all students subscribed to a company
 */
async function notifySubscribers(companyName, title, message, type = 'drive', link = '/student/calendar', eventId = null) {
  try {
    const subscriptions = await CompanySubscription.find({
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });

    if (!subscriptions.length) return 0;

    const notifications = subscriptions.map(sub => ({
      userId: sub.studentId,
      title,
      message,
      type,
      link,
      relatedEventId: eventId,
      isRead: false
    }));

    await Notification.insertMany(notifications);
    console.log(`✅ Sent ${notifications.length} notifications for company: ${companyName}`);
    return notifications.length;
  } catch (error) {
    console.error('Error notifying subscribers:', error.message);
    return 0;
  }
}

/**
 * Create deadline reminder notifications for registered students
 */
async function sendDeadlineReminders(driveEvent) {
  try {
    const { registeredStudents, title, company, applicationDeadline, _id } = driveEvent;
    if (!registeredStudents || !registeredStudents.length) return;

    const deadlineStr = applicationDeadline
      ? new Date(applicationDeadline).toLocaleDateString('en-IN')
      : 'soon';

    const notifications = registeredStudents.map(studentId => ({
      userId: studentId,
      title: `⏰ Deadline Reminder: ${company}`,
      message: `Application deadline for "${title}" is on ${deadlineStr}. Don't miss it!`,
      type: 'deadline',
      link: '/student/calendar',
      relatedEventId: _id,
      isRead: false
    }));

    await Notification.insertMany(notifications);
    return notifications.length;
  } catch (error) {
    console.error('Error sending deadline reminders:', error.message);
  }
}

module.exports = {
  createNotification,
  notifySubscribers,
  sendDeadlineReminders
};
