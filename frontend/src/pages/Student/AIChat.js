import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AIChat.css';
import { MessageCircle, Send, Trash2, Plus, Loader } from 'lucide-react';

const AIChat = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await axios.get(`${API_URL}/ai-chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load specific conversation
  const loadConversation = async (conversationId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/ai-chat/conversation/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentConversation(response.data.chat);
      setMessages(response.data.chat.messages || []);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      sender: 'user',
      message: userMessage,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      console.log('📤 Sending message:', userMessage);
      console.log('🔗 API URL:', API_URL);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');

      const response = await axios.post(
        `${API_URL}/ai-chat/send-message`,
        {
          message: userMessage,
          conversationId: currentConversation?.conversationId,
          topic: currentConversation?.topic || 'general'
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Response received:', response.data);

      // Update messages with AI response
      if (response.data.success) {
        setMessages(response.data.messages);
        setCurrentConversation(prev => ({
          ...prev,
          conversationId: response.data.conversationId
        }));
        
        // Refresh conversations list
        fetchConversations();
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data?.error || error.response.data?.message);
      } else if (error.request) {
        console.error('No response from server - backend may not be running');
      } else {
        console.error('Error:', error.message);
      }
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: `❌ Error: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send message'}`,
        timestamp: new Date(),
        type: 'text'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setInputMessage('');
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    try {
      await axios.delete(
        `${API_URL}/ai-chat/conversation/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (currentConversation?.conversationId === conversationId) {
        handleNewConversation();
      }
      
      fetchConversations();
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
    }
  };

  // Generate interview questions - FIXED
  const handleGenerateQuestions = async () => {
    const jobTitle = prompt('Enter job title (e.g., Software Engineer):');
    
    if (!jobTitle || jobTitle.trim() === '') {
      alert('Job title is required');
      return;
    }

    const skillsInput = prompt('Enter skills (comma-separated, e.g., JavaScript, React, Node.js):');
    
    if (!skillsInput || skillsInput.trim() === '') {
      alert('Skills are required');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Generating questions for:', jobTitle);
      
      const response = await axios.post(
        `${API_URL}/ai-chat/generate-questions`,
        {
          jobTitle: jobTitle.trim(),
          skills: skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Questions generated:', response.data);

      const aiMessage = {
        sender: 'ai',
        message: response.data.questions,
        timestamp: new Date(),
        type: 'interview_prep'
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        alert('Error: ' + (error.response.data?.error || error.response.data?.message || 'Failed to generate questions'));
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Analyze resume - FIXED
  const handleAnalyzeResume = async () => {
    const resumeText = prompt('Paste your resume content or summary:');
    
    if (!resumeText || resumeText.trim() === '') {
      alert('Resume content is required');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Analyzing resume...');
      
      const response = await axios.post(
        `${API_URL}/ai-chat/analyze-resume`,
        { 
          resumeText: resumeText.trim() 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Resume analyzed:', response.data);

      const aiMessage = {
        sender: 'ai',
        message: response.data.analysis,
        timestamp: new Date(),
        type: 'resume_advice'
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('❌ Error analyzing resume:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        alert('Error: ' + (error.response.data?.error || error.response.data?.message || 'Failed to analyze resume'));
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick action suggestions
  const quickActions = [
    { label: 'Interview Prep', action: handleGenerateQuestions },
    { label: 'Resume Tips', action: handleAnalyzeResume },
    { label: 'New Chat', action: handleNewConversation }
  ];

  return (
    <div className="ai-chat-container">
      {/* Sidebar */}
      <div className={`ai-chat-sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>
            <MessageCircle size={20} /> Chats
          </h2>
          <button className="new-chat-btn" onClick={handleNewConversation} title="New Chat">
            <Plus size={20} />
          </button>
        </div>

        <div className="conversations-list">
          {loadingConversations ? (
            <div className="loading-state">
              <Loader size={20} className="spinner" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
              <small>Start a new chat to begin</small>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.conversationId}
                className={`conversation-item ${
                  currentConversation?.conversationId === conv.conversationId ? 'active' : ''
                }`}
              >
                <div
                  className="conv-content"
                  onClick={() => loadConversation(conv.conversationId)}
                >
                  <p className="conv-title">{conv.title}</p>
                  <small className="conv-topic">{conv.topic}</small>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.conversationId);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        className="toggle-sidebar-btn"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? '◄' : '►'}
      </button>

      {/* Main Chat Area */}
      <div className="ai-chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <h1>
              <MessageCircle size={24} /> AI Career Assistant
            </h1>
            <p>Get help with interviews, resume, and job search</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.length === 0 && !currentConversation ? (
            <div className="welcome-message">
              <MessageCircle size={48} />
              <h2>Welcome to AI Career Assistant</h2>
              <p>Ask me anything about:</p>
              <ul>
                <li>💼 Interview preparation and tips</li>
                <li>📄 Resume building and optimization</li>
                <li>🔍 Job search strategies</li>
                <li>🎯 Career guidance</li>
                <li>❓ Technical and behavioral questions</li>
              </ul>
              
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="action-btn"
                      onClick={action.action}
                      disabled={loading}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  <div className="message-avatar">
                    {msg.sender === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <p className="message-text">{msg.message}</p>
                    <small className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message ai loading">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              className="message-input"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="send-btn"
            >
              {loading ? <Loader size={20} className="spinner" /> : <Send size={20} />}
            </button>
          </div>
          <small className="input-hint">
            💡 Tip: Ask about interviews, resume tips, job search, or anything career-related!
          </small>
        </form>
      </div>
    </div>
  );
};

export default AIChat;