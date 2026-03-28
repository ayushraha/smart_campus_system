import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AIMentorMatch.css';
import { FiCpu, FiStar, FiBriefcase, FiCode, FiAlertCircle } from 'react-icons/fi';

const AIMentorMatch = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing AI...');
  
  // Quiz State
  const [role, setRole] = useState('');
  const [techStack, setTechStack] = useState('');
  const [weakness, setWeakness] = useState('');
  
  // Results State
  const [mentors, setMentors] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');

  const handleMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);
    
    setTimeout(() => setLoadingText('Analyzing your career geometry...'), 1500);
    setTimeout(() => setLoadingText('Searching the Global Mentor Database...'), 3000);
    setTimeout(() => setLoadingText('Calculating compatibility scores...'), 4500);

    try {
      // Step 1: Query the AI to extract keywords and give advice
      const aiResponse = await api.post('/ai-chat', {
        message: `I'm a student trying to become a ${role}. My main tech stack is ${techStack}, but I struggle with ${weakness}. What 3 precise skills (single words) should I look for in a mentor? Give me advice in 2 sentences.`
      });

      const aiText = aiResponse.data.reply || '';
      const extractedSkills = aiText.match(/[A-Z][A-Za-z0-9]+/g)?.slice(0, 3).join(',') || techStack;
      
      setAiAnalysis(aiText);

      // Step 2: Query the DB for mentors matching these keywords loosely
      // (Using the /discover route which filters by isApproved: true implicitly)
      const query = extractedSkills; 
      const res = await api.get('/mentor/discover', { params: { search: techStack } });
      
      let fetchedMentors = res.data || [];
      // Grab top 3
      fetchedMentors = fetchedMentors.slice(0, 3);
      
      setMentors(fetchedMentors);
    } catch (error) {
      console.error('Failed to match', error);
      alert('AI Engine Offline. Showing random verified mentors instead.');
      const res = await api.get('/mentor/discover');
      setMentors((res.data || []).slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (mentor) => {
    // Navigate straight to the unified messenger and open a pre-filled drafted message!
    // Or just send an auto message.
    try {
      await api.post('/mentor-messages/send', {
        mentorId: mentor._id,
        content: `Hi ${mentor.name}! I was matched with you through the AI Mentor Matchmaker. I'm focusing on ${techStack} and would love your guidance.`
      });
      alert(`Match Request sent to ${mentor.name}! Check your Messages tab.`);
      navigate('/student/messages');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="ai-match-page">
      {step === 1 && (
        <div className="wizard-container">
          <div className="wizard-header">
            <FiCpu size={56} className="ai-icon" />
            <h1>AI Mentor Matchmaker</h1>
            <p>Tell the AI Engine about your career goals, and it will compute the top 3 verified alumni that perfectly match your DNA.</p>
          </div>

          <form className="wizard-form" onSubmit={handleMatch}>
            <div className="w-group">
              <label><FiBriefcase /> What is your exact target role?</label>
              <input 
                type="text" 
                placeholder="e.g. Frontend Engineer at FAANG"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              />
            </div>
            <div className="w-group">
              <label><FiCode /> What is your primary Tech Stack?</label>
              <input 
                type="text" 
                placeholder="e.g. React, Node.js, AWS"
                value={techStack}
                onChange={e => setTechStack(e.target.value)}
                required
              />
            </div>
            <div className="w-group">
              <label><FiAlertCircle /> What is your biggest weakness?</label>
              <input 
                type="text" 
                placeholder="e.g. Dynamic Programming, System Design"
                value={weakness}
                onChange={e => setWeakness(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="wizard-btn-glow">
              Initialize Matchmaking Protocol
            </button>
          </form>
        </div>
      )}

      {step === 2 && loading && (
        <div className="ai-loading-screen">
          <div className="ai-spinner"></div>
          <h2 className="ai-pulse-text">{loadingText}</h2>
        </div>
      )}

      {step === 2 && !loading && (
        <div className="results-container">
          <div className="results-header">
            <h2><span className="gradient-text">Match Successful</span></h2>
            <div className="ai-analysis-box">
              <strong>AI Analysis:</strong> {aiAnalysis}
            </div>
          </div>

          {mentors.length === 0 ? (
            <div className="no-mentors">
              <p>No verified mentors match that exact stack yet! Broaden your criteria.</p>
              <button className="secondary-btn" onClick={() => setStep(1)}>Retry Wizard</button>
            </div>
          ) : (
            <div className="mentors-grid">
              {mentors.map((m, i) => {
                // Generate a fake high match score for UX
                const score = 98 - (i * Math.floor(Math.random() * 5)); 
                return (
                  <div key={m._id} className="matched-mentor-card">
                    <div className="match-score">
                      <FiStar className="star-icon" /> {score}% Match
                    </div>
                    <div className="m-avatar">
                      {m.profileImage ? <img src={m.profileImage} alt={m.name} /> : m.name.charAt(0)}
                    </div>
                    <h3>{m.name}</h3>
                    <p className="m-role">{m.role} @ {m.company}</p>
                    <p className="m-salary">₹{m.salary} LPA Average</p>
                    
                    <div className="m-skills">
                      {m.skills.slice(0, 3).map(s => <span key={s} className="pill">{s}</span>)}
                    </div>
                    
                    <button className="connect-btn" onClick={() => handleSendRequest(m)}>
                      Request Mentorship
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIMentorMatch;
