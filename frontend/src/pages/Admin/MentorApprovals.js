import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Admin.css'; // Leverage existing admin styles

const MentorApprovals = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPendingMentors = async () => {
    try {
      const res = await api.get('/admin/mentors/pending');
      setMentors(res.data);
    } catch (error) {
      console.error('Error fetching pending mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMentors();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/mentors/${id}/approve`);
      setMentors(prev => prev.filter(m => m._id !== id));
    } catch (error) {
      console.error('Failed to approve mentor', error);
      alert('Failed to approve: ' + error.response?.data?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to permanently reject this mentor?")) return;
    setActionLoading(id);
    try {
      await api.put(`/admin/mentors/${id}/reject`);
      setMentors(prev => prev.filter(m => m._id !== id));
    } catch (error) {
      console.error('Failed to reject mentor', error);
      alert('Failed to reject: ' + error.response?.data?.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Mentor Approvals</h1>
        <p>Review alumni applications for the AI Mentor Matchmaker.</p>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-spinner">Loading pending approvals...</div>
        ) : mentors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤝</div>
            <h3>All Caught Up!</h3>
            <p>There are no pending mentor applications to review.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>LinkedIn Profile</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map(mentor => (
                  <tr key={mentor._id}>
                    <td>
                      <div className="user-info">
                        <strong>{mentor.name}</strong>
                      </div>
                    </td>
                    <td>{mentor.company}</td>
                    <td>{mentor.role}</td>
                    <td>
                      {mentor.linkedinProfile ? (
                        <a 
                          href={mentor.linkedinProfile.startsWith('http') ? mentor.linkedinProfile : `https://${mentor.linkedinProfile}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="action-btn view"
                        >
                          View Profile
                        </a>
                      ) : (
                        <span style={{color: '#8696a0'}}>Not Provided</span>
                      )}
                    </td>
                    <td>{mentor.userId?.email}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn success"
                        onClick={() => handleApprove(mentor._id)}
                        disabled={actionLoading === mentor._id}
                      >
                        {actionLoading === mentor._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleReject(mentor._id)}
                        disabled={actionLoading === mentor._id}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorApprovals;
