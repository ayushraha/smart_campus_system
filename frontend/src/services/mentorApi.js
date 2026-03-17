// ================================================================
// frontend/src/services/mentorApi.js
// Complete API service for Mentorship Hub
// ================================================================

import api from './api'; // Your existing axios instance

/**
 * Mentor API Service
 * Handles all mentor-related API calls
 */

export const mentorApi = {
  /**
   * Get all mentors (for discovery page)
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Array of mentors
   */
  getMentors: async (filters = {}) => {
    try {
      console.log('📡 Fetching mentors with filters:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.skill && filters.skill !== 'All') {
        params.append('skill', filters.skill);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.company) {
        params.append('company', filters.company);
      }
      
      if (filters.batch) {
        params.append('batch', filters.batch);
      }

      const response = await api.get('/mentor/discover', { params });
      
      console.log('✅ Mentors fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch mentors');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Get single mentor profile
   * @param {String} mentorId - Mentor ID
   * @returns {Promise<Object>} Mentor profile data
   */
  getMentorProfile: async (mentorId) => {
    try {
      console.log('📡 Fetching mentor profile:', mentorId);
      
      const response = await api.get(`/mentor/profile/${mentorId}`);
      
      console.log('✅ Mentor profile fetched:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch mentor profile');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Register current user as mentor
   * @param {Object} mentorData - Mentor registration data
   * @returns {Promise<Object>} Created mentor profile
   */
  registerAsMentor: async (mentorData) => {
    try {
      console.log('📡 Registering as mentor with data:', mentorData);
      
      // Validate required fields
      if (!mentorData.company || !mentorData.role || !mentorData.salary) {
        throw new Error('Company, role, and salary are required');
      }
      
      if (!mentorData.skills || mentorData.skills.length === 0) {
        throw new Error('At least one skill is required');
      }

      const response = await api.post('/mentor/register', mentorData);
      
      console.log('✅ Mentor registered successfully:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || error.message || 'Failed to register as mentor');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Update mentor profile
   * @param {String} mentorId - Mentor ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated mentor profile
   */
  updateMentorProfile: async (mentorId, updateData) => {
    try {
      console.log('📡 Updating mentor profile:', mentorId);
      
      const response = await api.put(`/mentor/profile/${mentorId}`, updateData);
      
      console.log('✅ Mentor profile updated:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to update mentor profile');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Send message to mentor
   * @param {String} mentorId - Mentor ID
   * @param {String} content - Message content
   * @param {String} messageType - Type of message (text, resource-link, etc.)
   * @returns {Promise<Object>} Created message
   */
  sendMessage: async (mentorId, content, messageType = 'text') => {
    try {
      console.log('📡 Sending message to mentor:', mentorId);
      
      if (!content || content.trim() === '') {
        throw new Error('Message content cannot be empty');
      }

      const response = await api.post('/mentor-messages/send', {
        mentorId,
        content,
        messageType
      });
      
      console.log('✅ Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to send message');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Get chat messages between student and mentor
   * @param {String} mentorId - Mentor ID
   * @returns {Promise<Array>} Array of messages
   */
  getMessages: async (mentorId) => {
    try {
      console.log('📡 Fetching chat messages with mentor:', mentorId);
      
      const response = await api.get(`/mentor-messages/chat/${mentorId}`);
      
      console.log('✅ Messages fetched:', response.data.length, 'messages');
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch messages');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Book a mentorship session
   * @param {Object} sessionData - Session booking data
   * @returns {Promise<Object>} Created session
   */
  bookSession: async (sessionData) => {
    try {
      console.log('📡 Booking mentorship session:', sessionData);
      
      if (!sessionData.mentorId || !sessionData.title) {
        throw new Error('Mentor ID and title are required');
      }

      const response = await api.post('/mentor/book-session', sessionData);
      
      console.log('✅ Session booked successfully:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to book session');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Get mentor's active sessions
   * @param {String} mentorId - Mentor ID
   * @returns {Promise<Array>} Array of sessions
   */
  getSessions: async (mentorId) => {
    try {
      console.log('📡 Fetching mentor sessions:', mentorId);
      
      const response = await api.get(`/mentor/sessions/${mentorId}`);
      
      console.log('✅ Sessions fetched:', response.data.length, 'sessions');
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch sessions');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Rate a completed mentorship session
   * @param {String} sessionId - Session ID
   * @param {Number} rating - Rating (1-5)
   * @param {String} review - Review text
   * @returns {Promise<Object>} Updated session
   */
  rateSession: async (sessionId, rating, review = '') => {
    try {
      console.log('📡 Rating session:', sessionId, 'Rating:', rating);
      
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const response = await api.post(`/mentor/rate-session/${sessionId}`, {
        rating,
        review
      });
      
      console.log('✅ Session rated successfully:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to rate session');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Mark a message as helpful
   * @param {String} messageId - Message ID
   * @returns {Promise<Object>} Updated message
   */
  markMessageHelpful: async (messageId) => {
    try {
      console.log('📡 Marking message as helpful:', messageId);
      
      const response = await api.put(`/mentor-messages/mark-helpful/${messageId}`);
      
      console.log('✅ Message marked as helpful:', response.data);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to mark message helpful');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Search mentors by query
   * @param {String} query - Search query
   * @returns {Promise<Array>} Search results
   */
  searchMentors: async (query) => {
    try {
      console.log('📡 Searching mentors with query:', query);
      
      const response = await api.get('/mentor/discover', {
        params: { search: query }
      });
      
      console.log('✅ Search results:', response.data.length, 'mentors found');
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Search failed');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Get mentors by skill
   * @param {String} skill - Skill name
   * @returns {Promise<Array>} Mentors with specified skill
   */
  getMentorsBySkill: async (skill) => {
    try {
      console.log('📡 Fetching mentors by skill:', skill);
      
      const response = await api.get('/mentor/discover', {
        params: { skill }
      });
      
      console.log('✅ Mentors with skill fetched:', response.data.length);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch mentors by skill');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Get mentors by company
   * @param {String} company - Company name
   * @returns {Promise<Array>} Mentors from specified company
   */
  getMentorsByCompany: async (company) => {
    try {
      console.log('📡 Fetching mentors from company:', company);
      
      const response = await api.get('/mentor/discover', {
        params: { company }
      });
      
      console.log('✅ Mentors from company fetched:', response.data.length);
      return response.data;
    } catch (error) {
      const errObj = new Error(error.response?.data?.message || 'Failed to fetch mentors by company');
      errObj.status = error.response?.status;
      errObj.originalError = error;
      throw errObj;
    }
  },

  /**
   * Check if current user is a mentor
   * @returns {Promise<Boolean>} True if user is mentor
   */
  checkIfMentor: async () => {
    try {
      console.log('📡 Checking if user is mentor...');
      
      // This would call your backend to check
      const response = await api.get('/mentor/check-status');
      
      console.log('✅ Mentor status checked:', response.data);
      return response.data.isMentor;
    } catch (error) {
      console.log('ℹ️ User is not a mentor');
      return false;
    }
  },

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @returns {Object} Formatted error
   */
  formatError: (error) => {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
      isNetworkError: !error.response
    };
  }
};

// Export for use in components
export default mentorApi;