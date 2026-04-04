import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiEye, FiXCircle, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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

  const pendingCount = jobs.filter(j => !j.isApproved).length;

  const getApprovalBadge = (job) => {
    if (job.isApproved) {
      return (
        <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FiCheckCircle size={12} /> Approved
        </span>
      );
    }
    return (
      <span className="badge pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FiClock size={12} /> Pending Approval
      </span>
    );
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

      {/* Pending Approval Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fff3cd, #fef8e7)',
        border: '1px solid #ffc107',
        borderLeft: '4px solid #ffc107',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <FiAlertCircle size={20} color="#e6a100" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#856404', display: 'block', marginBottom: '4px' }}>
            ⏳ Admin Approval Required
          </strong>
          <span style={{ color: '#856404', fontSize: '14px' }}>
            All new or edited job postings require admin approval before they become visible to students.
            {pendingCount > 0 && (
              <strong> You currently have {pendingCount} job{pendingCount > 1 ? 's' : ''} awaiting approval.</strong>
            )}
          </span>
        </div>
      </div>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Jobs</option>
          <option value="active">Active (Approved)</option>
          <option value="draft">Draft (Pending Approval)</option>
          <option value="closed">Closed</option>
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
              <th>Approval</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} style={!job.isApproved ? { opacity: 0.85, background: '#fffdf0' } : {}}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong>{job.title}</strong>
                    {!job.isApproved && (
                      <small style={{ color: '#999', fontSize: '11px' }}>
                        🔒 Not visible to students yet
                      </small>
                    )}
                  </div>
                </td>
                <td>{job.location}</td>
                <td><span className="badge">{job.jobType}</span></td>
                <td>{job.applicationsCount}</td>
                <td><span className={`badge ${job.status}`}>{job.status}</span></td>
                <td>{getApprovalBadge(job)}</td>
                <td>{format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}</td>
                <td className="action-buttons">
                  <button
                    className="btn-icon info"
                    onClick={() => navigate(`/recruiter/jobs/${job._id}/applications`)}
                    title="View Applications"
                  >
                    <FiEye />
                  </button>
                  {job.isApproved && job.status === 'active' && (
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