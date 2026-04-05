import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit, FiTrash2, FiDownload, FiEye, 
  FiUpload, FiCheckCircle, FiAlertCircle, FiActivity,
  FiFileText, FiTarget, FiTrendingUp, FiArrowRight
} from 'react-icons/fi';
import './ResumeList.css';

const ResumeList = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // ATS Checker State
  const [atsResumeId, setAtsResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [checkingAts, setCheckingAts] = useState(false);
  const [atsResult, setAtsResult] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resume/my-resumes');
      setResumes(response.data);
      if (response.data.length > 0 && !atsResumeId) {
        setAtsResumeId(response.data[0]._id);
      }
    } catch (error) {
      toast.error('Error fetching resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`/api/resume/${resumeId}`);
        toast.success('Resume deleted successfully');
        if (atsResumeId === resumeId) setAtsResumeId('');
        fetchResumes();
      } catch (error) {
        toast.error('Error deleting resume');
      }
    }
  };

  const handleDownload = (resume) => {
    const dataStr = JSON.stringify(resume, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resume.personalInfo?.firstName || 'My'}_Resume.json`;
    link.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload PDF, DOC, or DOCX file only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      toast.warning('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const parseResponse = await axios.post('/api/resume-parser/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!parseResponse.data.success) {
        throw new Error(parseResponse.data.error || "Parsing failed");
      }

      const parsedJson = parseResponse.data.parsedData || parseResponse.data.data;
      
      const normalizedData = {
        personalInfo: {
          firstName: parsedJson.personalInfo?.name?.split(' ')[0] || '',
          lastName: parsedJson.personalInfo?.name?.split(' ').slice(1).join(' ') || '',
          email: parsedJson.personalInfo?.email || '',
          phone: parsedJson.personalInfo?.phone || '',
          address: parsedJson.personalInfo?.location || '',
          professionalSummary: parsedJson.personalInfo?.summary || ''
        },
        skills: parsedJson.skills || { technical: [], soft: [], tools: [] },
        experience: (parsedJson.experience || []).map(exp => ({
          title: exp.jobTitle || '',
          company: exp.company || '',
          description: exp.description || '',
          startDate: exp.duration?.split('-')[0]?.trim() || '',
          endDate: exp.duration?.split('-')[1]?.trim() || '',
          responsibilities: typeof exp.description === 'string' ? exp.description.split('\n').filter(l => l.trim()) : []
        })),
        education: (parsedJson.education || []).map(edu => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          major: edu.field || '',
          endDate: edu.graduationYear || '',
          cgpa: edu.grade || ''
        })),
        projects: (parsedJson.projects || []).map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          technologies: proj.technologies || []
        })),
        template: 'professional'
      };

      const saveResponse = await axios.post('/api/resume', normalizedData);

      toast.success('Resume uploaded and parsed successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchResumes();
      
      const resumeId = saveResponse.data.resume?._id || saveResponse.data._id;
      if (resumeId) {
        navigate(`/student/resume/${resumeId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.message || 'Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  const handleATSCheck = async () => {
    if (!atsResumeId) {
      toast.warning('Please select a resume to test');
      return;
    }
    
    const selectedResume = resumes.find(r => r._id === atsResumeId);
    if (!selectedResume) return;

    setCheckingAts(true);
    setAtsResult(null);

    try {
      const response = await axios.post('/api/resume-parser/ats-check', {
        resumeData: selectedResume,
        jobDescription: jobDescription
      });

      if (response.data.success) {
        setAtsResult(response.data);
        toast.success('ATS Analysis Complete!');
      } else {
        throw new Error(response.data.error || 'Failed to analyze');
      }
    } catch (error) {
      console.error('ATS Error:', error);
      toast.error(error.message || 'Error running ATS check');
    } finally {
      setCheckingAts(false);
    }
  };

  if (loading) return <div className="loading">Loading resumes...</div>;

  return (
    <div className="resume-list">
      <div className="page-header">
        <div>
          <h1>My Resumes</h1>
          <p>Create, manage, and optimize your resumes for the ATS (Applicant Tracking System)</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowUploadModal(true)} className="btn-upload">
            <FiUpload /> Upload Resume
          </button>
          <button onClick={() => navigate('/student/resume/new')} className="btn-create">
            <FiPlus /> Create New Resume
          </button>
        </div>
      </div>

      {/* Premium ATS Score Checker Panel */}
      <div className="ats-checker-panel">
        <div className="ats-header">
          <div className="ats-title">
            <FiTarget className="ats-icon" />
            <div>
              <h2>Premium ATS Score Checker</h2>
              <p>Test your resume against real ATS algorithms before applying</p>
            </div>
          </div>
          <div className="ats-badge">AI Powered</div>
        </div>

        <div className="ats-controls">
          <div className="ats-input-group">
            <label>Select Resume to Test:</label>
            <select 
              value={atsResumeId} 
              onChange={(e) => setAtsResumeId(e.target.value)}
              className="ats-select"
            >
              <option value="" disabled>Select a resume...</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>
                  {r.personalInfo?.firstName}'s Resume ({r.template} template) - {new Date(r.updatedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="ats-input-group">
            <label>Job Description (Optional - For better keyword matching):</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job requirements or description here to see how well you match..."
              rows="3"
              className="ats-textarea"
            />
          </div>

          <button 
            className={`btn-ats-check ${checkingAts ? 'checking' : ''}`}
            onClick={handleATSCheck}
            disabled={checkingAts || !atsResumeId}
          >
            {checkingAts ? (
              <><FiActivity className="spin-icon" /> Analyzing your resume...</>
            ) : (
              <><FiActivity /> Check ATS Score Now</>
            )}
          </button>
        </div>

        {atsResult && (
          <div className="ats-result-dashboard">
            <div className="ats-score-overview">
              <div className="score-ring-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path className={`circle ${atsResult.atsScore >= 80 ? 'excellent' : atsResult.atsScore >= 60 ? 'good' : 'poor'}`}
                    strokeDasharray={`${atsResult.atsScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">{atsResult.atsScore}</text>
                </svg>
                <div className="score-grade">Grade {atsResult.grade}</div>
              </div>
              <div className="score-summary">
                <h3>Analysis Complete</h3>
                <p>{atsResult.summary}</p>
                <div className="strengths-list">
                  {atsResult.strengths?.slice(0,2).map((s,i) => <span key={i}><FiCheckCircle /> {s}</span>)}
                </div>
              </div>
            </div>

            <div className="ats-details-grid">
              <div className="ats-detail-card keywords">
                <h4>Keyword Analysis</h4>
                <div className="keyword-lists">
                  <div className="matched">
                    <h5>Matched Keywords ({atsResult.matchedKeywords?.length || 0})</h5>
                    <div className="chips">
                      {atsResult.matchedKeywords?.map((k,i) => <span key={i} className="chip success">{k}</span>)}
                    </div>
                  </div>
                  <div className="missing">
                    <h5>Missing Keywords ({atsResult.missingKeywords?.length || 0})</h5>
                    <div className="chips">
                      {atsResult.missingKeywords?.map((k,i) => <span key={i} className="chip danger">{k}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ats-detail-card sections">
                <h4>Section Scores</h4>
                <div className="section-bars">
                  {Object.entries(atsResult.sectionScores || {}).map(([section, score]) => (
                    <div key={section} className="section-bar-item">
                      <div className="section-bar-label">
                        <span>{section.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}</span>
                        <span>{score}/100</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${score}%`, background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {atsResult.improvements?.length > 0 && (
              <div className="ats-improvements">
                <h4>Actionable Improvements</h4>
                <div className="improvement-list">
                  {atsResult.improvements.map((imp, idx) => (
                    <div key={idx} className={`improvement-item priority-${imp.priority}`}>
                      <div className="improvement-content">
                        <h5>Fix {imp.section}: {imp.issue}</h5>
                        <p>{imp.fix}</p>
                      </div>
                      <button 
                        className="btn-fix-now"
                        onClick={() => navigate(`/student/resume/${atsResumeId}`)}
                      >
                        Fix Now <FiArrowRight />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {resumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <FiFileText className="empty-icon" />
            <h2>No resumes yet</h2>
            <p>Create your first resume or upload an existing one to get started</p>
            <div className="empty-actions">
              <button onClick={() => navigate('/student/resume/new')} className="btn-primary">
                <FiPlus /> Create Resume
              </button>
              <button onClick={() => setShowUploadModal(true)} className="btn-secondary">
                <FiUpload /> Upload Resume
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="resumes-grid">
          {resumes.map((resume) => (
            <div key={resume._id} className="resume-card">
              <div className="card-header">
                <div className="resume-info">
                  <h3>{resume.personalInfo?.firstName} {resume.personalInfo?.lastName}'s Resume</h3>
                  <p className="template-name">{resume.template} template</p>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => navigate(`/student/resume/${resume._id}`)}
                    className="btn-icon"
                    title="Edit"
                  >
                    <FiEdit />
                  </button>
                  <button 
                    onClick={() => navigate(`/student/resume/${resume._id}`)}
                    className="btn-icon"
                    title="View"
                  >
                    <FiEye />
                  </button>
                  <button 
                    onClick={() => handleDelete(resume._id)}
                    className="btn-icon danger"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="resume-stats">
                  <div className="stat-item">
                    <span className="stat-label">Completeness</span>
                    <div className="progress-bar-small">
                      <div 
                        className="progress-fill-small" 
                        style={{ width: `${resume.calculateCompleteness?.() || 0}%` }}
                      />
                    </div>
                    <span className="stat-value">{resume.calculateCompleteness?.() || 0}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Updated</span>
                    <span className="stat-value">
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button 
                  onClick={() => {
                    setAtsResumeId(resume._id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="btn-analyze"
                >
                  <FiTarget /> ATS Check
                </button>
                <button onClick={() => handleDownload(resume)} className="btn-download">
                  <FiDownload /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Resume</h2>
            <p className="modal-subtitle">Upload your existing resume (PDF, DOC, DOCX)</p>

            <div className="upload-area">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="resume-upload" className="upload-label">
                <FiUpload className="upload-icon" />
                <span className="upload-text">
                  {selectedFile ? selectedFile.name : 'Click to select file or drag and drop'}
                </span>
                <span className="upload-hint">PDF, DOC, DOCX up to 5MB</span>
              </label>
            </div>

            {selectedFile && (
              <div className="file-info">
                <FiCheckCircle className="success-icon" />
                <span>{selectedFile.name}</span>
                <span className="file-size">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            <div className="modal-actions">
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadAndParse} 
                disabled={!selectedFile || uploading}
                className="btn-upload-submit"
              >
                {uploading ? 'Uploading...' : 'Upload & Parse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeList;