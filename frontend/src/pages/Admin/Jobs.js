import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
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
      toast.success(`Job ${isApproved ? 'approved' : 'rejected'} successfully`);
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
      } catch (error) {
        toast.error('Error deleting job');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="jobs-page">
      <h1>Manage Jobs</h1>

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
          <option value="draft">Draft</option>
        </select>

        <select
          value={filters.isApproved}
          onChange={(e) => setFilters({ ...filters, isApproved: e.target.value })}
        >
          <option value="">All Approval Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
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
                <td>{job.company}</td>
                <td>{job.location}</td>
                <td>
                  <span className="badge">{job.jobType}</span>
                </td>
                <td>{job.applicationsCount}</td>
                <td>
                  <span className={`badge ${job.status}`}>{job.status}</span>
                </td>
                <td>
                  <span className={`badge ${job.isApproved ? 'approved' : 'pending'}`}>
                    {job.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
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
                        title="Approve"
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
          <div className="no-data">No jobs found</div>
        )}
      </div>

      {selectedJob && (
        <div className="modal" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedJob.title}</h2>
            <p><strong>Company:</strong> {selectedJob.company}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Type:</strong> {selectedJob.jobType}</p>
            <p><strong>Description:</strong> {selectedJob.description}</p>
            <p><strong>Requirements:</strong></p>
            <ul>
              {selectedJob.requirements?.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
            <button onClick={() => setSelectedJob(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;