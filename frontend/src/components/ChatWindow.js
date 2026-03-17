import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Phone, Clock, User, Loader } from 'lucide-react';
import { mentorApi } from '../services/mentorApi';

const ChatWindow = ({ mentor, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    if (mentor && mentor._id) {
      fetchMessages();
      // Poll for new messages every 2 seconds
      pollIntervalRef.current = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [mentor._id]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch REAL messages from database
  const fetchMessages = async () => {
    try {
      const data = await mentorApi.getMessages(mentor._id);
      setMessages(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  // Send REAL message to database
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    setSending(true);

    try {
      // Send message to database
      const newMessage = await mentorApi.sendMessage(mentor._id, messageInput, 'text');

      // Add to local state immediately
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button onClick={onClose} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        
        <div className="header-info">
          <div className="mentor-info">
            <div className="avatar-small">{mentor.profileImage || '👤'}</div>
            <div>
              <h3>{mentor.name}</h3>
              <p className="company-info">{mentor.company} • {mentor.role}</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-small">
              <Clock size={16} />
              <span>{mentor.responseTime || 'N/A'}</span>
            </div>
            <button className="call-btn">
              <Phone size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading">
            <Loader size={24} className="spinner" />
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Start a conversation with {mentor.name}</p>
            <p className="empty-subtitle">Ask about placement process, interview prep, or any doubts!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${msg.sender === 'student' ? 'student-msg' : 'mentor-msg'}`}
            >
              {msg.sender === 'mentor' && (
                <div className="message-avatar">{mentor.profileImage || '👤'}</div>
              )}
              
              <div className="message-content">
                <div className={`message-bubble ${msg.sender}`}>
                  {msg.content}
                </div>
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {msg.sender === 'student' && (
                <div className="message-avatar">You</div>
              )}
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your question here... (Press Enter to send)"
          rows="1"
          disabled={sending}
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || sending}
          className="send-btn"
        >
          {sending ? <Loader size={20} className="spinner" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;