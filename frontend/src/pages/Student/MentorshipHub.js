import React, { useState, useEffect } from 'react';
import { mentorApi } from '../../services/mentorApi';
import MentorCard from '../../components/MentorCard';
import ChatWindow from '../../components/ChatWindow';
import './MentorshipHub.css';
import { Search, Filter, Award, Users, MessageCircle } from 'lucide-react';

const MentorshipHub = () => {
  // State Management
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [filterSkill, setFilterSkill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  // Available skills for filtering
  const availableSkills = [
    'All',
    'DSA',
    'System Design',
    'Web Development',
    'Python',
    'Java',
    'C++',
    'React',
    'Node.js',
    'AWS',
    'DevOps',
    'MERN',
    'Product Management',
    'Data Science'
  ];

  // Fetch mentors on mount and when filters change
  useEffect(() => {
    fetchMentors();
  }, [filterSkill, searchQuery]);

  // Fetch mentors from API
  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filterSkill !== 'All') params.skill = filterSkill;
      if (searchQuery) params.search = searchQuery;

      const data = await mentorApi.getMentors(params);
      setMentors(data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setError('Failed to load mentors. Please try again.');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  // Open chat with mentor
  const handleChatOpen = (mentor) => {
    setSelectedMentor(mentor);
    setChatOpen(true);
  };

  // Close chat
  const handleChatClose = () => {
    setChatOpen(false);
    setSelectedMentor(null);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterSkill('All');
    setSearchQuery('');
  };

  // Stats data for display
  const stats = [
    { icon: Users, label: 'Active Mentors', value: mentors.length },
    { icon: MessageCircle, label: 'Connect Now', value: mentors.length > 0 ? '→' : '0' },
    { icon: Award, label: 'Get Placed', value: '🎯' }
  ];

  return (
    <div className="mentorship-hub-wrapper">
      {!chatOpen ? (
        <>
          {/* ==================== HEADER SECTION ==================== */}
          <div className="mentorship-header-container">
            <div className="header-content">
              <div className="header-icon-group">
                <Award size={40} className="header-icon" />
              </div>
              
              <h1 className="header-title">
                🎯 Placement Mentorship Hub
              </h1>
              
              <p className="header-subtitle">
                Learn directly from students who got placed. Get insider tips, clear your doubts & succeed!
              </p>

              {/* Stats Row */}
              <div className="stats-row">
                {stats.map((stat, idx) => (
                  <div key={idx} className="stat-box">
                    <stat.icon size={20} />
                    <div>
                      <p className="stat-label">{stat.label}</p>
                      <p className="stat-value">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== SEARCH & FILTER SECTION ==================== */}
          <div className="mentorship-container">
            <div className="search-filter-section">
              {/* Search Input */}
              <div className="search-box">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search mentors by name or company (e.g., 'Google', 'Rajesh')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Skill Filter */}
              <div className="filter-group">
                <Filter size={20} className="filter-icon" />
                <select
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="filter-select"
                >
                  {availableSkills.map(skill => (
                    <option key={skill} value={skill}>
                      {skill === 'All' ? '📚 All Skills' : `🏷️ ${skill}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              {(filterSkill !== 'All' || searchQuery) && (
                <button onClick={handleResetFilters} className="reset-btn">
                  ✕ Clear Filters
                </button>
              )}
            </div>

            {/* Results Info */}
            <div className="results-info">
              {!loading && mentors.length > 0 && (
                <p className="results-count">
                  <span className="count-badge">{mentors.length}</span>
                  Mentor{mentors.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* ==================== ERROR STATE ==================== */}
            {error && (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{error}</p>
                <button onClick={fetchMentors} className="retry-btn">
                  Retry
                </button>
              </div>
            )}

            {/* ==================== LOADING STATE ==================== */}
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Finding amazing mentors for you...</p>
              </div>
            )}

            {/* ==================== MENTORS GRID ==================== */}
            {!loading && !error && mentors.length > 0 && (
              <div className="mentors-grid">
                {mentors.map(mentor => (
                  <MentorCard
                    key={mentor._id}
                    mentor={mentor}
                    onChat={() => handleChatOpen(mentor)}
                  />
                ))}
              </div>
            )}

            {/* ==================== EMPTY STATE ==================== */}
            {!loading && !error && mentors.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No mentors found</h3>
                <p className="empty-description">
                  {searchQuery || filterSkill !== 'All'
                    ? 'Try adjusting your search or filters to find mentors.'
                    : 'Check back soon! More mentors will be joining.'}
                </p>
                {(searchQuery || filterSkill !== 'All') && (
                  <button onClick={handleResetFilters} className="empty-reset-btn">
                    Clear Filters & Try Again
                  </button>
                )}
              </div>
            )}

            {/* ==================== NO RESULTS SUGGESTION ==================== */}
            {!loading && !error && mentors.length === 0 && searchQuery && (
              <div className="suggestion-box">
                <p>💡 <strong>Tip:</strong> Try searching for company names like "Google", "Microsoft", or "Amazon"</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ==================== CHAT VIEW ==================== */
        <ChatWindow
          mentor={selectedMentor}
          onClose={handleChatClose}
        />
      )}
    </div>
  );
};

export default MentorshipHub;