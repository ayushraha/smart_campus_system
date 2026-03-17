import React from 'react';
import { Star, MessageCircle, Users, Clock, TrendingUp } from 'lucide-react';

const MentorCard = ({ mentor, onChat }) => {
  return (
    <div className="mentor-card">
      {/* Header Section */}
      <div className="mentor-header">
        <div className="mentor-avatar">{mentor.profileImage || '👤'}</div>
        <div className="mentor-title">
          <h3>{mentor.name}</h3>
          <p className="company">
            <span className="badge">{mentor.company}</span>
            <span className="role">{mentor.role}</span>
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="mentor-bio">{mentor.bio}</p>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat">
          <Users size={18} />
          <div>
            <p className="stat-value">{mentor.totalMentees}</p>
            <p className="stat-label">Mentees</p>
          </div>
        </div>
        <div className="stat">
          <TrendingUp size={18} />
          <div>
            <p className="stat-value">{mentor.successRate}%</p>
            <p className="stat-label">Success</p>
          </div>
        </div>
        <div className="stat">
          <Clock size={18} />
          <div>
            <p className="stat-value">{mentor.responseTime}</p>
            <p className="stat-label">Response</p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="rating-section">
        <div className="stars">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < Math.floor(mentor.rating) ? 'filled' : 'empty'}
            />
          ))}
        </div>
        <span className="rating-value">{mentor.rating.toFixed(1)}</span>
        <span className="review-count">({mentor.totalReviews} reviews)</span>
      </div>

      {/* Skills */}
      <div className="skills">
        {mentor.skills.map((skill, idx) => (
          <span key={idx} className="skill-tag">{skill}</span>
        ))}
      </div>

      {/* Availability */}
      <div className="availability">
        <div className={`status-dot ${mentor.availability.toLowerCase()}`}></div>
        <span>{mentor.availability}</span>
      </div>

      {/* Chat Button */}
      <button onClick={onChat} className="chat-btn">
        <MessageCircle size={18} />
        Start Chat
      </button>
    </div>
  );
};

export default MentorCard;