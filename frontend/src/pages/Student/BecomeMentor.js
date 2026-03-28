import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './BecomeMentor.css';
import { FiAward, FiCheckCircle, FiClock, FiLinkedin } from 'react-icons/fi';

const BecomeMentor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    salary: '',
    experience: '',
    bio: '',
    skills: '',
    linkedinProfile: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusCheckLoading, setStatusCheckLoading] = useState(true);
  const [mentorStatus, setMentorStatus] = useState(null); // 'none', 'pending', 'approved'

  // On mount, check if they are already a mentor (pending or approved)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/mentor/check-status');
        if (res.data?.isMentor) {
          setMentorStatus(res.data.mentor.approvalStatus || 'approved');
        } else {
          setMentorStatus('none');
        }
      } catch (err) {
        console.error(err);
        setMentorStatus('none');
      } finally {
        setStatusCheckLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert comma-separated string back to array if needed
    const skillArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

    try {
      const res = await api.post('/mentor/register', {
        ...formData,
        skills: skillArray,
        salary: Number(formData.salary)
      });
      // The backend will determine if they are auto-approved based on their placed Application!
      setMentorStatus(res.data.mentor.approvalStatus || 'pending');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register as mentor');
    } finally {
      setLoading(false);
    }
  };

  if (statusCheckLoading) {
    return (
      <div className="mentor-reg-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <p style={{ color: '#8696a0' }}>Loading mentor status...</p>
      </div>
    );
  }

  // --- RENDERING APPROVED STATE ---
  if (mentorStatus === 'approved') {
    return (
      <div className="mentor-reg-page">
        <div className="status-card success-bg">
          <FiCheckCircle size={64} className="status-icon success-color" />
          <h2>You are an Approved Mentor!</h2>
          <p>Your profile is officially live in the AI Mentor Matchmaker. Students matching your tech stack will soon request your guidance.</p>
          <div className="status-actions">
            <button onClick={() => navigate('/student/ai-mentor-match')} className="primary-btn">Go to AIMentor Match</button>
            <button onClick={() => navigate('/student/messages')} className="secondary-btn">Check Messages</button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING PENDING STATE ---
  if (mentorStatus === 'pending') {
    return (
      <div className="mentor-reg-page">
        <div className="status-card pending-bg">
          <FiClock size={64} className="status-icon pending-color" />
          <h2>Application Under Review</h2>
          <p>Since you bypassed the campus placement system, your alumni application is currently under manual review by the Administrators to ensure authenticity.</p>
          <p className="sub-text">Please keep an eye on this page. Approval usually takes 1-2 business days.</p>
        </div>
      </div>
    );
  }

  // --- RENDERING FORM (NONE) ---
  return (
    <div className="mentor-reg-page">
      <div className="mentor-reg-header">
        <FiAward size={48} className="header-icon" />
        <h1>Join the Elite Mentor Network</h1>
        <p>Give back to the campus. Guide juniors to crack top product companies.</p>
        
        <div className="dual-tier-notice">
          <strong>Security Notice:</strong>
          <ul>
            <li>If you secured a job through this portal, your company and role will be <span>auto-verified</span> instantly.</li>
            <li>If you are an alumni placed off-campus, you <span>must</span> provide your LinkedIn URL for manual Admin verification.</li>
          </ul>
        </div>
      </div>

      <form className="mentor-reg-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Current Company (If placed, this may be auto-filled by Admin)</label>
            <input 
              type="text" 
              name="company" 
              value={formData.company} 
              onChange={handleChange} 
              placeholder="e.g. Google, Microsoft" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Job Role</label>
            <input 
              type="text" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              placeholder="e.g. SDE-1, Product Manager" 
              required 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Estimated Salary (LPA)</label>
            <input 
              type="number" 
              name="salary" 
              value={formData.salary} 
              onChange={handleChange} 
              placeholder="e.g. 50" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input 
              type="number" 
              name="experience" 
              value={formData.experience} 
              onChange={handleChange} 
              placeholder="e.g. 2" 
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Top Skills (comma separated)</label>
          <input 
            type="text" 
            name="skills" 
            value={formData.skills} 
            onChange={handleChange} 
            placeholder="e.g. React, Node.js, System Design" 
            required 
          />
        </div>

        <div className="form-group">
          <label><FiLinkedin className="inline-icon" /> LinkedIn Profile URL (Required for Alumni Unplaced on Portal)</label>
          <input 
            type="url" 
            name="linkedinProfile" 
            value={formData.linkedinProfile} 
            onChange={handleChange} 
            placeholder="https://linkedin.com/in/yourprofile" 
          />
        </div>

        <div className="form-group">
          <label>Bio & Mentorship Approach</label>
          <textarea 
            name="bio" 
            rows="4" 
            value={formData.bio} 
            onChange={handleChange} 
            placeholder="Introduce yourself and explain how you can help students crack top tiers..." 
            required 
          />
        </div>

        <button type="submit" className="submit-mentor-btn" disabled={loading}>
          {loading ? 'Submitting Application...' : 'Apply to Become Mentor'}
        </button>
      </form>
    </div>
  );
};

export default BecomeMentor;
