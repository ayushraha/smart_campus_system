import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiVideo, FiEye, FiCalendar } from 'react-icons/fi';

const Interviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, [filter]);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get('/api/interview/my/interviews');
      let filteredInterviews = response.data;
      
      if (filter) {
        filteredInterviews = filteredInterviews.filter(i => i.status === filter);
      }
      
      setInterviews(filteredInterviews);
    } catch (error) {
      toast.error('Error fetching interviews');
    } finally {
      setLoading(false);
    }
  };

  const joinInterview = (roomId) => {
    navigate(`/interview/room/${roomId}`);
  };

  const viewAnalysis = (interviewId) => {
    navigate(`/recruiter/interviews/${interviewId}/analysis`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="interviews-page">
      <h1>My Interviews</h1>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Interviews</option>
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="interviews-grid">
        {interviews.map((interview) => (
          <div key={interview._id} className="interview-card">
            <div className="interview-header">
              <div className="interview-info">
                <h3>{interview.studentId?.name}</h3>
                <p className="job-title">{interview.jobId?.title}</p>
              </div>
              <span className={`status-badge ${interview.status}`}>
                {interview.status}
              </span>
            </div>

            <div className="interview-details">
              <div className="detail-item">
                <FiCalendar />
                <span>{format(new Date(interview.scheduledDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="detail-item">
                <span>Time: {interview.scheduledTime}</span>
              </div>
              <div className="detail-item">
                <span>Duration: {interview.duration} minutes</span>
              </div>
              <div className="detail-item">
                <span>Mode: {interview.mode}</span>
              </div>
            </div>

            <div className="interview-actions">
              {interview.status === 'scheduled' && interview.mode === 'online' && (
                <button
                  onClick={() => joinInterview(interview.roomId)}
                  className="btn-join-interview"
                >
                  <FiVideo /> Join Interview
                </button>
              )}
              
              {interview.status === 'completed' && (
                <button
                  onClick={() => viewAnalysis(interview._id)}
                  className="btn-view-analysis"
                >
                  <FiEye /> View Analysis
                </button>
              )}

              {interview.status === 'in-progress' && interview.mode === 'online' && (
                <button
                  onClick={() => joinInterview(interview.roomId)}
                  className="btn-rejoin"
                >
                  <FiVideo /> Rejoin Interview
                </button>
              )}
            </div>

            {interview.analysis && (
              <div className="quick-scores">
                <div className="score-item">
                  <span>Overall</span>
                  <strong>{interview.analysis.overallScore}/100</strong>
                </div>
                <div className="score-item">
                  <span>Technical</span>
                  <strong>{interview.analysis.technicalScore}/100</strong>
                </div>
                <div className="score-item">
                  <span>Communication</span>
                  <strong>{interview.analysis.communicationScore}/100</strong>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {interviews.length === 0 && (
        <div className="no-data">No interviews found</div>
      )}
    </div>
  );
};

export default Interviews;