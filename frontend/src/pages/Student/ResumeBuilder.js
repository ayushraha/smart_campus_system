import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiSave, FiDownload, FiEye, FiPlus, FiTrash2, 
  FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import './ResumeBuilder.css';

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { resumeId } = useParams();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [completeness, setCompleteness] = useState(0);

  const [resumeData, setResumeData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      linkedin: '',
      github: '',
      portfolio: '',
      professionalSummary: ''
    },
    education: [],
    experience: [],
    projects: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      tools: []
    },
    certifications: [],
    achievements: [],
    template: 'professional',
    theme: {
      primaryColor: '#667eea',
      fontSize: 'medium'
    }
  });

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      const response = await axios.get(`/api/resume/${resumeId}`);
      setResumeData(response.data);
      checkCompleteness();
    } catch (error) {
      toast.error('Error loading resume');
    }
  };

  const checkCompleteness = async () => {
    if (!resumeId) return;
    
    try {
      const response = await axios.get(`/api/resume/${resumeId}/completeness`);
      setCompleteness(response.data.completeness);
    } catch (error) {
      console.error('Error checking completeness:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (resumeId) {
        await axios.put(`/api/resume/${resumeId}`, resumeData);
        toast.success('Resume updated successfully');
      } else {
        const response = await axios.post('/api/resume', resumeData);
        toast.success('Resume created successfully');
        navigate(`/student/resume/${response.data.resume._id}`);
      }
      checkCompleteness();
    } catch (error) {
      toast.error('Error saving resume');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (field, value) => {
    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: value
      }
    });
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [
        ...resumeData.education,
        {
          degree: '',
          institution: '',
          location: '',
          startDate: '',
          endDate: '',
          cgpa: '',
          major: '',
          achievements: []
        }
      ]
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...resumeData.education];
    updated[index][field] = value;
    setResumeData({ ...resumeData, education: updated });
  };

  const removeEducation = (index) => {
    const updated = resumeData.education.filter((_, i) => i !== index);
    setResumeData({ ...resumeData, education: updated });
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          responsibilities: [],
          achievements: []
        }
      ]
    });
  };

  const updateExperience = (index, field, value) => {
    const updated = [...resumeData.experience];
    updated[index][field] = value;
    setResumeData({ ...resumeData, experience: updated });
  };

  const removeExperience = (index) => {
    const updated = resumeData.experience.filter((_, i) => i !== index);
    setResumeData({ ...resumeData, experience: updated });
  };

  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [
        ...resumeData.projects,
        {
          title: '',
          description: '',
          technologies: [],
          role: '',
          url: '',
          github: '',
          highlights: []
        }
      ]
    });
  };

  const updateProject = (index, field, value) => {
    const updated = [...resumeData.projects];
    updated[index][field] = value;
    setResumeData({ ...resumeData, projects: updated });
  };

  const removeProject = (index) => {
    const updated = resumeData.projects.filter((_, i) => i !== index);
    setResumeData({ ...resumeData, projects: updated });
  };

  const addSkill = (category, skill) => {
    if (!skill.trim()) return;
    
    setResumeData({
      ...resumeData,
      skills: {
        ...resumeData.skills,
        [category]: [...(resumeData.skills[category] || []), skill]
      }
    });
  };

  const removeSkill = (category, index) => {
    const updated = resumeData.skills[category].filter((_, i) => i !== index);
    setResumeData({
      ...resumeData,
      skills: {
        ...resumeData.skills,
        [category]: updated
      }
    });
  };

  return (
    <div className="resume-builder">
      <div className="builder-header">
        <div>
          <h1>Resume Builder</h1>
          <div className="completeness-bar">
            <div className="bar-container">
              <div 
                className="bar-fill" 
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span>{completeness}% Complete</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={() => navigate('/student/resume/preview/' + resumeId)} className="btn-preview">
            <FiEye /> Preview
          </button>
          <button onClick={handleSave} disabled={loading} className="btn-save">
            <FiSave /> {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="builder-container">
        <div className="sections-sidebar">
          <button 
            className={activeSection === 'personal' ? 'active' : ''}
            onClick={() => setActiveSection('personal')}
          >
            <FiCheckCircle /> Personal Info
          </button>
          <button 
            className={activeSection === 'summary' ? 'active' : ''}
            onClick={() => setActiveSection('summary')}
          >
            Professional Summary
          </button>
          <button 
            className={activeSection === 'education' ? 'active' : ''}
            onClick={() => setActiveSection('education')}
          >
            Education
          </button>
          <button 
            className={activeSection === 'experience' ? 'active' : ''}
            onClick={() => setActiveSection('experience')}
          >
            Experience
          </button>
          <button 
            className={activeSection === 'projects' ? 'active' : ''}
            onClick={() => setActiveSection('projects')}
          >
            Projects
          </button>
          <button 
            className={activeSection === 'skills' ? 'active' : ''}
            onClick={() => setActiveSection('skills')}
          >
            Skills
          </button>
          <button 
            className={activeSection === 'certifications' ? 'active' : ''}
            onClick={() => setActiveSection('certifications')}
          >
            Certifications
          </button>
        </div>

        <div className="builder-content">
          {/* Personal Information Section */}
          {activeSection === 'personal' && (
            <div className="section-content">
              <h2>Personal Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={resumeData.personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.address}
                  onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.city}
                    onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.state}
                    onChange={(e) => handlePersonalInfoChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.linkedin}
                    onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div className="form-group">
                  <label>GitHub</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.github}
                    onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                    placeholder="https://github.com/johndoe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Portfolio Website</label>
                <input
                  type="url"
                  value={resumeData.personalInfo.portfolio}
                  onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                  placeholder="https://johndoe.com"
                />
              </div>
            </div>
          )}

          {/* Professional Summary Section */}
          {activeSection === 'summary' && (
            <div className="section-content">
              <h2>Professional Summary</h2>
              <p className="section-help">Write a brief summary highlighting your key skills and experience (2-3 sentences)</p>
              
              <div className="form-group">
                <textarea
                  value={resumeData.personalInfo.professionalSummary}
                  onChange={(e) => handlePersonalInfoChange('professionalSummary', e.target.value)}
                  rows="6"
                  placeholder="Results-driven software engineer with 3+ years of experience in full-stack development..."
                />
              </div>
            </div>
          )}

          {/* Education Section */}
          {activeSection === 'education' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Education</h2>
                <button onClick={addEducation} className="btn-add">
                  <FiPlus /> Add Education
                </button>
              </div>

              {resumeData.education.map((edu, index) => (
                <div key={index} className="item-card">
                  <div className="card-header">
                    <h3>Education {index + 1}</h3>
                    <button onClick={() => removeEducation(index)} className="btn-remove">
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Degree *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Bachelor of Technology in Computer Science"
                    />
                  </div>

                  <div className="form-group">
                    <label>Institution *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="University Name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={edu.cgpa}
                        onChange={(e) => updateEducation(index, 'cgpa', e.target.value)}
                        placeholder="8.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Major/Specialization</label>
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => updateEducation(index, 'major', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {resumeData.education.length === 0 && (
                <div className="empty-state">
                  <FiAlertCircle />
                  <p>No education added yet. Click "Add Education" to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Work Experience</h2>
                <button onClick={addExperience} className="btn-add">
                  <FiPlus /> Add Experience
                </button>
              </div>

              {resumeData.experience.map((exp, index) => (
                <div key={index} className="item-card">
                  <div className="card-header">
                    <h3>Experience {index + 1}</h3>
                    <button onClick={() => removeExperience(index)} className="btn-remove">
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Job Title *</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company *</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Tech Company Inc."
                    />
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                      />
                      I currently work here
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      rows="4"
                      placeholder="Describe your role and responsibilities..."
                    />
                  </div>
                </div>
              ))}

              {resumeData.experience.length === 0 && (
                <div className="empty-state">
                  <FiAlertCircle />
                  <p>No experience added yet. Click "Add Experience" to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Projects Section */}
          {activeSection === 'projects' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Projects</h2>
                <button onClick={addProject} className="btn-add">
                  <FiPlus /> Add Project
                </button>
              </div>

              {resumeData.projects.map((project, index) => (
                <div key={index} className="item-card">
                  <div className="card-header">
                    <h3>Project {index + 1}</h3>
                    <button onClick={() => removeProject(index)} className="btn-remove">
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Project Title *</label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => updateProject(index, 'title', e.target.value)}
                      placeholder="E-commerce Platform"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      rows="4"
                      placeholder="Describe the project, your role, and key achievements..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Project URL</label>
                      <input
                        type="url"
                        value={project.url}
                        onChange={(e) => updateProject(index, 'url', e.target.value)}
                        placeholder="https://project-demo.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>GitHub Repository</label>
                      <input
                        type="url"
                        value={project.github}
                        onChange={(e) => updateProject(index, 'github', e.target.value)}
                        placeholder="https://github.com/user/repo"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {resumeData.projects.length === 0 && (
                <div className="empty-state">
                  <FiAlertCircle />
                  <p>No projects added yet. Click "Add Project" to showcase your work.</p>
                </div>
              )}
            </div>
          )}

          {/* Skills Section */}
          {activeSection === 'skills' && (
            <div className="section-content">
              <h2>Skills</h2>

              <div className="skills-category">
                <h3>Technical Skills</h3>
                <SkillInput
                  skills={resumeData.skills.technical || []}
                  onAdd={(skill) => addSkill('technical', skill)}
                  onRemove={(index) => removeSkill('technical', index)}
                />
              </div>

              <div className="skills-category">
                <h3>Soft Skills</h3>
                <SkillInput
                  skills={resumeData.skills.soft || []}
                  onAdd={(skill) => addSkill('soft', skill)}
                  onRemove={(index) => removeSkill('soft', index)}
                />
              </div>

              <div className="skills-category">
                <h3>Tools & Technologies</h3>
                <SkillInput
                  skills={resumeData.skills.tools || []}
                  onAdd={(skill) => addSkill('tools', skill)}
                  onRemove={(index) => removeSkill('tools', index)}
                />
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {activeSection === 'certifications' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Certifications</h2>
                <button className="btn-add">
                  <FiPlus /> Add Certification
                </button>
              </div>
              <div className="empty-state">
                <FiAlertCircle />
                <p>Certifications feature coming soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skill Input Component
const SkillInput = ({ skills, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="skill-input-container">
      <div className="skill-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a skill and press Enter"
        />
        <button onClick={handleAdd} type="button">
          <FiPlus /> Add
        </button>
      </div>
      <div className="skills-list">
        {skills.map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill}
            <button onClick={() => onRemove(index)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ResumeBuilder;