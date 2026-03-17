import React, { useState } from 'react';
import { Search, Download, Eye, X } from 'lucide-react';

const styles = `
  .qr-scanner-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .scanner-header {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .scanner-header h1 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 28px;
  }

  .scanner-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .scanner-section {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .search-box {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-input {
    flex: 1;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .search-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .search-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .student-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .student-card {
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f7 100%);
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .student-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }

  .student-card h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 18px;
  }

  .student-info {
    color: #666;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 15px;
  }

  .student-info p {
    margin: 5px 0;
  }

  .completion-badge {
    display: inline-block;
    background: #667eea;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 15px;
  }

  .student-actions {
    display: flex;
    gap: 10px;
  }

  .view-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .view-btn:hover {
    background: #764ba2;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 15px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 22px;
  }

  .modal-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-body {
    padding: 30px;
  }

  .profile-section {
    margin-bottom: 30px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 20px;
  }

  .profile-section h3 {
    color: #333;
    margin: 0 0 15px 0;
    font-size: 18px;
  }

  .profile-section:last-child {
    border-bottom: none;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .info-item {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
  }

  .info-label {
    color: #666;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .info-value {
    color: #333;
    font-size: 14px;
    font-weight: 500;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .skill-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .access-log {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    max-height: 200px;
    overflow-y: auto;
  }

  .access-item {
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
    font-size: 13px;
    color: #666;
  }

  .access-item:last-child {
    border-bottom: none;
  }

  .alert {
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .alert-info {
    background: #e3f2fd;
    color: #1565c0;
    border-left: 4px solid #1565c0;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #667eea;
  }

  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
`;

export default function QRScanner() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log("🔍 Searching for:", searchTerm);
      console.log("Token present:", !!token);

      const response = await fetch(`/api/student-profile/admin/search/${searchTerm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("📥 Response status:", response.status);

      if (response.status === 403) {
        console.error("❌ 403 Forbidden - Not authorized");
        setStudents([]);
        alert('You do not have permission to access this feature. Please login as admin.');
        return;
      }

      if (response.status === 401) {
        console.error("❌ 401 Unauthorized - Token invalid");
        localStorage.removeItem('token');
        alert('Your session has expired. Please login again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("✅ Search results:", data);
      
      if (data.success) {
        setStudents(data.profiles);
      } else {
        console.error("❌ Search failed:", data.error);
        setStudents([]);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
  };

  const handleDownloadData = () => {
    const dataStr = JSON.stringify(selectedStudent, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedStudent.personalInfo.firstName}_${selectedStudent.personalInfo.lastName}_profile.json`;
    link.click();
  };

  return (
    <div>
      <style>{styles}</style>
      <div className="qr-scanner-container">
        <div className="container">
          <div className="scanner-header">
            <h1>🔍 Student QR Code Scanner</h1>
            <p>Search and view student profiles by scanning QR code or searching by name/email</p>
          </div>

          <div className="scanner-section">
            <div className="alert alert-info">
              <span>💡 Tip: Search by student name, email, or QR code ID</span>
            </div>

            <div className="search-box">
              <input 
                type="text"
                className="search-input"
                placeholder="Enter student name, email, or QR code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="search-btn" disabled={loading}>
                <Search size={18} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner">⏳</div>
              </div>
            )}

            {students.length > 0 && (
              <div>
                <p style={{ color: '#666', marginBottom: '20px' }}>Found {students.length} student(s)</p>
                <div className="student-list">
                  {students.map((student) => (
                    <div key={student._id} className="student-card">
                      <h3>{student.personalInfo.firstName} {student.personalInfo.lastName}</h3>
                      <div className="student-info">
                        <p><strong>📧 Email:</strong> {student.personalInfo.email}</p>
                        <p><strong>📱 Phone:</strong> {student.personalInfo.phone || 'N/A'}</p>
                        <p><strong>🎓 Institution:</strong> {student.education.institution || 'N/A'}</p>
                        <p><strong>🎯 QR:</strong> {student.qrCode.code.substring(0, 8)}...</p>
                      </div>
                      <div className="completion-badge">
                        {student.overallProfileCompletion}% Complete
                      </div>
                      <div className="student-actions">
                        <button onClick={() => handleViewProfile(student)} className="view-btn">
                          <Eye size={16} />
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && students.length === 0 && searchTerm && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No students found. Try searching with different keywords.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal - Student Detail */}
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedStudent.personalInfo.firstName} {selectedStudent.personalInfo.lastName}</h2>
                <button className="modal-close" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Personal Info */}
                <div className="profile-section">
                  <h3>👤 Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{selectedStudent.personalInfo.email}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{selectedStudent.personalInfo.phone || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Date of Birth</div>
                      <div className="info-value">{selectedStudent.personalInfo.dateOfBirth ? new Date(selectedStudent.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Gender</div>
                      <div className="info-value">{selectedStudent.personalInfo.gender || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="profile-section">
                  <h3>📍 Address</h3>
                  <div className="info-item">
                    <div className="info-value">
                      {selectedStudent.address.street && `${selectedStudent.address.street}, `}
                      {selectedStudent.address.city && `${selectedStudent.address.city}, `}
                      {selectedStudent.address.state && `${selectedStudent.address.state} `}
                      {selectedStudent.address.zipCode && `${selectedStudent.address.zipCode}`}
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="profile-section">
                  <h3>🎓 Education</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Institution</div>
                      <div className="info-value">{selectedStudent.education.institution || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Degree</div>
                      <div className="info-value">{selectedStudent.education.degree || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Field</div>
                      <div className="info-value">{selectedStudent.education.field || 'N/A'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">CGPA</div>
                      <div className="info-value">{selectedStudent.education.cgpa || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedStudent.skills && (
                  <div className="profile-section">
                    <h3>🛠️ Skills</h3>
                    <div>
                      {selectedStudent.skills.technical && selectedStudent.skills.technical.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <strong style={{ color: '#666', fontSize: '12px' }}>TECHNICAL</strong>
                          <div className="skills-list">
                            {selectedStudent.skills.technical.map((skill, i) => (
                              <span key={i} className="skill-badge">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedStudent.skills.soft && selectedStudent.skills.soft.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <strong style={{ color: '#666', fontSize: '12px' }}>SOFT SKILLS</strong>
                          <div className="skills-list">
                            {selectedStudent.skills.soft.map((skill, i) => (
                              <span key={i} className="skill-badge">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {selectedStudent.socialLinks && (
                  <div className="profile-section">
                    <h3>🔗 Social Links</h3>
                    <div className="info-grid">
                      {selectedStudent.socialLinks.linkedin && (
                        <div className="info-item">
                          <div className="info-label">LinkedIn</div>
                          <div className="info-value"><a href={selectedStudent.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">View Profile</a></div>
                        </div>
                      )}
                      {selectedStudent.socialLinks.github && (
                        <div className="info-item">
                          <div className="info-label">GitHub</div>
                          <div className="info-value"><a href={selectedStudent.socialLinks.github} target="_blank" rel="noopener noreferrer">View Profile</a></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Access Log */}
                {selectedStudent.qrCode && selectedStudent.qrCode.lastAccessedBy && selectedStudent.qrCode.lastAccessedBy.length > 0 && (
                  <div className="profile-section">
                    <h3>📋 Access Log</h3>
                    <div className="access-log">
                      {selectedStudent.qrCode.lastAccessedBy.map((access, i) => (
                        <div key={i} className="access-item">
                          <strong>{access.adminName}</strong> accessed this profile on {new Date(access.accessedAt).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button onClick={handleDownloadData} style={{ 
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  <Download size={18} />
                  Download Full Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}