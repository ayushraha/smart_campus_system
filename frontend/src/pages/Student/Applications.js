import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiTrash2, FiEye } from 'react-icons/fi';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const response = await axios.get(`/api/student/applications${params}`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await axios.delete(`/api/student/applications/${appId}`);
        toast.success('Application withdrawn successfully');
        fetchApplications();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error withdrawing application');
      }
    }
  };

  const viewDetails = async (appId) => {
    try {
      const response = await axios.get(`/api/student/applications/${appId}`);
      setSelectedApp(response.data);
    } catch (error) {
      toast.error('Error fetching application details');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-page">
      <h1>My Applications</h1>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Applications</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.jobId?.title}</td>
                <td>{app.jobId?.company}</td>
                <td>{app.jobId?.location}</td>
                <td>{format(new Date(app.appliedDate), 'MMM dd, yyyy')}</td>
                <td>
                  <span className={`badge ${app.status}`}>{app.status}</span>
                </td>
                <td className="action-buttons">
                  <button
                    className="btn-icon info"
                    onClick={() => viewDetails(app._id)}
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                  {app.status === 'pending' && (
                    <button
                      className="btn-icon danger"
                      onClick={() => handleWithdraw(app._id)}
                      title="Withdraw"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="no-data">No applications found</div>
        )}
      </div>

      {selectedApp && (
        <div className="modal" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Application Details</h2>
            
            <div className="detail-section">
              <h3>Job Information</h3>
              <p><strong>Title:</strong> {selectedApp.jobId?.title}</p>
              <p><strong>Company:</strong> {selectedApp.jobId?.company}</p>
              <p><strong>Location:</strong> {selectedApp.jobId?.location}</p>
              <p><strong>Type:</strong> {selectedApp.jobId?.jobType}</p>
            </div>

            <div className="detail-section">
              <h3>Application Status</h3>
              <p><strong>Status:</strong> <span className={`badge ${selectedApp.status}`}>{selectedApp.status}</span></p>
              <p><strong>Applied Date:</strong> {format(new Date(selectedApp.appliedDate), 'MMM dd, yyyy')}</p>
            </div>

            {selectedApp.interviewDetails && (
              <div className="detail-section">
                <h3>Interview Details</h3>
                <p><strong>Date:</strong> {format(new Date(selectedApp.interviewDetails.date), 'MMM dd, yyyy')}</p>
                <p><strong>Time:</strong> {selectedApp.interviewDetails.time}</p>
                <p><strong>Mode:</strong> {selectedApp.interviewDetails.mode}</p>
                {selectedApp.interviewDetails.location && (
                  <p><strong>Location:</strong> {selectedApp.interviewDetails.location}</p>
                )}
                {selectedApp.interviewDetails.meetingLink && (
                  <p><strong>Meeting Link:</strong> <a href={selectedApp.interviewDetails.meetingLink} target="_blank" rel="noopener noreferrer">Join Meeting</a></p>
                )}
                {selectedApp.interviewDetails.notes && (
                  <p><strong>Notes:</strong> {selectedApp.interviewDetails.notes}</p>
                )}
              </div>
            )}

            {selectedApp.feedback && (
              <div className="detail-section">
                <h3>Feedback</h3>
                <p>{selectedApp.feedback}</p>
              </div>
            )}

            <div className="detail-section">
              <h3>Your Cover Letter</h3>
              <p>{selectedApp.coverLetter}</p>
            </div>

            <button onClick={() => setSelectedApp(null)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;