// ================================================================
// backend/scripts/updateMentorStatus.js
// Script to manage mentor status updates and analytics
// ================================================================

const mongoose = require('mongoose');
const Mentor = require('../models/Mentor');
const MentorSession = require('../models/MentorSession');
const MentorMessage = require('../models/MentorMessage');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus-recruitment');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Update mentor statistics
const updateMentorStats = async (mentorId) => {
  try {
    console.log(`\n📊 Updating stats for mentor: ${mentorId}`);

    // Get all sessions for this mentor
    const sessions = await MentorSession.find({ mentorId });
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const ratedSessions = completedSessions.filter(s => s.rating);

    // Calculate average rating
    const avgRating = ratedSessions.length > 0
      ? ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length
      : 0;

    // Get success rate (students who got placed)
    const placedCount = ratedSessions.filter(s => s.rating >= 4).length;
    const successRate = ratedSessions.length > 0
      ? Math.round((placedCount / ratedSessions.length) * 100)
      : 0;

    // Get total mentees (unique students)
    const menteeCount = new Set(sessions.map(s => s.studentId.toString())).size;

    // Calculate average response time
    const messages = await MentorMessage.find({ mentorId, sender: 'mentor' });
    let avgResponseTime = 0;
    
    if (messages.length > 0) {
      const studentMessages = await MentorMessage.find({ mentorId, sender: 'student' });
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const studentMsg of studentMessages) {
        const mentorResponse = messages.find(
          m => m.studentId.equals(studentMsg.studentId) &&
               m.createdAt > studentMsg.createdAt
        );
        if (mentorResponse) {
          const timeDiff = mentorResponse.createdAt - studentMsg.createdAt;
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }

      avgResponseTime = responseCount > 0
        ? Math.round(totalResponseTime / responseCount / 60000) // Convert to minutes
        : 0;
    }

    // Determine response time text
    let responseTimeText = 'Not available';
    if (avgResponseTime < 60) {
      responseTimeText = `< ${Math.max(1, Math.round(avgResponseTime / 15) * 15)} min`;
    } else if (avgResponseTime < 1440) {
      responseTimeText = `< ${Math.round(avgResponseTime / 60)} hours`;
    } else {
      responseTimeText = `< ${Math.round(avgResponseTime / 1440)} days`;
    }

    // Update mentor document
    const updatedMentor = await Mentor.findByIdAndUpdate(
      mentorId,
      {
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: ratedSessions.length,
        totalMentees: menteeCount,
        successRate,
        responseTime: responseTimeText,
        avgResponseTime,
        sessionCount: sessions.length,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`✅ Stats updated:`);
    console.log(`   Rating: ${updatedMentor.rating}/5 (${updatedMentor.totalReviews} reviews)`);
    console.log(`   Total Mentees: ${updatedMentor.totalMentees}`);
    console.log(`   Success Rate: ${updatedMentor.successRate}%`);
    console.log(`   Response Time: ${updatedMentor.responseTime}`);
    console.log(`   Sessions: ${updatedMentor.sessionCount}`);

    return updatedMentor;
  } catch (error) {
    console.error(`❌ Error updating mentor stats:`, error);
    throw error;
  }
};

// Update all mentors' statistics
const updateAllMentorsStats = async () => {
  try {
    console.log('\n🔄 Updating all mentors statistics...\n');

    const mentors = await Mentor.find({ activeStatus: true });
    console.log(`Found ${mentors.length} active mentors\n`);

    for (const mentor of mentors) {
      await updateMentorStats(mentor._id);
    }

    console.log(`\n✅ All mentors updated successfully!`);
  } catch (error) {
    console.error('❌ Error updating all mentors:', error);
  }
};

// Deactivate inactive mentors (no activity in 30 days)
const deactivateInactiveMentors = async () => {
  try {
    console.log('\n🔍 Checking for inactive mentors...\n');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactiveMentors = await Mentor.find({
      activeStatus: true,
      updatedAt: { $lt: thirtyDaysAgo }
    });

    console.log(`Found ${inactiveMentors.length} inactive mentors\n`);

    for (const mentor of inactiveMentors) {
      await Mentor.findByIdAndUpdate(
        mentor._id,
        { activeStatus: false },
        { new: true }
      );
      console.log(`❌ Deactivated: ${mentor.name} (${mentor.company})`);
    }

    console.log(`\n✅ Inactive mentors deactivated!`);
  } catch (error) {
    console.error('❌ Error deactivating mentors:', error);
  }
};

// Reactivate mentor
const reactivateMentor = async (mentorId) => {
  try {
    console.log(`\n✨ Reactivating mentor: ${mentorId}`);

    const mentor = await Mentor.findByIdAndUpdate(
      mentorId,
      { activeStatus: true, updatedAt: new Date() },
      { new: true }
    );

    console.log(`✅ Mentor reactivated: ${mentor.name}`);
    return mentor;
  } catch (error) {
    console.error('❌ Error reactivating mentor:', error);
  }
};

// Generate mentor report
const generateMentorReport = async (mentorId) => {
  try {
    console.log(`\n📋 Generating report for mentor: ${mentorId}\n`);

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      console.error('❌ Mentor not found');
      return;
    }

    const sessions = await MentorSession.find({ mentorId })
      .populate('studentId', 'name email');

    const messages = await MentorMessage.find({ mentorId });

    console.log(`📊 MENTOR REPORT`);
    console.log(`=====================================`);
    console.log(`Name: ${mentor.name}`);
    console.log(`Company: ${mentor.company}`);
    console.log(`Role: ${mentor.role}`);
    console.log(`Batch: ${mentor.batch}`);
    console.log(`\n📈 STATISTICS`);
    console.log(`Rating: ${mentor.rating}/5 (${mentor.totalReviews} reviews)`);
    console.log(`Total Mentees: ${mentor.totalMentees}`);
    console.log(`Success Rate: ${mentor.successRate}%`);
    console.log(`Total Sessions: ${mentor.sessionCount}`);
    console.log(`Response Time: ${mentor.responseTime}`);
    console.log(`\n💬 MESSAGES`);
    console.log(`Total Messages: ${messages.length}`);
    console.log(`Mentor Messages: ${messages.filter(m => m.sender === 'mentor').length}`);
    console.log(`Student Messages: ${messages.filter(m => m.sender === 'student').length}`);
    console.log(`\n🎯 SESSIONS`);
    console.log(`Total: ${sessions.length}`);
    console.log(`Scheduled: ${sessions.filter(s => s.status === 'scheduled').length}`);
    console.log(`Completed: ${sessions.filter(s => s.status === 'completed').length}`);
    console.log(`Cancelled: ${sessions.filter(s => s.status === 'cancelled').length}`);
    console.log(`\n✅ Report generated!`);

    return {
      mentor,
      sessions,
      messages
    };
  } catch (error) {
    console.error('❌ Error generating report:', error);
  }
};

// Main execution
const main = async () => {
  const command = process.argv[2];
  const param = process.argv[3];

  await connectDB();

  try {
    switch (command) {
      case 'update-all':
        await updateAllMentorsStats();
        break;

      case 'update':
        if (!param) {
          console.error('❌ Please provide mentor ID');
          process.exit(1);
        }
        await updateMentorStats(param);
        break;

      case 'deactivate-inactive':
        await deactivateInactiveMentors();
        break;

      case 'reactivate':
        if (!param) {
          console.error('❌ Please provide mentor ID');
          process.exit(1);
        }
        await reactivateMentor(param);
        break;

      case 'report':
        if (!param) {
          console.error('❌ Please provide mentor ID');
          process.exit(1);
        }
        await generateMentorReport(param);
        break;

      default:
        console.log(`
🔧 MENTOR STATUS MANAGEMENT SCRIPT

Usage:
  node updateMentorStatus.js <command> [mentorId]

Commands:
  update-all              Update all mentors' statistics
  update <mentorId>       Update specific mentor stats
  deactivate-inactive     Deactivate inactive mentors (30+ days)
  reactivate <mentorId>   Reactivate a mentor
  report <mentorId>       Generate mentor report

Examples:
  node updateMentorStatus.js update-all
  node updateMentorStatus.js update 507f1f77bcf86cd799439011
  node updateMentorStatus.js deactivate-inactive
  node updateMentorStatus.js report 507f1f77bcf86cd799439011
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed\n');
  }
};

// Run script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});