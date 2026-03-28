import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Messenger.css';
import { FiSend, FiMessageSquare, FiTrash2 } from 'react-icons/fi';

const Messenger = () => {
  const { user } = useAuth();
  const [inboxGroups, setInboxGroups] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myMentorId, setMyMentorId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Real-time polling reference
  const pollingRef = useRef(null);

  const fetchInbox = async () => {
    try {
      // Fetch the student inbox (where user is the student)
      const userId = user._id || user.id;
      const studentRes = await api.get(`/mentor-messages/student-inbox/${userId}`);
      let combined = studentRes.data.map(item => ({
        contactId: item.mentorId,
        contactName: item.mentorName,
        latestMessage: { content: item.lastMessage, createdAt: item.lastMessageTime },
        type: 'mentor' // I am talking to a mentor
      }));

      // Check if user is also a mentor, fetch their mentor inbox
      const statusRes = await api.get('/mentor/check-status');
      if (statusRes.data.isMentor && statusRes.data.mentor && statusRes.data.mentor._id) {
        setMyMentorId(statusRes.data.mentor._id);
        const mentorRes = await api.get(`/mentor-messages/inbox/${statusRes.data.mentor._id}`);
        const mentorGroups = mentorRes.data.map(item => ({
          contactId: item.studentId,
          contactName: item.studentName,
          latestMessage: { content: item.lastMessage, createdAt: item.lastMessageTime },
          type: 'student' // I am talking to my student
        }));
        combined = [...combined, ...mentorGroups];
      }

      // Sort by latest message
      combined.sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));
      setInboxGroups(combined);
    } catch (error) {
      console.error('Failed to load combined inbox', error);
    }
  };

  const fetchActiveThread = async (contact) => {
    if (!contact) return;
    try {
      // Determine correct mentor/student IDs based on the thread type
      const userId = user._id || user.id;
      const mentorIdToFetch = contact.type === 'mentor' ? contact.contactId : myMentorId;
      const studentIdToFetch = contact.type === 'student' ? contact.contactId : userId;

      const res = await api.get(`/mentor-messages/thread/${mentorIdToFetch}/${studentIdToFetch}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load thread', error);
    }
  };

  useEffect(() => {
    fetchInbox();
    // Start polling the inbox every 10 seconds
    const inboxInterval = setInterval(fetchInbox, 10000);
    return () => clearInterval(inboxInterval);
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchActiveThread(activeThread);
      // Start polling the active thread
      pollingRef.current = setInterval(() => {
        fetchActiveThread(activeThread);
      }, 5000);
    }
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeThread]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    try {
      setNewMessage('');
      if (activeThread.type === 'mentor') {
        // User is a student sending to their mentor
        await api.post('/mentor-messages/send', {
          mentorId: activeThread.contactId,
          content: newMessage
        });
      } else {
        // User is a mentor replying to their student
        await api.post('/mentor-messages/mentor-response', {
          studentId: activeThread.contactId,
          mentorId: myMentorId,
          content: newMessage
        });
      }
      
      // Optimitscally update UI then trigger refresh
      const userId = user._id || user.id;
      const optimisticMsg = {
        _id: Math.random().toString(),
        sender: activeThread.type === 'student' ? 'mentor' : userId, // Display hack
        senderType: activeThread.type === 'student' ? 'mentor' : 'student',
        content: newMessage,
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, optimisticMsg]);
      fetchInbox();
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await api.delete(`/mentor-messages/${msgId}`);
      setMessages(messages.map(m => m._id === msgId ? { ...m, isDeleted: true, content: '[Message deleted]' } : m));
    } catch (err) {
      console.error(err);
      alert('Failed to delete message');
    }
  };

  return (
    <div className="messenger-page">
      {/* LEFT PANE: Contact List */}
      <div className="messenger-sidebar">
        <div className="messenger-sidebar-header">
          <h2><FiMessageSquare /> My Connections</h2>
        </div>
        
        <div className="messenger-list">
          {inboxGroups.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8696a0', marginTop: '40px' }}>
              No active conversations. Use the AI Mentor Matchmaker to find a mentor!
            </p>
          ) : (
            inboxGroups.map((group) => (
              <div 
                key={group.contactId} 
                className={`messenger-item ${activeThread?.contactId === group.contactId ? 'active' : ''}`}
                onClick={() => setActiveThread(group)}
              >
                <div className="messenger-avatar">
                  {group.contactName?.charAt(0) || '?'}
                </div>
                <div className="messenger-preview">
                  <h4>
                    {group.contactName} 
                    <span>{new Date(group.latestMessage.createdAt).toLocaleDateString()}</span>
                  </h4>
                  <p>{group.latestMessage.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: Chat View */}
      <div className="messenger-chat-area">
        {!activeThread ? (
          <div className="chat-empty-state">
            <FiMessageSquare size={80} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <h3>Unified Mentorship Messenger</h3>
            <p>Select a conversation from the sidebar to start securely communicating.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="messenger-avatar" style={{ marginRight: '16px', width: '40px', height: '40px' }}>
                {activeThread.contactName?.charAt(0) || '?'}
              </div>
              <div className="chat-header-info">
                <h3>{activeThread.contactName}</h3>
                <p>Private end-to-end connection</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => {
                const userId = user._id || user.id;
                const isSentByMe = 
                  (activeThread.type === 'mentor' && msg.sender === 'student') || 
                  (activeThread.type === 'student' && msg.sender === 'mentor') || msg.sender === userId;

                return (
                  <div key={msg._id} className={`message-bubble ${isSentByMe ? 'sent' : 'received'} ${msg.isDeleted ? 'deleted-msg' : ''}`}>
                    <div className="msg-content">
                      {msg.isDeleted ? <span style={{fontStyle: 'italic', opacity: 0.7}}>🚫 This message was deleted</span> : msg.content}
                    </div>
                    
                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isSentByMe && !msg.isDeleted && (
                      <button 
                        className="del-msg-btn"
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete for everyone"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit">
                <FiSend size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messenger;
