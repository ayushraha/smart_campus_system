// ================================================================
// frontend/src/pages/Student/MentorInbox.js
// Dashboard for mentors to see student messages and reply
// ================================================================

import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mentorApi } from '../../services/mentorApi';
import './MentorInbox.css';

const MentorInbox = () => {
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // On load, get mentor info and messages
  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      // Get current user's mentor profile
      const mentorData = await mentorApi.getMentorProfile(user?.mentorId);
      setMentor(mentorData);

      // TODO: Fetch all conversations for this mentor
      // This requires a new backend endpoint
      await fetchConversations();
    } catch (error) {
      console.error('Error fetching mentor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      // This would be a new API endpoint
      // GET /api/mentor/:mentorId/conversations
      // Returns all unique students who messaged this mentor
      // With their latest message
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSelectConversation = async (studentId) => {
    setSelectedStudentId(studentId);
    try {
      // Fetch all messages with this student
      const messages = await mentorApi.getMessages(mentor._id, studentId);
      setSelectedMessages(messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedStudentId) return;

    setSending(true);
    try {
      // Send mentor response
      await mentorApi.sendMentorResponse(
        selectedStudentId,
        mentor._id,
        replyText
      );

      // Reload conversation
      await handleSelectConversation(selectedStudentId);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="mentor-inbox"><p>Loading...</p></div>;
  }

  return (
    <div className="mentor-inbox">
      {/* Header */}
      <div className="inbox-header">
        <h1>
          <Mail size={28} />
          Mentor Inbox
        </h1>
        <p>Messages from students</p>
      </div>

      <div className="inbox-container">
        {/* Conversations List */}
        <div className="conversations-panel">
          <h2>Conversations</h2>
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>No messages yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.studentId}
                className={`conversation-item ${
                  selectedStudentId === conv.studentId ? 'active' : ''
                }`}
                onClick={() => handleSelectConversation(conv.studentId)}
              >
                <div className="conv-avatar">{conv.studentName.charAt(0)}</div>
                <div className="conv-content">
                  <h4>{conv.studentName}</h4>
                  <p className="conv-preview">{conv.lastMessage}</p>
                </div>
                <div className="conv-time">{conv.lastMessageTime}</div>
              </div>
            ))
          )}
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          {selectedStudentId ? (
            <>
              {/* Messages */}
              <div className="messages-list">
                {selectedMessages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  selectedMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message-item ${msg.sender}`}
                    >
                      <div className="msg-sender">
                        {msg.sender === 'student' ? 'Student' : 'You'}
                      </div>
                      <div className="msg-body">{msg.content}</div>
                      <div className="msg-time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Area */}
              <div className="reply-area">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows="3"
                  disabled={sending}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="btn-send-reply"
                >
                  <Send size={20} />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <AlertCircle size={48} />
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorInbox;