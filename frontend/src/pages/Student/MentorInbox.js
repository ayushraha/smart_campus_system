import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMail, FiSend, FiMessageCircle, FiUser, FiX, FiInbox } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './MentorInbox.css';

const MentorInbox = () => {
  const { user } = useAuth();
  const [mentor, setMentor]               = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null); // { studentId, studentName }
  const [messages, setMessages]           = useState([]);
  const [replyText, setReplyText]         = useState('');
  const [loading, setLoading]             = useState(true);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState('');
  const chatEndRef                        = useRef(null);

  // Auto-scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchInboxData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // 1. Get the current user's mentor profile
      const mentorRes = await api.get('/mentor/check-status');
      const mentorProfile = mentorRes.data?.mentor;
      if (!mentorProfile) { setError('You are not registered as a mentor.'); setLoading(false); return; }
      setMentor(mentorProfile);

      // 2. Get all conversations (grouped by student)
      const convRes = await api.get(`/mentor-messages/inbox/${mentorProfile._id}`);
      setConversations(convRes.data || []);
    } catch (err) {
      setError('Could not load inbox. Make sure you are registered as a mentor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInboxData(); }, [fetchInboxData]);

  const openThread = async (conv) => {
    setSelected(conv);
    setMsgLoading(true);
    try {
      const res = await api.get(`/mentor-messages/thread/${mentor._id}/${conv.studentId}`);
      setMessages(res.data || []);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected || sending) return;
    const text = replyText.trim();
    setReplyText('');
    setSending(true);
    // Optimistic
    setMessages(prev => [...prev, { _id: Date.now(), sender: 'mentor', content: text, createdAt: new Date() }]);
    try {
      await api.post('/mentor-messages/mentor-response', {
        studentId: selected.studentId,
        mentorId:  mentor._id,
        content:   text
      });
      // Refresh conversations for updated preview
      const convRes = await api.get(`/mentor-messages/inbox/${mentor._id}`);
      setConversations(convRes.data || []);
    } catch { /* show toast if needed */ }
    setSending(false);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="mi-root mi-loading-page">
        <div className="mi-spinner" />
        <p>Loading your inbox...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mi-root mi-error-page">
        <span className="mi-error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mi-root">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mi-header">
        <div>
          <h1 className="mi-title"><FiInbox /> Mentor Inbox</h1>
          <p className="mi-subtitle">
            {mentor?.name ? `Signed in as ${mentor.name} · ${mentor.company}` : 'Messages from your students'}
          </p>
        </div>
        <div className="mi-badge">{conversations.length} Conversation{conversations.length !== 1 ? 's' : ''}</div>
      </div>

      {/* ── Two-column layout ───────────────────────────────── */}
      <div className="mi-layout">

        {/* Left: Conversations list */}
        <div className="mi-conv-panel">
          <div className="mi-conv-header">
            <FiMessageCircle /> Students
          </div>

          {conversations.length === 0 ? (
            <div className="mi-conv-empty">
              <FiMail size={32} />
              <p>No messages yet</p>
              <span>When students message you, they'll appear here.</span>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.studentId}
                className={`mi-conv-item ${selected?.studentId === conv.studentId ? 'active' : ''}`}
                onClick={() => openThread(conv)}
              >
                <div className="mi-conv-avatar">
                  {conv.studentName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="mi-conv-content">
                  <div className="mi-conv-name">{conv.studentName}</div>
                  <div className="mi-conv-preview">{conv.lastMessage}</div>
                </div>
                <div className="mi-conv-right">
                  <div className="mi-conv-time">{formatDate(conv.lastMessageTime)}</div>
                  {conv.unread > 0 && <div className="mi-unread-badge">{conv.unread}</div>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Thread view */}
        <div className="mi-thread-panel">
          {!selected ? (
            <div className="mi-thread-empty">
              <FiUser size={40} />
              <h3>Select a conversation</h3>
              <p>Choose a student from the left to view their messages and reply.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="mi-thread-header">
                <div className="mi-thread-avatar">{selected.studentName?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div className="mi-thread-name">{selected.studentName}</div>
                  <div className="mi-thread-sub">{selected.studentEmail}</div>
                </div>
                <button className="mi-thread-close" onClick={() => setSelected(null)}><FiX /></button>
              </div>

              {/* Messages */}
              <div className="mi-messages">
                {msgLoading && (
                  <div className="mi-msg-loading">
                    <div className="mi-spinner" /> Loading messages...
                  </div>
                )}
                {!msgLoading && messages.length === 0 && (
                  <div className="mi-thread-empty mi-msg-empty">
                    <p>No messages in this thread yet.</p>
                  </div>
                )}
                {!msgLoading && messages.map((msg, i) => (
                  <div key={msg._id || i} className={`mi-msg ${msg.sender === 'mentor' ? 'mi-msg-mine' : 'mi-msg-theirs'}`}>
                    <div className="mi-msg-label">{msg.sender === 'mentor' ? 'You' : selected.studentName}</div>
                    <div className="mi-msg-bubble">{msg.content}</div>
                    <div className="mi-msg-time">{formatTime(msg.createdAt)}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Reply */}
              <form className="mi-reply-form" onSubmit={sendReply}>
                <textarea
                  className="mi-reply-input"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selected.studentName}...`}
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
                />
                <button type="submit" className="mi-reply-btn" disabled={!replyText.trim() || sending}>
                  <FiSend /> {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorInbox;