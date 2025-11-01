import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiMapPin, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: ''
  });
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('jobType', filters.jobType);

      const response = await axios.get(`/api/student/jobs?${params}`);
      setJobs(response.data);
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      await axios.post(`/api/student/jobs/${selectedJob._id}/apply`, applicationData);
      toast.success('Application submitted successfully!');
      setSelectedJob(null);
      setApplicationData({ coverLetter: '', resume: '' });
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="jobs-page">
      <h1>Browse Jobs</h1>

      <div className="filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          value={filters.jobType}
          onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job._id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className="badge">{job.jobType}</span>
            </div>
            <p className="company">{job.company}</p>
            <div className="job-details">
              <span><FiMapPin /> {job.location}</span>
              {job.salary && (
                <span>
                  <FiDollarSign /> {job.salary.min} - {job.salary.max} {job.salary.currency}
                </span>
              )}
            </div>
            <p className="description">{job.description?.substring(0, 150)}...</p>
            <div className="job-footer">
              <span className="deadline">
                Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}
              </span>
              <button 
                className="btn-primary"
                onClick={() => setSelectedJob(job)}
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="no-data">No jobs available at the moment</div>
      )}

      {selectedJob && (
        <div className="modal" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for {selectedJob.title}</h2>
            <p><strong>Company:</strong> {selectedJob.company}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label>Cover Letter *</label>
                <textarea
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({
                    ...applicationData,
                    coverLetter: e.target.value
                  })}
                  required
                  rows="6"
                  placeholder="Tell us why you're a great fit..."
                />
              </div>

              <div className="form-group">
                <label>Resume URL</label>
                <input
                  type="url"
                  value={applicationData.resume}
                  onChange={(e) => setApplicationData({
                    ...applicationData,
                    resume: e.target.value
                  })}
                  placeholder="https://..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setSelectedJob(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={applying}
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;