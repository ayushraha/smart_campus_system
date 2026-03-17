import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Briefcase, Users, TrendingUp, Clock, Award, ArrowLeft, MessageCircle } from 'lucide-react';
import { mentorApi } from '../../services/mentorApi';
import './MentorProfile.css';

const MentorProfile = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchMentorProfile();
  }, [mentorId]);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await mentorApi.getMentorProfile(mentorId);
      setMentor(data);
    } catch (err) {
      setError(err.message || 'Failed to load mentor profile');
      console.error('Error fetching mentor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    navigate(`/student/mentorship?chat=${mentorId}`);
  };

  if (loading) {
    return (
      <div className="mentor-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mentor-profile-container">
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="mentor-profile-container">
        <div className="error-state">
          <p className="error-message">❌ Mentor not found</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-profile-container">
      {/* Header */}
      <div className="profile-header">
        <button onClick={() => navigate(-1)} className="btn-back-nav">
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Top Section */}
        <div className="profile-top">
          <div className="mentor-avatar-large">
            {mentor.profileImage || '👤'}
          </div>

          <div className="mentor-basic-info">
            <h1 className="mentor-name">{mentor.name}</h1>
            
            <div className="mentor-company-role">
              <Briefcase size={18} />
              <div>
                <p className="company">{mentor.company}</p>
                <p className="role">{mentor.role}</p>
              </div>
            </div>

            <div className="mentor-batch">
              <Award size={16} />
              <span>Batch: {mentor.batch}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-box">
              <Star size={20} className="stat-icon" />
              <div>
                <p className="stat-value">{mentor.rating || 0}</p>
                <p className="stat-label">Rating</p>
              </div>
            </div>

            <div className="stat-box">
              <Users size={20} className="stat-icon" />
              <div>
                <p className="stat-value">{mentor.totalMentees || 0}</p>
                <p className="stat-label">Mentees</p>
              </div>
            </div>

            <div className="stat-box">
              <TrendingUp size={20} className="stat-icon" />
              <div>
                <p className="stat-value">{mentor.successRate || 0}%</p>
                <p className="stat-label">Success</p>
              </div>
            </div>

            <div className="stat-box">
              <Clock size={20} className="stat-icon" />
              <div>
                <p className="stat-value">{mentor.responseTime || 'N/A'}</p>
                <p className="stat-label">Response</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating & Reviews */}
        <div className="rating-section">
          <div className="rating-display">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.floor(mentor.rating || 0) ? 'filled' : 'empty'}
                />
              ))}
            </div>
            <div className="rating-info">
              <span className="rating-value">{(mentor.rating || 0).toFixed(1)}/5</span>
              <span className="review-count">({mentor.totalReviews || 0} reviews)</span>
            </div>
          </div>

          <div className="availability-status">
            <div className={`status-dot ${(mentor.availability || 'unavailable').toLowerCase()}`}></div>
            <span>{mentor.availability || 'Unavailable'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button
            className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            Experience
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="tab-pane active">
              <h3>About {mentor.name}</h3>
              <p className="bio-text">
                {mentor.bio || 'No bio provided yet.'}
              </p>

              <div className="info-grid">
                <div className="info-item">
                  <label>Salary (CTC)</label>
                  <p className="info-value">
                    ₹ {mentor.salary ? mentor.salary.toLocaleString('en-IN') : 'N/A'}
                  </p>
                </div>

                <div className="info-item">
                  <label>Total Sessions</label>
                  <p className="info-value">{mentor.sessionCount || 0}</p>
                </div>

                <div className="info-item">
                  <label>Years Experience</label>
                  <p className="info-value">{mentor.yearsOfExperience || 'N/A'}</p>
                </div>

                <div className="info-item">
                  <label>Response Time</label>
                  <p className="info-value">{mentor.responseTime || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="tab-pane active">
              <h3>Skills & Expertise</h3>
              <div className="skills-container">
                {mentor.skills && mentor.skills.length > 0 ? (
                  mentor.skills.map((skill, idx) => (
                    <div key={idx} className="skill-badge">
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="no-data">No skills listed</p>
                )}
              </div>

              {mentor.specializations && mentor.specializations.length > 0 && (
                <>
                  <h4>Specializations</h4>
                  <div className="specializations-container">
                    {mentor.specializations.map((spec, idx) => (
                      <div key={idx} className="spec-badge">
                        {spec}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="tab-pane active">
              <h3>Professional Experience</h3>
              
              <div className="experience-section">
                <div className="experience-item">
                  <div className="exp-icon">🏢</div>
                  <div className="exp-details">
                    <h4>Current Position</h4>
                    <p className="exp-company">{mentor.company}</p>
                    <p className="exp-role">{mentor.role}</p>
                  </div>
                </div>
              </div>

              <div className="experience-stats">
                <h4>Mentoring Stats</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">{mentor.totalMentees || 0}</span>
                    <span className="stat-text">Students Mentored</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{mentor.sessionCount || 0}</span>
                    <span className="stat-text">Total Sessions</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{mentor.successRate || 0}%</span>
                    <span className="stat-text">Success Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{mentor.totalReviews || 0}</span>
                    <span className="stat-text">Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleStartChat} className="btn-primary">
            <MessageCircle size={20} />
            Start Chat with {mentor.name}
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Back to Mentors
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;