import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Briefcase, ListChecks, CheckCircle, Clock, Plus, X, ArrowRight } from 'lucide-react';
import './CreateJob.css';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: [''],
    skills: [''],
    location: '',
    jobType: 'Full-time',
    salary: {
      min: '',
      max: '',
      currency: 'INR'
    },
    eligibility: {
      minCGPA: '',
      tenthPercent: '',
      twelfthPercent: '',
      maxActiveBacklogs: '',
      departments: [''],
      yearOfStudy: []
    },
    applicationDeadline: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setJobData({
        ...jobData,
        [parent]: {
          ...jobData[parent],
          [child]: value
        }
      });
    } else {
      setJobData({ ...jobData, [name]: value });
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...jobData[field]];
    newArray[index] = value;
    setJobData({ ...jobData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setJobData({ ...jobData, [field]: [...jobData[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const newArray = jobData[field].filter((_, i) => i !== index);
    setJobData({ ...jobData, [field]: newArray });
  };

  const handleYearChange = (year) => {
    const years = jobData.eligibility.yearOfStudy;
    if (years.includes(year)) {
      setJobData({
        ...jobData,
        eligibility: {
          ...jobData.eligibility,
          yearOfStudy: years.filter(y => y !== year)
        }
      });
    } else {
      setJobData({
        ...jobData,
        eligibility: {
          ...jobData.eligibility,
          yearOfStudy: [...years, year]
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up empty array values
      const cleanedData = {
        ...jobData,
        requirements: jobData.requirements.filter(r => r.trim()),
        skills: jobData.skills.filter(s => s.trim()),
        eligibility: {
          ...jobData.eligibility,
          departments: jobData.eligibility.departments.filter(d => d.trim())
        }
      };

      await axios.post('/api/recruiter/jobs', cleanedData);
      toast.success('Job posted successfully! Waiting for admin approval.');
      navigate('/recruiter/jobs');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error posting job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cj-page-wrapper">
      <div className="cj-header">
        <h1>Post a New Opportunity</h1>
        <p>Find the best talent by providing clear details about the role.</p>
      </div>

      <div className="cj-form-container">
        <form className="cj-form" onSubmit={handleSubmit}>
          
          <div className="cj-section">
            <h2 className="cj-section-title"><Briefcase size={24} /> Basic Information</h2>
            
            <div className="cj-grid">
              <div className="cj-form-group">
                <label className="cj-label">Job Title <span>*</span></label>
                <input className="cj-input" type="text" name="title" value={jobData.title} onChange={handleChange} required placeholder="e.g., Software Engineer" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Company Name <span>*</span></label>
                <input className="cj-input" type="text" name="company" value={jobData.company} onChange={handleChange} required placeholder="Your company name" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Location <span>*</span></label>
                <input className="cj-input" type="text" name="location" value={jobData.location} onChange={handleChange} required placeholder="e.g., Bangalore, India" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Job Type <span>*</span></label>
                <select className="cj-select" name="jobType" value={jobData.jobType} onChange={handleChange}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="cj-form-group cj-full-width">
                <label className="cj-label">Job Description <span>*</span></label>
                <textarea className="cj-textarea" name="description" value={jobData.description} onChange={handleChange} required placeholder="Describe the role, responsibilities, and what you're looking for..." />
              </div>
            </div>
          </div>

          <div className="cj-section">
            <h2 className="cj-section-title"><ListChecks size={24} /> Requirements & Skills</h2>
            
            <div className="cj-grid">
              <div className="cj-form-group">
                <label className="cj-label">Requirements</label>
                {jobData.requirements.map((req, index) => (
                  <div key={index} className="cj-array-item">
                    <input className="cj-input" type="text" value={req} onChange={(e) => handleArrayChange('requirements', index, e.target.value)} placeholder={`Requirement ${index + 1}`} />
                    {jobData.requirements.length > 1 && (
                      <button type="button" className="cj-btn-remove" onClick={() => removeArrayField('requirements', index)}><X size={18} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('requirements')} className="cj-btn-add">
                  <Plus size={16} /> Add Requirement
                </button>
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Skills Required</label>
                {jobData.skills.map((skill, index) => (
                  <div key={index} className="cj-array-item">
                    <input className="cj-input" type="text" value={skill} onChange={(e) => handleArrayChange('skills', index, e.target.value)} placeholder={`Skill ${index + 1}`} />
                    {jobData.skills.length > 1 && (
                      <button type="button" className="cj-btn-remove" onClick={() => removeArrayField('skills', index)}><X size={18} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('skills')} className="cj-btn-add">
                  <Plus size={16} /> Add Skill
                </button>
              </div>
            </div>
          </div>

          <div className="cj-section">
            <h2 className="cj-section-title"><CheckCircle size={24} /> Compensation & Eligibility</h2>
            
            <div className="cj-grid">
              <div className="cj-form-group">
                <label className="cj-label">Min Salary</label>
                <input className="cj-input" type="number" name="salary.min" value={jobData.salary.min} onChange={handleChange} placeholder="50000" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Max Salary</label>
                <input className="cj-input" type="number" name="salary.max" value={jobData.salary.max} onChange={handleChange} placeholder="100000" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Currency</label>
                <select className="cj-select" name="salary.currency" value={jobData.salary.currency} onChange={handleChange}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Minimum CGPA</label>
                <input className="cj-input" type="number" step="0.1" name="eligibility.minCGPA" value={jobData.eligibility.minCGPA} onChange={handleChange} min="0" max="10" placeholder="e.g., 7.0" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">10th Percentage</label>
                <input className="cj-input" type="number" step="0.1" name="eligibility.tenthPercent" value={jobData.eligibility.tenthPercent || ''} onChange={handleChange} min="0" max="100" placeholder="e.g., 60" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">12th Percentage</label>
                <input className="cj-input" type="number" step="0.1" name="eligibility.twelfthPercent" value={jobData.eligibility.twelfthPercent || ''} onChange={handleChange} min="0" max="100" placeholder="e.g., 60" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Max Active Backlogs</label>
                <input className="cj-input" type="number" name="eligibility.maxActiveBacklogs" value={jobData.eligibility.maxActiveBacklogs || ''} onChange={handleChange} min="0" placeholder="e.g., 0" />
              </div>

              <div className="cj-form-group">
                <label className="cj-label">Eligible Departments</label>
                {jobData.eligibility.departments.map((dept, index) => (
                  <div key={index} className="cj-array-item">
                    <input className="cj-input" type="text" value={dept} onChange={(e) => {
                      const newDepts = [...jobData.eligibility.departments];
                      newDepts[index] = e.target.value;
                      setJobData({ ...jobData, eligibility: { ...jobData.eligibility, departments: newDepts }});
                    }} placeholder="e.g., Computer Science" />
                    {jobData.eligibility.departments.length > 1 && (
                      <button type="button" className="cj-btn-remove" onClick={() => {
                        const newDepts = jobData.eligibility.departments.filter((_, i) => i !== index);
                        setJobData({ ...jobData, eligibility: { ...jobData.eligibility, departments: newDepts }});
                      }}><X size={18} /></button>
                    )}
                  </div>
                ))}
                <button type="button" className="cj-btn-add" onClick={() => {
                  setJobData({
                    ...jobData,
                    eligibility: {
                      ...jobData.eligibility,
                      departments: [...jobData.eligibility.departments, '']
                    }
                  });
                }}>
                  <Plus size={16} /> Add Department
                </button>
              </div>

              <div className="cj-form-group cj-full-width">
                <label className="cj-label">Eligible Year of Study</label>
                <div className="cj-checkbox-group">
                  {[1, 2, 3, 4].map(year => (
                    <label key={year} className="cj-checkbox-label">
                      <input type="checkbox" checked={jobData.eligibility.yearOfStudy.includes(year)} onChange={() => handleYearChange(year)} />
                      Year {year}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="cj-section">
            <h2 className="cj-section-title"><Clock size={24} /> Application Timeline</h2>
            <div className="cj-grid">
              <div className="cj-form-group">
                <label className="cj-label">Deadline <span>*</span></label>
                <input className="cj-input" type="date" name="applicationDeadline" value={jobData.applicationDeadline} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="cj-actions">
            <button type="button" className="cj-btn-cancel" onClick={() => navigate('/recruiter/jobs')}>Cancel</button>
            <button type="submit" className="cj-btn-submit" disabled={loading}>
              {loading ? 'Posting...' : <>Post Opportunity <ArrowRight size={18} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;