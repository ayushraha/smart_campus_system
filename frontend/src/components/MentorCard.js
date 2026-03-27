import React, { useState } from 'react';
import { FiStar, FiMessageCircle, FiUsers, FiClock, FiTrendingUp, FiAward, FiChevronRight } from 'react-icons/fi';

const COMPANY_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
const getColor = (name = '') => COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
const getInitials = (name = '') => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const MentorCard = ({ mentor, onChat }) => {
  const [expanded, setExpanded] = useState(false);
  const color = getColor(mentor.company);
  const stars = Math.round(mentor.rating || 0);

  const avail = (mentor.availability || '').toLowerCase();
  const availStyle = avail === 'available'
    ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981', dot: '#10b981' }
    : avail === 'busy'
      ? { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dot: '#f59e0b' }
      : { bg: 'rgba(100,116,139,0.15)', color: '#64748b', dot: '#64748b' };

  return (
    <div className="mc-card">
      {/* Accent bar */}
      <div className="mc-accent" style={{ background: color }} />

      <div className="mc-body">
        {/* Top row: Avatar + Availability */}
        <div className="mc-top">
          <div className="mc-avatar" style={{ background: `${color}22`, color, border: `2px solid ${color}44` }}>
            {mentor.profileImage ? (
              <img src={mentor.profileImage} alt={mentor.name} className="mc-avatar-img" />
            ) : getInitials(mentor.name)}
          </div>
          <div className="mc-avail" style={{ background: availStyle.bg, color: availStyle.color }}>
            <span className="mc-avail-dot" style={{ background: availStyle.dot }} />
            {mentor.availability || 'Available'}
          </div>
        </div>

        {/* Name + Role */}
        <h3 className="mc-name">{mentor.name}</h3>
        <p className="mc-role">
          <span className="mc-company-badge" style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}>
            {mentor.company}
          </span>
          {mentor.role && <span className="mc-role-text"> · {mentor.role}</span>}
        </p>

        {/* Stars */}
        <div className="mc-stars">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={`mc-star ${i < stars ? 'filled' : ''}`} />
          ))}
          <span className="mc-rating-val">{(mentor.rating || 0).toFixed(1)}</span>
          <span className="mc-review-count">({mentor.totalReviews || 0})</span>
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="mc-bio">
            {expanded ? mentor.bio : `${mentor.bio.substring(0, 100)}${mentor.bio.length > 100 ? '...' : ''}`}
            {mentor.bio.length > 100 && (
              <button className="mc-expand-btn" onClick={() => setExpanded(v => !v)}>
                {expanded ? ' Less' : ' More'}
              </button>
            )}
          </p>
        )}

        {/* Stats */}
        <div className="mc-stats">
          <div className="mc-stat">
            <FiUsers className="mc-stat-icon" />
            <span>{mentor.totalMentees || 0}</span>
            <span className="mc-stat-label">Mentees</span>
          </div>
          <div className="mc-stat">
            <FiTrendingUp className="mc-stat-icon" />
            <span>{mentor.successRate || 0}%</span>
            <span className="mc-stat-label">Success</span>
          </div>
          <div className="mc-stat">
            <FiClock className="mc-stat-icon" />
            <span>{mentor.responseTime || '< 1hr'}</span>
            <span className="mc-stat-label">Response</span>
          </div>
        </div>

        {/* Skills */}
        {mentor.skills?.length > 0 && (
          <div className="mc-skills">
            {mentor.skills.slice(0, 5).map((s, i) => (
              <span key={i} className="mc-skill">{s}</span>
            ))}
            {mentor.skills.length > 5 && (
              <span className="mc-skill mc-skill-more">+{mentor.skills.length - 5}</span>
            )}
          </div>
        )}

        {/* CTA */}
        <button className="mc-chat-btn" style={{ '--mentor-color': color }} onClick={onChat}>
          <FiMessageCircle /> Connect &amp; Chat <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default MentorCard;