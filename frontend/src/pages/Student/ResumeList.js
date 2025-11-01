import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit, FiTrash2, FiDownload, FiEye, 
  FiUpload, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import './ResumeList.css';

const ResumeList = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resume/my-resumes');
      setResumes(response.data);
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
        fetchResumes();
      } catch (error) {
        toast.error('Error deleting resume');
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload PDF, DOC, or DOCX file only');
        return;
      }
      
      // Validate file size (5MB)
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

      const response = await axios.post('/api/resume/upload-parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Resume uploaded and parsed successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchResumes();
      
      // Navigate to edit the parsed resume
      navigate(`/student/resume/${response.data.resume._id}`);
    } catch (error) {
      toast.error('Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Loading resumes...</div>;

  return (
    <div className="resume-list">
      <div className="page-header">
        <div>
          <h1>My Resumes</h1>
          <p>Create, manage, and optimize your resumes</p>
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

      {resumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <FiAlertCircle className="empty-icon" />
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
                    onClick={() => navigate(`/student/resume/preview/${resume._id}`)}
                    className="btn-icon"
                    title="Preview"
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

                  {resume.aiAnalysis?.atsScore && (
                    <div className="stat-item">
                      <span className="stat-label">ATS Score</span>
                      <span className="stat-value score">{resume.aiAnalysis.atsScore}/100</span>
                    </div>
                  )}

                  <div className="stat-item">
                    <span className="stat-label">Last Updated</span>
                    <span className="stat-value">
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {resume.aiAnalysis?.overallRating && (
                  <div className={`rating-badge ${resume.aiAnalysis.overallRating}`}>
                    <FiCheckCircle /> {resume.aiAnalysis.overallRating}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button 
                  onClick={() => navigate(`/student/resume/analyze/${resume._id}`)}
                  className="btn-analyze"
                >
                  Analyze with AI
                </button>
                <button className="btn-download">
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