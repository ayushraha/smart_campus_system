const Mentor = require('../models/Mentor');
const MentorSession = require('../models/MentorSession');
const User = require('../models/User');

class MentorService {
  // Verify if student is placed
  async verifyPlacement(userId) {
    try {
      const user = await User.findById(userId).populate('applications');
      
      // Check if user has successful application
      const successfulApplication = user.applications?.find(app => app.status === 'placed');
      
      return !!successfulApplication;
    } catch (error) {
      throw new Error('Error verifying placement: ' + error.message);
    }
  }

  // Create mentor profile
  async createMentorProfile(userId, mentorData) {
    try {
      // Check if already a mentor
      const existingMentor = await Mentor.findOne({ userId });
      if (existingMentor) {
        throw new Error('User is already registered as a mentor');
      }

      const mentor = new Mentor({
        userId,
        ...mentorData,
        batch: new Date().getFullYear().toString()
      });

      await mentor.save();
      return mentor;
    } catch (error) {
      throw new Error('Error creating mentor profile: ' + error.message);
    }
  }

  // Get mentor statistics
  async getMentorStats(mentorId) {
    try {
      const sessions = await MentorSession.find({ mentorId });
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const ratedSessions = completedSessions.filter(s => s.rating);

      const avgRating = ratedSessions.length > 0
        ? ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length
        : 0;

      return {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        averageRating: avgRating.toFixed(1),
        totalReviews: ratedSessions.length
      };
    } catch (error) {
      throw new Error('Error getting mentor stats: ' + error.message);
    }
  }

  // Update mentor response time
  async updateResponseTime(mentorId) {
    try {
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) throw new Error('Mentor not found');

      // Calculate average response time
      // This would be based on message timestamps
      // Simplified for now
      mentor.responseTime = '< 2 hours';
      await mentor.save();

      return mentor;
    } catch (error) {
      throw new Error('Error updating response time: ' + error.message);
    }
  }

  // Get mentors by filter
  async getMentorsByFilter(filters = {}) {
    try {
      let query = { activeStatus: true };

      if (filters.skill) {
        query.skills = filters.skill;
      }
      if (filters.company) {
        query.company = new RegExp(filters.company, 'i');
      }
      if (filters.batch) {
        query.batch = filters.batch;
      }
      if (filters.minRating) {
        query.rating = { $gte: filters.minRating };
      }

      const mentors = await Mentor.find(query)
        .sort({ rating: -1, totalMentees: -1 })
        .limit(filters.limit || 50)
        .lean();

      return mentors;
    } catch (error) {
      throw new Error('Error fetching mentors: ' + error.message);
    }
  }

  // Deactivate mentor
  async deactivateMentor(mentorId) {
    try {
      const mentor = await Mentor.findByIdAndUpdate(
        mentorId,
        { activeStatus: false },
        { new: true }
      );
      return mentor;
    } catch (error) {
      throw new Error('Error deactivating mentor: ' + error.message);
    }
  }

  // Get mentor dashboard data
  async getMentorDashboard(mentorId) {
    try {
      const mentor = await Mentor.findById(mentorId);
      const stats = await this.getMentorStats(mentorId);
      const upcomingSessions = await MentorSession.find({
        mentorId,
        status: 'scheduled',
        scheduledDate: { $gte: new Date() }
      }).populate('studentId', 'name email');

      return {
        mentor,
        stats,
        upcomingSessions
      };
    } catch (error) {
      throw new Error('Error getting mentor dashboard: ' + error.message);
    }
  }
}

module.exports = new MentorService();