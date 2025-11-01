import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiRefreshCw } from 'react-icons/fi';
import './Interview.css';

const InterviewAnalysis = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [decision, setDecision] = useState({
    result: 'pending',
    finalFeedback: '',
    rating: 3
  });

  useEffect(() => {
    fetchInterviewAnalysis();
  }, [interviewId]);

  const fetchInterviewAnalysis = async () => {
    try {
      const response = await axios.get(`/api/interview/${interviewId}`);
      setInterview(response.data);
      
      if (response.data.result) {
        setDecision({
          result: response.data.result,
          finalFeedback: response.data.finalFeedback || '',
          rating: response.data.rating || 3
        });
      }
    } catch (error) {
      toast.error('Error fetching interview analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`/api/interview/${interviewId}/generate-analysis`);
      setInterview({ ...interview, analysis: response.data.analysis });
      toast.success('AI analysis generated successfully');
    } catch (error) {
      toast.error('Error generating analysis');
    } finally {
      setGenerating(false);
    }
  };

  const submitDecision = async () => {
    try {
      await axios.put(`/api/interview/${interviewId}/decision`, decision);
      toast.success('Decision submitted successfully');
      navigate('/recruiter/applications');
    } catch (error) {
      toast.error('Error submitting decision');
    }
  };

  const downloadReport = () => {
    // Generate PDF report (you can use jsPDF or similar library)
    toast.info('Generating PDF report...');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const ScoreCircle = ({ score, label }) => (
    <div className="score-circle">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="10"
          strokeDasharray={`${(score / 100) * 314} 314`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="65"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#333"
        >
          {score}
        </text>
      </svg>
      <p className="score-label">{label}</p>
    </div>
  );

  if (loading) return <div className="loading">Loading analysis...</div>;

  const analysis = interview?.analysis;

  return (
    <div className="interview-analysis">
      <div className="analysis-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <FiArrowLeft /> Back
        </button>
        <h1>Interview Analysis</h1>
        <div className="header-actions">
          {!analysis && (
            <button 
              onClick={generateAIAnalysis} 
              disabled={generating}
              className="btn-generate"
            >
              <FiRefreshCw className={generating ? 'spinning' : ''} />
              {generating ? 'Generating...' : 'Generate AI Analysis'}
            </button>
          )}
          <button onClick={downloadReport} className="btn-download">
            <FiDownload /> Download Report
          </button>
        </div>
      </div>

      <div className="candidate-info">
        <h2>{interview?.studentId?.name}</h2>
        <p><strong>Position:</strong> {interview?.jobId?.title}</p>
        <p><strong>Date:</strong> {new Date(interview?.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Duration:</strong> {interview?.duration} minutes</p>
      </div>

      {analysis ? (
        <>
          <div className="scores-section">
            <h2>Performance Scores</h2>
            <div className="scores-grid">
              <ScoreCircle score={analysis.overallScore} label="Overall Score" />
              <ScoreCircle score={analysis.communicationScore} label="Communication" />
              <ScoreCircle score={analysis.technicalScore} label="Technical Skills" />
              <ScoreCircle score={analysis.confidenceScore} label="Confidence" />
            </div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card">
              <h3>Sentiment Analysis</h3>
              <div className="sentiment-bars">
                <div className="sentiment-item">
                  <span>Positive</span>
                  <div className="progress-bar">
                    <div 
                      className="progress positive" 
                      style={{ width: `${analysis.sentimentAnalysis?.positive * 100}%` }}
                    />
                  </div>
                  <span>{(analysis.sentimentAnalysis?.positive * 100).toFixed(1)}%</span>
                </div>
                <div className="sentiment-item">
                  <span>Neutral</span>
                  <div className="progress-bar">
                    <div 
                      className="progress neutral" 
                      style={{ width: `${analysis.sentimentAnalysis?.neutral * 100}%` }}
                    />
                  </div>
                  <span>{(analysis.sentimentAnalysis?.neutral * 100).toFixed(1)}%</span>
                </div>
                <div className="sentiment-item">
                  <span>Negative</span>
                  <div className="progress-bar">
                    <div 
                      className="progress negative" 
                      style={{ width: `${analysis.sentimentAnalysis?.negative * 100}%` }}
                    />
                  </div>
                  <span>{(analysis.sentimentAnalysis?.negative * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <h3>Behavioral Metrics</h3>
              <div className="metrics-list">
                <div className="metric-item">
                  <span>Eye Contact</span>
                  <div className="metric-score">
                    <div className="score-bar" style={{ width: `${analysis.eyeContact?.score}%` }} />
                    <span>{analysis.eyeContact?.score}/100</span>
                  </div>
                </div>
                <p className="metric-feedback">{analysis.eyeContact?.feedback}</p>

                <div className="metric-item">
                  <span>Body Language</span>
                  <div className="metric-score">
                    <div className="score-bar" style={{ width: `${analysis.bodyLanguage?.score}%` }} />
                    <span>{analysis.bodyLanguage?.score}/100</span>
                  </div>
                </div>
                <p className="metric-feedback">{analysis.bodyLanguage?.feedback}</p>

                <div className="metric-item">
                  <span>Speaking Pace</span>
                  <div className="metric-score">
                    <div className="score-bar" style={{ width: `${analysis.speakingPace?.score}%` }} />
                    <span>{analysis.speakingPace?.score}/100</span>
                  </div>
                </div>
                <p className="metric-feedback">{analysis.speakingPace?.feedback}</p>
              </div>
            </div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card">
              <h3>Communication Stats</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Average Response Time</span>
                  <strong>{analysis.averageResponseTime}s</strong>
                </div>
                <div className="stat-row">
                  <span>Total Speaking Time</span>
                  <strong>{Math.floor(analysis.totalSpeakingTime / 60)}m {analysis.totalSpeakingTime % 60}s</strong>
                </div>
                <div className="stat-row">
                  <span>Filler Words Count</span>
                  <strong>{analysis.fillerWordsCount}</strong>
                </div>
                <div className="stat-row">
                  <span>Response Quality</span>
                  <span className={`quality-badge ${analysis.responseQuality}`}>
                    {analysis.responseQuality}
                  </span>
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <h3>Key Skills Identified</h3>
              <div className="keywords-list">
                {analysis.keywordMatches?.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-card">
              <h3>Strengths</h3>
              <ul className="feedback-list strengths">
                {analysis.strengths?.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="analysis-card">
              <h3>Areas for Improvement</h3>
              <ul className="feedback-list weaknesses">
                {analysis.weaknesses?.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="analysis-card full-width">
            <h3>Recommendations</h3>
            <ul className="feedback-list recommendations">
              {analysis.recommendations?.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="analysis-card full-width">
            <h3>AI Summary</h3>
            <p className="ai-summary">{analysis.aiSummary}</p>
          </div>

          <div className="analysis-card full-width">
            <h3>Detailed Feedback</h3>
            <p className="detailed-feedback">{analysis.detailedFeedback}</p>
          </div>

          <div className="questions-section">
            <h3>Questions Asked ({interview?.questionsAsked?.length})</h3>
            <div className="questions-list">
              {interview?.questionsAsked?.map((q, index) => (
                <div key={index} className="question-card">
                  <span className={`category-badge ${q.category}`}>{q.category}</span>
                  <p>{q.question}</p>
                  <small>{new Date(q.askedAt).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="no-analysis">
          <p>No analysis available yet. Click "Generate AI Analysis" to create one.</p>
        </div>
      )}

      <div className="decision-section">
        <h2>Final Decision</h2>
        
        <div className="decision-form">
          <div className="form-group">
            <label>Decision</label>
            <select 
              value={decision.result} 
              onChange={(e) => setDecision({ ...decision, result: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${decision.rating >= star ? 'filled' : ''}`}
                  onClick={() => setDecision({ ...decision, rating: star })}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Final Feedback</label>
            <textarea
              value={decision.finalFeedback}
              onChange={(e) => setDecision({ ...decision, finalFeedback: e.target.value })}
              rows="5"
              placeholder="Provide detailed feedback to the candidate..."
            />
          </div>

          <button onClick={submitDecision} className="btn-submit">
            Submit Decision
          </button>
        </div>
      </div>

      {interview?.recruiterNotes && (
        <div className="analysis-card full-width">
          <h3>Interviewer Notes</h3>
          <p className="interviewer-notes">{interview.recruiterNotes}</p>
        </div>
      )}
    </div>
  );
};

export default InterviewAnalysis;