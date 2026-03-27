import React, { useState } from 'react';
import { Award, Briefcase, Users, Star, CheckCircle } from 'lucide-react';
import { mentorApi } from '../../services/mentorApi';
import './BecameMentor.css';

const BecameMentor = () => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    salary: '',
    skills: [],
    bio: '',
    availability: 'Available',
    specializations: [],
    yearsOfExperience: 1,
    companyLink: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentSpec, setCurrentSpec] = useState('');
  const [alreadyMentor, setAlreadyMentor] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if they are already a mentor on mount
  React.useEffect(() => {
    mentorApi.checkIfMentor().then(isMentor => {
      if (isMentor) {
        setAlreadyMentor(true);
      }
      setCheckingStatus(false);
    }).catch(() => setCheckingStatus(false));
  }, []);

  const allSkills = [
    'DSA', 'System Design', 'Web Development', 'Python', 'Java',
    'C++', 'JavaScript', 'React', 'Node.js', 'SQL', 'AWS',
    'DevOps', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
    'Product Management', 'Data Science', 'Machine Learning',
    'Android', 'iOS', 'UI/UX Design', 'MERN', 'Full Stack'
  ];

  const specializations = [
    'Interview Preparation', 'Resume Review', 'Company Process',
    'Career Guidance', 'Technical Mentoring', 'Behavioral Interview',
    'Coding Practice', 'System Design', 'HR Round Tips'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSkill = () => {
    if (currentSkill && !formData.skills.includes(currentSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addSpecialization = () => {
    if (currentSpec && !formData.specializations.includes(currentSpec)) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, currentSpec]
      }));
      setCurrentSpec('');
    }
  };

  const removeSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.role || !formData.salary) {
      setError('Please fill all required fields');
      return;
    }

    if (formData.skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await mentorApi.registerAsMentor({
        ...formData,
        salary: parseInt(formData.salary)
      });

      setSuccess(true);
      
      // Redirect to mentor profile after 2 seconds
      setTimeout(() => {
        window.location.href = '/student/mentorship';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register as mentor');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return <div className="became-mentor" style={{ textAlign:'center', padding:'100px', color:'white' }}>Loading...</div>;
  }

  if (alreadyMentor) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle size={60} className="success-icon" />
          <h1>You're Already a Mentor!</h1>
          <p>You have already registered your mentor profile.</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => window.location.href = '/student/mentorship'} className="submit-btn" style={{width:'auto'}}>Go to Hub</button>
            <button onClick={() => window.location.href = '/student/mentor-inbox'} className="submit-btn" style={{width:'auto', background:'transparent', border:'1px solid white'}}>Mentor Inbox</button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle size={60} className="success-icon" />
          <h1>🎉 Welcome to the Mentor Community!</h1>
          <p>Your profile has been created successfully.</p>
          <p className="subtitle">Redirecting to your mentorship hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="became-mentor">
      {/* Header */}
      <div className="mentor-header-section">
        <div className="header-content">
          <Award size={40} className="header-icon" />
          <h1>Join Our Mentor Network 🚀</h1>
          <p>Help unplaced students succeed by sharing your placement journey</p>
        </div>
      </div>

      <div className="mentor-container">
        {/* Benefits Section */}
        <div className="benefits-section">
          <h2>Why Become a Mentor?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <Users size={32} />
              <h3>Help Others</h3>
              <p>Guide students through interview prep & placement process</p>
            </div>
            <div className="benefit-card">
              <Star size={32} />
              <h3>Build Reputation</h3>
              <p>Get ratings & reviews from students you've helped</p>
            </div>
            <div className="benefit-card">
              <Briefcase size={32} />
              <h3>Grow Network</h3>
              <p>Connect with talented students from your campus</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form className="mentor-form" onSubmit={handleSubmit}>
          <h2>Your Placement Details</h2>

          {error && <div className="error-message">{error}</div>}

          {/* Company & Role */}
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g., Google, Microsoft, Amazon"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Position/Role *</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g., Software Engineer, Product Manager"
                required
              />
            </div>

            <div className="form-group">
              <label>Salary (CTC) *</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g., 1200000"
                required
              />
            </div>
          </div>

          {/* Years of Experience */}
          <div className="form-group">
            <label>Years of Experience</label>
            <select
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
            >
              <option value="0">Fresher</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="4">4+ Years</option>
            </select>
          </div>

          {/* Bio */}
          <div className="form-group">
            <label>About You (Bio)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Share your placement journey, achievements, or tips for students..."
              rows="3"
            />
          </div>

          {/* Skills */}
          <div className="form-group">
            <label>Skills You Can Mentor On *</label>
            <div className="skill-input">
              <select value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)}>
                <option value="">Select a skill</option>
                {allSkills.map(skill => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addSkill} className="add-btn">
                Add Skill
              </button>
            </div>
            <div className="tags">
              {formData.skills.map(skill => (
                <div key={skill} className="tag">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="remove-tag"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div className="form-group">
            <label>Your Specializations</label>
            <div className="skill-input">
              <select value={currentSpec} onChange={(e) => setCurrentSpec(e.target.value)}>
                <option value="">Select specialization</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addSpecialization} className="add-btn">
                Add
              </button>
            </div>
            <div className="tags">
              {formData.specializations.map(spec => (
                <div key={spec} className="tag spec-tag">
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeSpecialization(spec)}
                    className="remove-tag"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="form-group">
            <label>Availability</label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Creating Profile...' : 'Become a Mentor 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecameMentor;