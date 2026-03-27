import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mentorApi } from '../../services/mentorApi';
import MentorCard from '../../components/MentorCard';
import { FiSearch, FiX, FiSend, FiUsers, FiAward, FiZap, FiFilter, FiMessageCircle } from 'react-icons/fi';
import './MentorshipHub.css';

const SKILLS = ['All','DSA','System Design','Web Development','Python','Java','C++','React','Node.js','AWS','DevOps','MERN','Product Management','Data Science'];

const MentorshipHub = () => {
  const [mentors, setMentors]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filterSkill, setFilterSkill]     = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [showFilters, setShowFilters]     = useState(false);

  // Chat state
  const [chatMentor, setChatMentor]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [draft, setDraft]                 = useState('');
  const [sending, setSending]             = useState(false);
  const chatEndRef                        = useRef(null);

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params = {};
      if (filterSkill !== 'All') params.skill = filterSkill;
      if (searchQuery) params.search = searchQuery;
      const data = await mentorApi.getMentors(params);
      setMentors(data || []);
    } catch {
      setError('Failed to load mentors. Please try again.');
      setMentors([]);
    } finally { setLoading(false); }
  }, [filterSkill, searchQuery]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Open chat
  const openChat = async (mentor) => {
    setChatMentor(mentor);
    setMsgLoading(true);
    try {
      const msgs = await mentorApi.getMessages(mentor._id);
      setMessages(msgs || []);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  };

  // Send message
  const sendMsg = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);
    // Optimistic
    setMessages(prev => [...prev, { _id: Date.now(), content: text, sender: 'student', createdAt: new Date() }]);
    try {
      await mentorApi.sendMessage(chatMentor._id, text);
    } catch { /* silently fail for now */ }
    setSending(false);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mh-root">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mh-header">
        <div>
          <h1 className="mh-title">
            <FiAward className="mh-title-icon" /> Mentorship Hub
          </h1>
          <p className="mh-subtitle">
            Connect with seniors who got placed. Get real advice. Land your dream job.
          </p>
        </div>
        <div className="mh-header-stats">
          <div className="mh-stat-chip"><FiUsers /> {mentors.length} Mentors</div>
          <div className="mh-stat-chip"><FiZap /> Live Chat</div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="mh-search-row">
        <div className="mh-search-box">
          <FiSearch className="mh-search-icon" />
          <input
            className="mh-search-input"
            type="text"
            placeholder="Search by name, company (e.g. Google, Infosys)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mh-clear-btn" onClick={() => setSearchQuery('')}><FiX /></button>
          )}
        </div>
        <button className={`mh-filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)}>
          <FiFilter /> Filters
          {filterSkill !== 'All' && <span className="mh-filter-dot" />}
        </button>
      </div>

      {/* ── Skill Filter Pills ───────────────────────────────────── */}
      {showFilters && (
        <div className="mh-skill-pills">
          {SKILLS.map(s => (
            <button
              key={s}
              className={`mh-pill ${filterSkill === s ? 'active' : ''}`}
              onClick={() => setFilterSkill(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Results count ────────────────────────────────────────── */}
      {!loading && mentors.length > 0 && (
        <p className="mh-count">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found</p>
      )}

      {/* ── Skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="mh-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="mh-skeleton" />)}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="mh-error">
          <span>⚠️ {error}</span>
          <button onClick={fetchMentors}>Retry</button>
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────── */}
      {!loading && !error && mentors.length === 0 && (
        <div className="mh-empty">
          <div className="mh-empty-icon">🎓</div>
          <h3>No mentors found</h3>
          <p>{searchQuery || filterSkill !== 'All' ? 'Try adjusting your filters.' : 'Check back soon!'}</p>
          {(searchQuery || filterSkill !== 'All') && (
            <button className="mh-reset-btn" onClick={() => { setSearchQuery(''); setFilterSkill('All'); }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── Mentor Grid ──────────────────────────────────────────── */}
      {!loading && !error && mentors.length > 0 && (
        <div className="mh-grid">
          {mentors.map((mentor, idx) => (
            <div key={mentor._id} style={{ animationDelay: `${idx * 0.05}s`, animation: 'mhFadeUp 0.5s ease both' }}>
              <MentorCard mentor={mentor} onChat={() => openChat(mentor)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Inline Chat Drawer ───────────────────────────────────── */}
      {chatMentor && (
        <div className="mh-chat-overlay" onClick={() => setChatMentor(null)}>
          <div className="mh-chat-drawer" onClick={e => e.stopPropagation()}>

            {/* Chat Header */}
            <div className="mh-chat-header">
              <div className="mh-chat-avatar">
                {chatMentor.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="mh-chat-name">{chatMentor.name}</div>
                <div className="mh-chat-subtitle">{chatMentor.company} · {chatMentor.role}</div>
              </div>
              <button className="mh-chat-close" onClick={() => setChatMentor(null)}><FiX /></button>
            </div>

            {/* Messages */}
            <div className="mh-chat-messages">
              {msgLoading && (
                <div className="mh-msg-loading">
                  <div className="mh-msg-spinner" /> Loading messages...
                </div>
              )}
              {!msgLoading && messages.length === 0 && (
                <div className="mh-chat-empty">
                  <FiMessageCircle size={36} />
                  <p>Start a conversation with {chatMentor.name}!</p>
                  <span>Ask about their experience, interview tips, or anything you'd like to know.</span>
                </div>
              )}
              {!msgLoading && messages.map((msg, i) => {
                const isMe = msg.sender === 'student';
                return (
                  <div key={msg._id || i} className={`mh-msg ${isMe ? 'mh-msg-mine' : 'mh-msg-theirs'}`}>
                    <div className="mh-msg-bubble">{msg.content}</div>
                    <div className="mh-msg-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form className="mh-chat-input-row" onSubmit={sendMsg}>
              <input
                className="mh-chat-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={`Message ${chatMentor.name}...`}
                autoFocus
              />
              <button type="submit" className="mh-chat-send" disabled={!draft.trim() || sending}>
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipHub;