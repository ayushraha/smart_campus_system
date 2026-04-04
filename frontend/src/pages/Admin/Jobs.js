import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiTrash2, FiSearch, FiEye, FiClock, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    isApproved: '',
    search: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeView, setActiveView] = useState('pending'); // 'pending' | 'all'

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.isApproved !== '') params.append('isApproved', filters.isApproved);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/admin/jobs?${params}`);
      setJobs(response.data);
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (jobId, isApproved) => {
    try {
      await axios.put(`/api/admin/jobs/${jobId}/approval`, { isApproved });
      toast.success(`Job ${isApproved ? '✅ approved and now visible to students!' : '❌ rejected'}`);
      fetchJobs();
    } catch (error) {
      toast.error('Error updating approval status');
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`/api/admin/jobs/${jobId}`);
        toast.success('Job deleted successfully');
        fetchJobs();
        if (selectedJob?._id === jobId) setSelectedJob(null);
      } catch (error) {
        toast.error('Error deleting job');
      }
    }
  };

  const pendingJobs = jobs.filter(j => !j.isApproved);
  const approvedJobs = jobs.filter(j => j.isApproved);

  const displayJobs = activeView === 'pending' ? pendingJobs : jobs;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="jobs-page">
      <h1>Manage Jobs</h1>

      {/* Pending Jobs Alert Banner */}
      {pendingJobs.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd, #fef8e7)',
          border: '1px solid #ffc107',
          borderLeft: '5px solid #e6a100',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <FiClock size={24} color="#e6a100" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#856404', fontSize: '15px' }}>
              ⏳ {pendingJobs.length} Job{pendingJobs.length > 1 ? 's' : ''} Awaiting Your Approval
            </strong>
            <p style={{ color: '#856404', margin: '4px 0 0', fontSize: '13px' }}>
              These jobs were posted by recruiters and are <strong>not visible to students</strong> until you approve them. Review and take action below.
            </p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveView('pending')}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            background: activeView === 'pending' ? '#ffc107' : '#f1f3f5',
            color: activeView === 'pending' ? '#fff' : '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <FiClock size={14} />
          Pending Approval
          {pendingJobs.length > 0 && (
            <span style={{
              background: '#e6a100',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {pendingJobs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            background: activeView === 'all' ? '#4f46e5' : '#f1f3f5',
            color: activeView === 'all' ? '#fff' : '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <FiCheckCircle size={14} />
          All Jobs ({jobs.length})
        </button>
      </div>

      {/* Filters — only shown in All view */}
      {activeView === 'all' && (
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft / Pending</option>
          </select>

          <select
            value={filters.isApproved}
            onChange={(e) => setFilters({ ...filters, isApproved: e.target.value })}
          >
            <option value="">All Approval Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending Approval</option>
          </select>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company / Recruiter</th>
              <th>Location</th>
              <th>Type</th>
              <th>Applications</th>
              <th>Status</th>
              {activeView === 'all' && <th>Approval</th>}
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayJobs.map((job) => (
              <tr key={job._id} style={!job.isApproved ? { background: '#fffdf0' } : {}}>
                <td>
                  <div>
                    <strong>{job.title}</strong>
                    {!job.isApproved && (
                      <div style={{ fontSize: '11px', color: '#e6a100', marginTop: '2px' }}>
                        🔒 Hidden from students
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    <div>{job.company}</div>
                    {job.recruiterId?.name && (
                      <div style={{ fontSize: '12px', color: '#888' }}>{job.recruiterId.name}</div>
                    )}
                  </div>
                </td>
                <td>{job.location}</td>
                <td>
                  <span className="badge">{job.jobType}</span>
                </td>
                <td>{job.applicationsCount}</td>
                <td>
                  <span className={`badge ${job.status}`}>{job.status}</span>
                </td>
                {activeView === 'all' && (
                  <td>
                    <span className={`badge ${job.isApproved ? 'approved' : 'pending'}`}>
                      {job.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                )}
                <td>{format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}</td>
                <td className="action-buttons">
                  <button
                    className="btn-icon info"
                    onClick={() => setSelectedJob(job)}
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                  {!job.isApproved && (
                    <>
                      <button
                        className="btn-icon success"
                        onClick={() => handleApproval(job._id, true)}
                        title="Approve — Makes visible to students"
                        style={{ background: '#10b981' }}
                      >
                        <FiCheck />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleApproval(job._id, false)}
                        title="Reject"
                      >
                        <FiX />
                      </button>
                    </>
                  )}
                  {job.isApproved && (
                    <button
                      className="btn-icon warning"
                      onClick={() => handleApproval(job._id, false)}
                      title="Revoke Approval — Hides from students"
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                               background: '#ffc107', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Revoke
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

        {displayJobs.length === 0 && (
          <div className="no-data">
            {activeView === 'pending'
              ? '✅ No pending job approvals. You\'re all caught up!'
              : 'No jobs found'}
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="modal" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{selectedJob.title}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!selectedJob.isApproved && (
                  <button
                    onClick={() => { handleApproval(selectedJob._id, true); setSelectedJob(null); }}
                    style={{
                      background: '#10b981', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
                      fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <FiCheck /> Approve Job
                  </button>
                )}
              </div>
            </div>

            {!selectedJob.isApproved && (
              <div style={{
                background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px',
                padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#856404'
              }}>
                ⏳ This job is <strong>pending approval</strong> and currently hidden from students.
              </div>
            )}

            <p><strong>Company:</strong> {selectedJob.company}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Type:</strong> {selectedJob.jobType}</p>
            <p><strong>Deadline:</strong> {format(new Date(selectedJob.applicationDeadline), 'MMM dd, yyyy')}</p>
            <p><strong>Description:</strong> {selectedJob.description}</p>
            {selectedJob.requirements?.length > 0 && (
              <>
                <p><strong>Requirements:</strong></p>
                <ul>
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </>
            )}
            {selectedJob.skills?.length > 0 && (
              <p><strong>Skills:</strong> {selectedJob.skills.join(', ')}</p>
            )}
            <button onClick={() => setSelectedJob(null)} style={{ marginTop: '16px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;