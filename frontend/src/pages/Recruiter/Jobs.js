import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiEye, FiXCircle } from 'react-icons/fi';
import { format } from 'date-fns';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const response = await axios.get(`/api/recruiter/jobs${params}`);
      setJobs(response.data);
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (jobId) => {
    if (window.confirm('Are you sure you want to close this job posting?')) {
      try {
        await axios.put(`/api/recruiter/jobs/${jobId}/close`);
        toast.success('Job closed successfully');
        fetchJobs();
      } catch (error) {
        toast.error('Error closing job');
      }
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`/api/recruiter/jobs/${jobId}`);
        toast.success('Job deleted successfully');
        fetchJobs();
      } catch (error) {
        toast.error('Error deleting job');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>My Jobs</h1>
        <button onClick={() => navigate('/recruiter/jobs/create')} className="btn-primary">
          Post New Job
        </button>
      </div>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Jobs</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Type</th>
              <th>Applications</th>
              <th>Status</th>
              <th>Approved</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.location}</td>
                <td><span className="badge">{job.jobType}</span></td>
                <td>{job.applicationsCount}</td>
                <td><span className={`badge ${job.status}`}>{job.status}</span></td>
                <td>
                  <span className={`badge ${job.isApproved ? 'approved' : 'pending'}`}>
                    {job.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>{format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}</td>
                <td className="action-buttons">
                  <button
                    className="btn-icon info"
                    onClick={() => navigate(`/recruiter/jobs/${job._id}/applications`)}
                    title="View Applications"
                  >
                    <FiEye />
                  </button>
                  {job.status === 'active' && (
                    <button
                      className="btn-icon warning"
                      onClick={() => handleClose(job._id)}
                      title="Close Job"
                    >
                      <FiXCircle />
                    </button>
                  )}
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(job._id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <div className="no-data">No jobs found. Post your first job!</div>
        )}
      </div>
    </div>
  );
};

export default Jobs;