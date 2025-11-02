import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Zap } from 'lucide-react';

const styles = `
  .premium-resume-parser {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .parser-header {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    color: #667eea;
  }

  .parser-header h1 {
    margin: 0;
    color: #333;
    font-size: 28px;
  }

  .parser-header p {
    margin: 5px 0 0 0;
    color: #666;
    font-size: 14px;
  }

  .alert {
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    animation: slideIn 0.3s ease-out;
  }

  .alert-error {
    background-color: #fee;
    color: #c33;
    border: 1px solid #fcc;
  }

  .alert-success {
    background-color: #efe;
    color: #3c3;
    border: 1px solid #cfc;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .parser-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .upload-section {
    background: white;
    border-radius: 15px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .upload-box {
    text-align: center;
    padding: 40px;
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f7 100%);
    border: 2px dashed #667eea;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .upload-box:hover {
    border-color: #764ba2;
    background: linear-gradient(135deg, #f0f3f7 0%, #eae9f5 100%);
  }

  .upload-box svg {
    margin-bottom: 15px;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .upload-box h2 {
    margin: 15px 0;
    color: #333;
    font-size: 20px;
  }

  .upload-box p {
    color: #666;
    margin: 5px 0;
    font-size: 14px;
  }

  .file-size {
    color: #999;
    font-size: 12px;
  }

  .upload-input {
    display: inline-block;
    cursor: pointer;
    margin-top: 20px;
  }

  .upload-input input {
    display: none;
  }

  .upload-button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 40px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .upload-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .upload-button.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .analysis-view {
    background: white;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .back-button {
    background: none;
    border: none;
    color: #667eea;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 20px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    color: #764ba2;
    transform: translateX(-5px);
  }

  .analysis-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    border-bottom: 2px solid #f0f0f0;
  }

  .tab {
    background: none;
    border: none;
    padding: 12px 20px;
    cursor: pointer;
    color: #999;
    font-weight: 600;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .tab:hover {
    color: #667eea;
  }

  .tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .report-content,
  .recommendations-content,
  .job-match-content {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .personal-info {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
  }

  .personal-info h2 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 24px;
  }

  .contact-info {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    color: #666;
    font-size: 14px;
  }

  .scores-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
  }

  .score-box {
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f7 100%);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #e0e0e0;
  }

  .score-circle {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 10px;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  .score-value {
    color: white;
    font-size: 24px;
    font-weight: 700;
  }

  .score-label {
    margin: 0;
    color: #666;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .exp-level {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .level-badge {
    background: #667eea;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .strength-weakness {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }

  .sw-section {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid #667eea;
  }

  .sw-section h4 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
  }

  .sw-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .sw-section li {
    padding: 8px 0;
    color: #666;
    border-bottom: 1px solid #e0e0e0;
    font-size: 14px;
  }

  .sw-section li:last-child {
    border-bottom: none;
  }

  .section {
    margin-bottom: 30px;
  }

  .section h3 {
    color: #333;
    margin: 0 0 20px 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .skill-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    display: inline-block;
  }

  .experience-card,
  .education-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #667eea;
  }

  .exp-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 10px;
  }

  .exp-header h4 {
    margin: 0;
    color: #333;
    font-size: 16px;
  }

  .duration {
    background: #e8f0fe;
    color: #667eea;
    padding: 4px 10px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 600;
  }

  .company {
    margin: 5px 0;
    color: #764ba2;
    font-weight: 600;
    font-size: 14px;
  }

  .description {
    margin: 10px 0 0 0;
    color: #666;
    font-size: 14px;
    line-height: 1.6;
  }

  .education-card h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 16px;
  }

  .education-card p {
    margin: 5px 0;
    color: #666;
    font-size: 14px;
  }

  .meta {
    color: #999;
    font-size: 12px;
  }

  .improvement-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #667eea;
  }

  .imp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .imp-header h4 {
    margin: 0;
    color: #333;
    font-size: 16px;
  }

  .priority {
    padding: 4px 12px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .priority.high {
    background: #fee;
    color: #c33;
  }

  .priority.medium {
    background: #fef3e5;
    color: #d97706;
  }

  .priority.low {
    background: #f0fdf4;
    color: #16a34a;
  }

  .improvement-card p {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
  }

  .example {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    font-style: italic;
    font-size: 13px;
  }

  .skill-gap-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #764ba2;
  }

  .skill-gap-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .skill-gap-card p {
    margin: 5px 0;
    color: #666;
    font-size: 14px;
  }

  .job-target-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #667eea;
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .job-header h4 {
    margin: 0;
    color: #333;
    font-size: 16px;
  }

  .match-score {
    background: #e8f0fe;
    color: #667eea;
    padding: 4px 10px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 600;
  }

  .job-comparison-input {
    margin-bottom: 30px;
  }

  .job-comparison-input h3 {
    color: #333;
    margin-bottom: 15px;
  }

  .job-comparison-input textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    resize: vertical;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
  }

  .job-comparison-input textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  .compare-btn {
    margin-top: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .compare-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .compare-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .comparison-result {
    background: #f9f9f9;
    padding: 30px;
    border-radius: 12px;
  }

  .match-score-large {
    text-align: center;
    margin-bottom: 30px;
  }

  .score-circle-large {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    color: white;
    font-size: 36px;
    font-weight: 700;
  }

  .match-score-large p {
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }

  .breakdown {
    margin-bottom: 30px;
  }

  .breakdown-item {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    gap: 15px;
    align-items: center;
    margin-bottom: 20px;
  }

  .breakdown-item span {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.5s ease;
  }

  .readiness {
    text-align: center;
  }

  .readiness-badge {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
  }

  .readiness-badge.ready {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .readiness-badge.good_fit {
    background: #e3f2fd;
    color: #1565c0;
  }

  .readiness-badge.needs_preparation {
    background: #fff3e0;
    color: #e65100;
  }

  .history-section {
    background: white;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .history-section h2 {
    margin: 0 0 20px 0;
    color: #333;
  }

  .analyses-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }

  .analysis-card {
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f7 100%);
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
  }

  .analysis-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }

  .card-content h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 16px;
  }

  .card-content p {
    margin: 0 0 10px 0;
    color: #999;
    font-size: 12px;
  }

  .card-score {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }

  .card-actions {
    display: flex;
    gap: 10px;
  }

  .view-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .view-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  .delete-btn {
    background: #fee;
    color: #c33;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover {
    background: #fdd;
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .analysis-tabs {
      flex-direction: column;
    }

    .strength-weakness {
      grid-template-columns: 1fr;
    }

    .scores-grid {
      grid-template-columns: 1fr;
    }

    .analysis-card {
      flex-direction: column;
      align-items: start;
    }

    .card-actions {
      width: 100%;
      margin-top: 15px;
    }

    .upload-box {
      padding: 20px;
    }
  }
`;

export default function PremiumResumeParser() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume-parser/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses);
      }
    } catch (err) {
      setError('Failed to fetch analyses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume-parser/parse', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Resume parsed successfully!');
        setSelectedAnalysis(data);
        setActiveTab('report');
        fetchAnalyses();
        e.target.value = '';
      } else {
        setError(data.error || 'Failed to parse resume');
      }
    } catch (err) {
      setError('Error uploading resume: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume-parser/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Analysis deleted successfully');
        fetchAnalyses();
        if (selectedAnalysis?.analysisId === id) {
          setSelectedAnalysis(null);
        }
      }
    } catch (err) {
      setError('Failed to delete analysis');
    }
  };

  const handleCompareWithJob = async () => {
    if (!selectedAnalysis?.analysisId || !jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    try {
      setComparing(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume-parser/compare/${selectedAnalysis.analysisId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobDescription })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedAnalysis(prev => ({
          ...prev,
          latestComparison: data.comparison
        }));
        setSuccess('Job comparison completed!');
        setJobDescription('');
      } else {
        setError(data.error || 'Comparison failed');
      }
    } catch (err) {
      setError('Error comparing: ' + err.message);
    } finally {
      setComparing(false);
    }
  };

  const ScoreDisplay = ({ score, label }) => (
    <div className="score-box">
      <div className="score-circle">
        <span className="score-value">{score}</span>
      </div>
      <p className="score-label">{label}</p>
    </div>
  );

  const StrengthWeakness = ({ data }) => (
    <div className="strength-weakness">
      <div className="sw-section">
        <h4>💪 Strengths</h4>
        <ul>
          {data.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      <div className="sw-section">
        <h4>⚠️ Areas for Improvement</h4>
        <ul>
          {data.analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </div>
    </div>
  );

  return (
    <div>
      <style>{styles}</style>
      <div className="premium-resume-parser">
        <div className="parser-header">
          <div className="header-content">
            <Zap className="header-icon" />
            <div>
              <h1>Premium AI Resume Parser</h1>
              <p>Get instant AI-powered insights from your resume</p>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="parser-container">
          {activeTab === 'upload' && !selectedAnalysis && (
            <div className="upload-section">
              <div className="upload-box">
                <Upload size={48} />
                <h2>Upload Your Resume</h2>
                <p>Supported formats: PDF, DOC, DOCX, TXT</p>
                <p className="file-size">Maximum file size: 5MB</p>
                <label className="upload-input">
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <span className={`upload-button ${uploading ? 'loading' : ''}`}>
                    {uploading ? 'Analyzing...' : 'Select Resume'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {selectedAnalysis && (
            <div className="analysis-view">
              <button 
                className="back-button" 
                onClick={() => { setSelectedAnalysis(null); setActiveTab('upload'); }}
              >
                ← Back to Upload
              </button>

              <div className="analysis-tabs">
                <button 
                  className={`tab ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  📊 Full Report
                </button>
                <button 
                  className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  💡 Recommendations
                </button>
                <button 
                  className={`tab ${activeTab === 'job-match' ? 'active' : ''}`}
                  onClick={() => setActiveTab('job-match')}
                >
                  🎯 Job Match
                </button>
              </div>

              {activeTab === 'report' && (
                <div className="report-content">
                  <div className="personal-info">
                    <h2>{selectedAnalysis.parsedData.personalInfo.name}</h2>
                    <div className="contact-info">
                      {selectedAnalysis.parsedData.personalInfo.email && (
                        <span>📧 {selectedAnalysis.parsedData.personalInfo.email}</span>
                      )}
                      {selectedAnalysis.parsedData.personalInfo.phone && (
                        <span>📱 {selectedAnalysis.parsedData.personalInfo.phone}</span>
                      )}
                      {selectedAnalysis.parsedData.personalInfo.location && (
                        <span>📍 {selectedAnalysis.parsedData.personalInfo.location}</span>
                      )}
                    </div>
                  </div>

                  <div className="scores-grid">
                    <ScoreDisplay 
                      score={selectedAnalysis.parsedData.analysis.overall_score} 
                      label="Overall Score"
                    />
                    <ScoreDisplay 
                      score={selectedAnalysis.parsedData.keywords.ats_score} 
                      label="ATS Score"
                    />
                    <div className="exp-level">
                      <span className="level-badge">{selectedAnalysis.parsedData.analysis.experienceLevel}</span>
                      <p>Experience Level</p>
                    </div>
                  </div>

                  <StrengthWeakness data={selectedAnalysis.parsedData} />

                  {selectedAnalysis.parsedData.skills.technical.length > 0 && (
                    <div className="section">
                      <h3>🛠️ Technical Skills</h3>
                      <div className="skills-list">
                        {selectedAnalysis.parsedData.skills.technical.map((s, i) => (
                          <span key={i} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAnalysis.parsedData.experience.length > 0 && (
                    <div className="section">
                      <h3>💼 Experience</h3>
                      {selectedAnalysis.parsedData.experience.map((exp, i) => (
                        <div key={i} className="experience-card">
                          <div className="exp-header">
                            <h4>{exp.jobTitle}</h4>
                            <span className="duration">{exp.duration}</span>
                          </div>
                          <p className="company">{exp.company}</p>
                          <p className="description">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAnalysis.parsedData.education.length > 0 && (
                    <div className="section">
                      <h3>🎓 Education</h3>
                      {selectedAnalysis.parsedData.education.map((edu, i) => (
                        <div key={i} className="education-card">
                          <h4>{edu.degree} in {edu.field}</h4>
                          <p>{edu.institution}</p>
                          <p className="meta">Graduated: {edu.graduationYear}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="recommendations-content">
                  {selectedAnalysis.recommendations?.resumeImprovements?.length > 0 && (
                    <div className="section">
                      <h3>✏️ Resume Improvements</h3>
                      {selectedAnalysis.recommendations.resumeImprovements.map((imp, i) => (
                        <div key={i} className="improvement-card">
                          <div className="imp-header">
                            <h4>{imp.section}</h4>
                            <span className={`priority ${imp.priority}`}>{imp.priority}</span>
                          </div>
                          <p><strong>Issue:</strong> {imp.currentIssue}</p>
                          <p><strong>Recommendation:</strong> {imp.recommendation}</p>
                          <p className="example"><strong>Example:</strong> {imp.example}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAnalysis.recommendations?.skillGaps?.length > 0 && (
                    <div className="section">
                      <h3>🚀 Skill Gaps to Close</h3>
                      {selectedAnalysis.recommendations.skillGaps.map((gap, i) => (
                        <div key={i} className="skill-gap-card">
                          <h4>{gap.skill}</h4>
                          <p><strong>Learning Path:</strong> {gap.learningPath}</p>
                          <p><strong>Est. Time:</strong> {gap.estimatedTime}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedAnalysis.recommendations?.jobTargets?.length > 0 && (
                    <div className="section">
                      <h3>🎯 Recommended Job Roles</h3>
                      {selectedAnalysis.recommendations.jobTargets.map((job, i) => (
                        <div key={i} className="job-target-card">
                          <div className="job-header">
                            <h4>{job.jobTitle}</h4>
                            <span className="match-score">{job.matchScore}% match</span>
                          </div>
                          <p>{job.why}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'job-match' && (
                <div className="job-match-content">
                  <div className="job-comparison-input">
                    <h3>📋 Compare with Job Description</h3>
                    <textarea 
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows="8"
                    />
                    <button 
                      className="compare-btn"
                      onClick={handleCompareWithJob}
                      disabled={comparing}
                    >
                      {comparing ? 'Analyzing...' : '🔍 Analyze Match'}
                    </button>
                  </div>

                  {selectedAnalysis.latestComparison && (
                    <div className="comparison-result">
                      <div className="match-score-large">
                        <div className="score-circle-large">
                          {selectedAnalysis.latestComparison.overallMatchScore}%
                        </div>
                        <p>Overall Match</p>
                      </div>

                      <div className="breakdown">
                        <div className="breakdown-item">
                          <span>Skills Match</span>
                          <div className="bar">
                            <div 
                              className="fill" 
                              style={{width: `${selectedAnalysis.latestComparison.matchBreakdown.skillsMatch.score}%`}}
                            ></div>
                          </div>
                          <span>{selectedAnalysis.latestComparison.matchBreakdown.skillsMatch.score}%</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Experience Match</span>
                          <div className="bar">
                            <div 
                              className="fill" 
                              style={{width: `${selectedAnalysis.latestComparison.matchBreakdown.experienceMatch.score}%`}}
                            ></div>
                          </div>
                          <span>{selectedAnalysis.latestComparison.matchBreakdown.experienceMatch.score}%</span>
                        </div>
                      </div>

                      <div className="readiness">
                        <p className={`readiness-badge ${selectedAnalysis.latestComparison.readiness}`}>
                          {selectedAnalysis.latestComparison.readiness.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && !selectedAnalysis && analyses.length > 0 && (
            <div className="history-section">
              <h2>📚 Your Analysis History</h2>
              <div className="analyses-list">
                {analyses.map(analysis => (
                  <div key={analysis._id} className="analysis-card">
                    <div className="card-content">
                      <h4>{analysis.fileName}</h4>
                      <p>{new Date(analysis.createdAt).toLocaleDateString()}</p>
                      <div className="card-score">
                        Score: {analysis.parsedData.analysis.overall_score}%
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-btn"
                        onClick={() => { setSelectedAnalysis(analysis); setActiveTab('report'); }}
                      >
                        View
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(analysis._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}