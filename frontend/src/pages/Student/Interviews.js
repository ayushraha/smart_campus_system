
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FiVideo, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

const Interviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/interview/my/interviews');
      console.log('Interviews data:', response.data); // Debug log
      setInterviews(response.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      const errorMsg = error.response?.data?.message || 'Error fetching interviews';
      setError(errorMsg);
      
      // If endpoint doesn't exist yet, show friendly message
      if (error.response?.status === 404) {
        setError('Interview feature is being set up. Please check back later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const joinInterview = (roomId) => {
    navigate(`/interview/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="interviews-page">
        <h1>My Interviews</h1>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interviews-page">
        <h1>My Interviews</h1>
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button onClick={fetchInterviews} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interviews-page">
      <h1>My Interviews</h1>

      {interviews.length === 0 ? (
        <div className="no-data">
          <p>📅 No interviews scheduled yet</p>
          <p>Check back here once a recruiter schedules an interview for you.</p>
        </div>
      ) : (
        <div className="interviews-timeline">
          {interviews.map((interview) => (
            <div key={interview._id} className={`timeline-item ${interview.status}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="interview-card">
                  <div className="card-header">
                    <div>
                      <h3>{interview.jobId?.title || 'Job Title'}</h3>
                      <p className="company">{interview.jobId?.company || 'Company'}</p>
                    </div>
                    <span className={`status-badge ${interview.status}`}>
                      {interview.status}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-grid">
                      <div className="info-item">
                        <FiCalendar />
                        <div>
                          <span className="label">Date</span>
                          <strong>
                            {interview.scheduledDate 
                              ? format(new Date(interview.scheduledDate), 'MMMM dd, yyyy')
                              : 'TBD'}
                          </strong>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiClock />
                        <div>
                          <span className="label">Time</span>
                          <strong>{interview.scheduledTime || 'TBD'}</strong>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="icon">⏱️</span>
                        <div>
                          <span className="label">Duration</span>
                          <strong>{interview.duration || 30} minutes</strong>
                        </div>
                      </div>

                      <div className="info-item">
                        {interview.mode === 'online' ? <FiVideo /> : <FiMapPin />}
                        <div>
                          <span className="label">Mode</span>
                          <strong>{interview.mode === 'online' ? 'Online' : 'Offline'}</strong>
                        </div>
                      </div>
                    </div>

                    {interview.mode === 'offline' && interview.interviewDetails?.location && (
                      <div className="location-info">
                        <FiMapPin />
                        <span>{interview.interviewDetails.location}</span>
                      </div>
                    )}

                    {interview.status === 'scheduled' && interview.mode === 'online' && interview.roomId && (
                      <button
                        onClick={() => joinInterview(interview.roomId)}
                        className="btn-join-interview"
                      >
                        <FiVideo /> Join Interview Room
                      </button>
                    )}

                    {interview.status === 'in-progress' && interview.mode === 'online' && interview.roomId && (
                      <button
                        onClick={() => joinInterview(interview.roomId)}
                        className="btn-rejoin"
                      >
                        <FiVideo /> Rejoin Interview
                      </button>
                    )}

                    {interview.status === 'completed' && interview.result && (
                      <div className={`result-banner ${interview.result}`}>
                        <strong>Result: </strong>
                        {interview.result === 'selected' && '🎉 Congratulations! You have been selected.'}
                        {interview.result === 'rejected' && 'Thank you for your time. Keep improving!'}
                        {interview.result === 'on-hold' && 'Your application is on hold. We will get back to you soon.'}
                      </div>
                    )}

                    {interview.finalFeedback && (
                      <div className="feedback-section">
                        <h4>Feedback from Interviewer</h4>
                        <p>{interview.finalFeedback}</p>
                      </div>
                    )}

                    {interview.analysis && (
                      <div className="performance-summary">
                        <h4>Your Performance Summary</h4>
                        <div className="scores-mini">
                          <div className="score-mini">
                            <span>Overall</span>
                            <div className="score-bar-mini">
                              <div 
                                className="score-fill" 
                                style={{ width: `${interview.analysis.overallScore}%` }}
                              ></div>
                            </div>
                            <strong>{interview.analysis.overallScore}/100</strong>
                          </div>
                          <div className="score-mini">
                            <span>Communication</span>
                            <div className="score-bar-mini">
                              <div 
                                className="score-fill" 
                                style={{ width: `${interview.analysis.communicationScore}%` }}
                              ></div>
                            </div>
                            <strong>{interview.analysis.communicationScore}/100</strong>
                          </div>
                          <div className="score-mini">
                            <span>Technical</span>
                            <div className="score-bar-mini">
                              <div 
                                className="score-fill" 
                                style={{ width: `${interview.analysis.technicalScore}%` }}
                              ></div>
                            </div>
                            <strong>{interview.analysis.technicalScore}/100</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Interviews;