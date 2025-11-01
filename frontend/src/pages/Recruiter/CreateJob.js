import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    <div className="create-job-page">
      <h1>Post New Job</h1>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="title"
                value={jobData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="company"
                value={jobData.company}
                onChange={handleChange}
                required
                placeholder="Your company name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={jobData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bangalore, India"
                />
              </div>

              <div className="form-group">
                <label>Job Type *</label>
                <select name="jobType" value={jobData.jobType} onChange={handleChange}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                name="description"
                value={jobData.description}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Requirements & Skills</h2>

            <div className="form-group">
              <label>Requirements</label>
              {jobData.requirements.map((req, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {jobData.requirements.length > 1 && (
                    <button type="button" onClick={() => removeArrayField('requirements', index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayField('requirements')} className="btn-secondary">
                Add Requirement
              </button>
            </div>

            <div className="form-group">
              <label>Skills Required</label>
              {jobData.skills.map((skill, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                    placeholder={`Skill ${index + 1}`}
                  />
                  {jobData.skills.length > 1 && (
                    <button type="button" onClick={() => removeArrayField('skills', index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayField('skills')} className="btn-secondary">
                Add Skill
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>Compensation</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Salary</label>
                <input
                  type="number"
                  name="salary.min"
                  value={jobData.salary.min}
                  onChange={handleChange}
                  placeholder="50000"
                />
              </div>

              <div className="form-group">
                <label>Maximum Salary</label>
                <input
                  type="number"
                  name="salary.max"
                  value={jobData.salary.max}
                  onChange={handleChange}
                  placeholder="100000"
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select name="salary.currency" value={jobData.salary.currency} onChange={handleChange}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Eligibility Criteria</h2>

            <div className="form-group">
              <label>Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                name="eligibility.minCGPA"
                value={jobData.eligibility.minCGPA}
                onChange={handleChange}
                min="0"
                max="10"
                placeholder="e.g., 7.0"
              />
            </div>

            <div className="form-group">
              <label>Eligible Departments</label>
              {jobData.eligibility.departments.map((dept, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => {
                      const newDepts = [...jobData.eligibility.departments];
                      newDepts[index] = e.target.value;
                      setJobData({
                        ...jobData,
                        eligibility: { ...jobData.eligibility, departments: newDepts }
                      });
                    }}
                    placeholder="e.g., Computer Science"
                  />
                  {jobData.eligibility.departments.length > 1 && (
                    <button type="button" onClick={() => {
                      const newDepts = jobData.eligibility.departments.filter((_, i) => i !== index);
                      setJobData({
                        ...jobData,
                        eligibility: { ...jobData.eligibility, departments: newDepts }
                      });
                    }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => {
                setJobData({
                  ...jobData,
                  eligibility: {
                    ...jobData.eligibility,
                    departments: [...jobData.eligibility.departments, '']
                  }
                });
              }} className="btn-secondary">
                Add Department
              </button>
            </div>

            <div className="form-group">
              <label>Eligible Year of Study</label>
              <div className="checkbox-group">
                {[1, 2, 3, 4].map(year => (
                  <label key={year} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={jobData.eligibility.yearOfStudy.includes(year)}
                      onChange={() => handleYearChange(year)}
                    />
                    Year {year}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Application Deadline</h2>

            <div className="form-group">
              <label>Deadline *</label>
              <input
                type="date"
                name="applicationDeadline"
                value={jobData.applicationDeadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/recruiter/jobs')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;