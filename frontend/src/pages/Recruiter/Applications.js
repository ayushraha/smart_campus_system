import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showInterview, setShowInterview] = useState(false);
  const [filter, setFilter] = useState('');
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    mode: 'online',
    location: '',
    meetingLink: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const response = await axios.get(`/api/recruiter/applications${params}`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, status, feedback = '') => {
    try {
      await axios.put(`/api/recruiter/applications/${appId}/status`, { status, feedback });
      toast.success('Application status updated');
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      // Create interview through new interview API
      await axios.post('/api/interview/schedule', {
        applicationId: selectedApp._id,
        scheduledDate: interviewData.date,
        scheduledTime: interviewData.time,
        duration: 30,
        mode: interviewData.mode
      });
      
      toast.success('Interview scheduled successfully');
      setShowInterview(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error('Error scheduling interview');
    }
  };

  const viewDetails = async (appId) => {
    try {
      const response = await axios.get(`/api/recruiter/applications/${appId}`);
      setSelectedApp(response.data);
    } catch (error) {
      toast.error('Error fetching details');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-page">
      <h1>Applications</h1>

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
              <th>Student Name</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>CGPA</th>
              <th>Department</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.studentId?.name}</td>
                <td>{app.studentId?.email}</td>
                <td>{app.jobId?.title}</td>
                <td>{app.studentId?.studentProfile?.cgpa || 'N/A'}</td>
                <td>{app.studentId?.studentProfile?.department || 'N/A'}</td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="no-data">No applications found</div>
        )}
      </div>

      {selectedApp && !showInterview && (
        <div className="modal" onClick={() => setSelectedApp(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>Application Details</h2>

            <div className="detail-section">
              <h3>Student Information</h3>
              <p><strong>Name:</strong> {selectedApp.studentId?.name}</p>
              <p><strong>Email:</strong> {selectedApp.studentId?.email}</p>
              <p><strong>Phone:</strong> {selectedApp.studentId?.phone}</p>
              <p><strong>Department:</strong> {selectedApp.studentId?.studentProfile?.department}</p>
              <p><strong>Year:</strong> {selectedApp.studentId?.studentProfile?.year}</p>
              <p><strong>CGPA:</strong> {selectedApp.studentId?.studentProfile?.cgpa}</p>
            </div>

            <div className="detail-section">
              <h3>Skills</h3>
              <div className="skills-list">
                {selectedApp.studentId?.studentProfile?.skills?.map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>Cover Letter</h3>
              <p>{selectedApp.coverLetter}</p>
            </div>

            {selectedApp.studentId?.studentProfile?.resume && (
              <div className="detail-section">
                <h3>Resume</h3>
                <a href={selectedApp.studentId.studentProfile.resume} target="_blank" rel="noopener noreferrer">
                  View Resume
                </a>
              </div>
            )}

            <div className="action-buttons-group">
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedApp._id, 'shortlisted')}
                    className="btn-success"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => {
                      const feedback = prompt('Enter rejection feedback (optional):');
                      updateStatus(selectedApp._id, 'rejected', feedback || '');
                    }}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedApp.status === 'shortlisted' && (
                <>
                  <button
                    onClick={() => setShowInterview(true)}
                    className="btn-primary"
                  >
                    Schedule Interview
                  </button>
                  <button
                    onClick={() => updateStatus(selectedApp._id, 'rejected')}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedApp.status === 'interview' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedApp._id, 'selected')}
                    className="btn-success"
                  >
                    Select Candidate
                  </button>
                  <button
                    onClick={() => updateStatus(selectedApp._id, 'rejected')}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}
              <button onClick={() => setSelectedApp(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showInterview && selectedApp && (
        <div className="modal" onClick={() => setShowInterview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule Interview</h2>
            <form onSubmit={scheduleInterview}>
              <div className="form-group">
                <label>Interview Date *</label>
                <input
                  type="date"
                  value={interviewData.date}
                  onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={interviewData.time}
                  onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mode *</label>
                <select
                  value={interviewData.mode}
                  onChange={(e) => setInterviewData({ ...interviewData, mode: e.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {interviewData.mode === 'offline' ? (
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                    placeholder="Interview location"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={interviewData.meetingLink}
                    onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  rows="3"
                  placeholder="Any additional instructions..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowInterview(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;