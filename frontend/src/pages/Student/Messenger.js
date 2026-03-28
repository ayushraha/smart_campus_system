import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageCircle, FiSearch, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Messenger.css';

const Messenger = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [replyText, setReplyText]         = useState('');
  const [loading, setLoading]             = useState(true);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [sending, setSending]             = useState(false);
  const [mentorProfile, setMentorProfile] = useState(null);
  const chatEndRef                        = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load all conversations (unified)
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      let allConvs = [];

      // 1. Fetch chats where I am the STUDENT messaging a MENTOR
      try {
        const res = await api.get(`/mentor-messages/student-inbox/${user._id}`);
        const out = (res.data || []).map(c => ({
          id: c.mentorId,
          name: c.mentorName,
          role: 'Mentor',
          sub: c.mentorRole ? `${c.mentorRole} @ ${c.mentorCompany}` : c.mentorCompany,
          lastMessage: c.lastMessage,
          time: c.lastMessageTime,
          unread: c.unread,
          isMentorChat: false // The OTHER person is a Mentor
        }));
        allConvs = [...allConvs, ...out];
      } catch (err) { console.error('Error fetching student inbox', err); }

      // 2. Fetch chats where I am the MENTOR being messaged by a STUDENT
      try {
        const mStatus = await api.get('/mentor/check-status');
        if (mStatus.data?.isMentor) {
          const profile = mStatus.data.mentor;
          setMentorProfile(profile);
          const res = await api.get(`/mentor-messages/inbox/${profile._id}`);
          const out = (res.data || []).map(c => ({
            id: c.studentId,
            name: c.studentName,
            role: 'Student',
            sub: c.studentEmail,
            lastMessage: c.lastMessage,
            time: c.lastMessageTime,
            unread: c.unread,
            isMentorChat: true // The OTHER person is a Student
          }));
          allConvs = [...allConvs, ...out];
        }
      } catch (err) { console.error('Error fetching mentor inbox', err); }

      // Sort globally by newest message
      allConvs.sort((a, b) => new Date(b.time) - new Date(a.time));
      setConversations(allConvs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Handle polling for new messages (simulate WhatsApp real-time)
  useEffect(() => {
    const interval = setInterval(() => {
      // Background silent refresh of conversations
      fetchConversations();
      // If a chat is open, refresh the messages silently
      if (selected) {
        refreshActiveThread(selected);
      }
    }, 10000); // 10 seconds polling
    return () => clearInterval(interval);
  }, [selected, fetchConversations]);

  const refreshActiveThread = async (conv) => {
    try {
      let res;
      if (conv.isMentorChat) {
        // I am the Mentor, THEY are the Student
        res = await api.get(`/mentor-messages/thread/${mentorProfile._id}/${conv.id}`);
      } else {
        // I am the Student, THEY are the Mentor
        res = await api.get(`/mentor-messages/thread/${conv.id}/${user._id}`);
      }
      setMessages(res.data || []);
    } catch { /* ignore silent failure */ }
  };

  const openThread = async (conv) => {
    setSelected(conv);
    setMsgLoading(true);
    await refreshActiveThread(conv);
    setMsgLoading(false);
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected || sending) return;
    const text = replyText.trim();
    setReplyText('');
    setSending(true);

    // Optimistically push message
    const myRole = selected.isMentorChat ? 'mentor' : 'student';
    setMessages(prev => [...prev, { _id: Date.now(), sender: myRole, content: text, createdAt: new Date() }]);

    try {
      if (selected.isMentorChat) {
        // As a mentor replying
        await api.post('/mentor-messages/mentor-response', {
          studentId: selected.id,
          mentorId: mentorProfile._id,
          content: text
        });
      } else {
        // As a student messaging
        await api.post('/mentor-messages/send', {
          mentorId: selected.id,
          content: text
        });
      }
      // Refresh the conv list silently to update "lastMessage"
      fetchConversations();
    } catch (err) {
      console.error('Failed to send', err);
    }
    setSending(false);
  };

  const formatTimeStr = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDateStr = (d) => {
    const date = new Date(d);
    if (!date || isNaN(date)) return '';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return formatTimeStr(date);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConvs = conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="wa-root">
      <div className="wa-container">
        
        {/* ── LEFT PANE: Chat List ──────────────────────────────── */}
        <div className="wa-sidebar">
          <div className="wa-header">
            <h2 className="wa-title">Messages</h2>
            <div className="wa-icons"><FiMoreVertical /></div>
          </div>
          
          <div className="wa-search-bg">
            <div className="wa-search">
              <FiSearch className="wa-search-icon" />
              <input 
                type="text" 
                placeholder="Search or start new chat" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="wa-conv-list">
            {loading && conversations.length === 0 && (
              <div className="wa-status">Loading chats...</div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="wa-status">No conversations yet.<br/>Go to Mentorship Hub to connect!</div>
            )}
            {filteredConvs.map(conv => (
              <div 
                key={`${conv.role}-${conv.id}`} 
                className={`wa-conv-item ${selected?.id === conv.id ? 'active' : ''}`}
                onClick={() => openThread(conv)}
              >
                <div className="wa-avatar">
                  {conv.name.charAt(0).toUpperCase()}
                  {/* Small badge to denote if speaking to a student or mentor */}
                  <span className={`wa-role-badge ${conv.role.toLowerCase()}`} title={conv.role}>
                    {conv.role.charAt(0)}
                  </span>
                </div>
                <div className="wa-conv-info">
                  <div className="wa-conv-top">
                    <span className="wa-conv-name">{conv.name}</span>
                    <span className="wa-conv-time">{formatDateStr(conv.time)}</span>
                  </div>
                  <div className="wa-conv-bottom">
                    <span className="wa-conv-preview">
                      {conv.lastMessage}
                    </span>
                    {conv.unread > 0 && <span className="wa-unread">{conv.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANE: Chat Window ────────────────────────────── */}
        <div className="wa-chat">
          {!selected ? (
            <div className="wa-empty-chat">
              <div className="wa-empty-art">
                <FiMessageCircle size={72} />
              </div>
              <h2>Mentorship Messenger</h2>
              <p>Send and receive messages without keeping your phone online.</p>
              <p className="wa-encryption">🔒 End-to-end encrypted career advice</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="wa-header">
                <div className="wa-avatar">{selected.name.charAt(0).toUpperCase()}</div>
                <div className="wa-chat-title-info">
                  <h3>{selected.name}</h3>
                  <p>{selected.sub}</p>
                </div>
                <div className="wa-icons"><FiSearch /><FiMoreVertical /></div>
              </div>

              {/* Messages Area */}
              <div className="wa-messages-bg">
                {msgLoading && <div className="wa-status" style={{marginTop:'20px'}}>Loading messages...</div>}
                
                {/* Notice Bubble */}
                {!msgLoading && messages.length > 0 && (
                  <div className="wa-system-msg">
                    Messages are secured. Be polite and professional.
                  </div>
                )}

                {!msgLoading && messages.map((msg, i) => {
                  const myRole = selected.isMentorChat ? 'mentor' : 'student';
                  const isMe = msg.sender === myRole;
                  return (
                    <div key={msg._id || i} className={`wa-bubble-row ${isMe ? 'mine' : 'theirs'}`}>
                      <div className={`wa-bubble ${isMe ? 'mine' : 'theirs'}`}>
                        <div className="wa-bubble-text">{msg.content}</div>
                        <div className="wa-bubble-time">{formatTimeStr(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form className="wa-input-area" onSubmit={sendMsg}>
                <input
                  type="text"
                  placeholder="Type a message"
                  className="wa-input"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  disabled={msgLoading || sending}
                />
                <button type="submit" className="wa-send-btn" disabled={!replyText.trim() || sending}>
                  <FiSend />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;
