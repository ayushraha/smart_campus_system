import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Messenger.css';
import { FiSend, FiMessageSquare } from 'react-icons/fi';

const Messenger = () => {
  const { user } = useAuth();
  const [inboxGroups, setInboxGroups] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Real-time polling reference
  const pollingRef = useRef(null);

  // Fetch conversation groups
  const fetchInbox = async () => {
    try {
      const res = await api.get(`/mentor-messages/inbox/${user.id}`);
      setInboxGroups(res.data);
    } catch (error) {
      console.error('Failed to load inbox', error);
    }
  };

  const fetchActiveThread = async (contactId) => {
    if (!contactId) return;
    try {
      // The endpoint is designed to figure out if it's student-to-mentor or mentor-to-student 
      // based on who is querying.
      const res = await api.get(`/mentor-messages/thread/${contactId}/${user.id}`);
      // The API returns thread messages
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
      fetchActiveThread(activeThread.contactId);
      // Start polling the active thread
      pollingRef.current = setInterval(() => {
        fetchActiveThread(activeThread.contactId);
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
      const payload = {
        mentorId: activeThread.contactId, // Handles both directions via API logic
        content: newMessage
      };
      
      const res = await api.post('/mentor-messages/send', payload);
      setMessages([...messages, res.data.message]);
      fetchInbox(); // Refresh sidebar to move thread up
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
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
                const isSentByMe = msg.sender.toString() === user.id.toString();
                return (
                  <div key={msg._id} className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                    {msg.content}
                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
