import { Download } from 'lucide-react';

const styles = `
  .profile-form-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .form-header {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .form-header h1 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 28px;
  }

  .form-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .progress-bar {
    background: #e0e0e0;
    height: 8px;
    border-radius: 4px;
    margin-top: 20px;
    overflow: hidden;
  }

  .progress-fill {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-text {
    margin-top: 10px;
    color: #666;
    font-size: 12px;
    font-weight: 600;
  }

  .form-section {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 25px;
  }

  .section-header h2 {
    margin: 0;
    color: #333;
    font-size: 22px;
  }

  .section-complete {
    color: #16a34a;
    font-size: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    color: #333;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .input-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }

  .input-tag {
    background: #f0f0f0;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-tag button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 18px;
  }

  .add-item-btn {
    background: #f0f0f0;
    color: #667eea;
    border: 2px dashed #667eea;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-top: 10px;
  }

  .add-item-btn:hover {
    background: #667eea;
    color: white;
  }

  .item-card {
    background: #f9f9f9;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .item-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .item-card h4 {
    margin: 0;
    color: #333;
    font-size: 16px;
  }

  .delete-btn {
    background: #fee;
    color: #c33;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }

  .button-group {
    display: flex;
    gap: 15px;
    margin-top: 30px;
  }

  .submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 40px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
    flex: 1;
  }

  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .download-btn {
    background: #16a34a;
    color: white;
    padding: 15px 40px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .download-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22, 163, 74, 0.4);
  }

  .qr-section {
    text-align: center;
    background: #f9f9f9;
    padding: 30px;
    border-radius: 10px;
    margin-top: 30px;
  }

  .qr-image {
    max-width: 200px;
    margin: 20px auto;
    border: 3px solid #667eea;
    border-radius: 10px;
  }

  .alert {
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .alert-success {
    background: #f0fdf4;
    color: #16a34a;
    border-left: 4px solid #16a34a;
  }

  .alert-info {
    background: #e3f2fd;
    color: #1565c0;
    border-left: 4px solid #1565c0;
  }

  .loading {
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

export default function StudentProfileForm() {
  const [profileData, setProfileData] = useState({
    personalInfo: { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '' },
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    education: { institution: '', degree: '', field: '', startDate: '', endDate: '', cgpa: '' },
    skills: { technical: [], soft: [], languages: [], tools: [] },
    workExperience: [],
    projects: [],
    certifications: [],
    socialLinks: { linkedin: '', github: '', portfolio: '', twitter: '' },
    careerPreferences: { preferredRoles: [], preferredIndustries: [], willingToRelocate: false, workPreference: '' },
  });

  const [qrCode, setQrCode] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (section, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAddSkill = (skillType, skill) => {
    if (skill.trim()) {
      setProfileData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [skillType]: [...prev.skills[skillType], skill]
        }
      }));
    }
  };

  const handleRemoveSkill = (skillType, index) => {
    setProfileData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillType]: prev.skills[skillType].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.personalInfo.firstName.trim()) {
      setMessage('❌ Error: First name is required');
      return;
    }
    
    if (!profileData.personalInfo.email.trim()) {
      setMessage('❌ Error: Email is required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      console.log("📤 Submitting profile data...");
      console.log("Profile data:", profileData);

      const response = await fetch('/api/student-profile/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      console.log("📥 Response status:", response.status);

      const data = await response.json();
      
      console.log("Response data:", data);
      
      if (data.success) {
        setQrCode(data.qrCode);
        setProfileCompletion(data.profileCompletion);
        setMessage('✅ Profile submitted successfully! Your QR code has been generated.');
      } else {
        setMessage(`❌ Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = 'student_id_qr.png';
      link.click();
    }
  };

  return (
    <div>
      <style>{styles}</style>
      <div className="profile-form-container">
        <div className="container">
          <div className="form-header">
            <h1>📋 Complete Your Student Profile</h1>
            <p>Fill in your information to generate your unique QR code ID</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${profileCompletion}%` }}></div>
            </div>
            <div className="progress-text">Profile {profileCompletion}% Complete</div>
          </div>

          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-info'}`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-section">
              <div className="section-header">
                <h2>👤 Personal Information</h2>
                {profileData.personalInfo.firstName && <span className="section-complete">✓</span>}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    value={profileData.personalInfo.firstName}
                    onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    value={profileData.personalInfo.lastName}
                    onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    value={profileData.personalInfo.email}
                    onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={profileData.personalInfo.phone}
                    onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    value={profileData.personalInfo.dateOfBirth}
                    onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    value={profileData.personalInfo.gender}
                    onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-section">
              <div className="section-header">
                <h2>📍 Address</h2>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Street</label>
                  <input 
                    type="text" 
                    value={profileData.address.street}
                    onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={profileData.address.city}
                    onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    value={profileData.address.state}
                    onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input 
                    type="text" 
                    value={profileData.address.zipCode}
                    onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text" 
                    value={profileData.address.country}
                    onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="form-section">
              <div className="section-header">
                <h2>🎓 Education</h2>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Institution *</label>
                  <input 
                    type="text" 
                    value={profileData.education.institution}
                    onChange={(e) => handleInputChange('education', 'institution', e.target.value)}
                    placeholder="University Name"
                  />
                </div>
                <div className="form-group">
                  <label>Degree *</label>
                  <input 
                    type="text" 
                    value={profileData.education.degree}
                    onChange={(e) => handleInputChange('education', 'degree', e.target.value)}
                    placeholder="Bachelor of Science"
                  />
                </div>
                <div className="form-group">
                  <label>Field of Study</label>
                  <input 
                    type="text" 
                    value={profileData.education.field}
                    onChange={(e) => handleInputChange('education', 'field', e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="form-group">
                  <label>CGPA</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={profileData.education.cgpa}
                    onChange={(e) => handleInputChange('education', 'cgpa', e.target.value)}
                    placeholder="3.8"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="form-section">
              <div className="section-header">
                <h2>🛠️ Skills</h2>
              </div>
              <SkillsSection profileData={profileData} onAddSkill={handleAddSkill} onRemoveSkill={handleRemoveSkill} />
            </div>

            {/* Social Links */}
            <div className="form-section">
              <div className="section-header">
                <h2>🔗 Social Links</h2>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input 
                    type="url" 
                    value={profileData.socialLinks.linkedin}
                    onChange={(e) => handleInputChange('socialLinks', 'linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="form-group">
                  <label>GitHub</label>
                  <input 
                    type="url" 
                    value={profileData.socialLinks.github}
                    onChange={(e) => handleInputChange('socialLinks', 'github', e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="form-group">
                  <label>Portfolio</label>
                  <input 
                    type="url" 
                    value={profileData.socialLinks.portfolio}
                    onChange={(e) => handleInputChange('socialLinks', 'portfolio', e.target.value)}
                    placeholder="Your portfolio website"
                  />
                </div>
                <div className="form-group">
                  <label>Twitter</label>
                  <input 
                    type="url" 
                    value={profileData.socialLinks.twitter}
                    onChange={(e) => handleInputChange('socialLinks', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="form-section">
              <div className="button-group">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <span className="loading">⏳</span> : '✅'} Submit & Generate QR Code
                </button>
              </div>
            </div>
          </form>

          {/* QR Code Display */}
          {qrCode && (
            <div className="form-section">
              <div className="qr-section">
                <h3>🎫 Your Student ID QR Code</h3>
                <p>Show this QR code to admins for quick access to your profile</p>
                <img src={qrCode} alt="Student QR Code" className="qr-image" />
                <button onClick={handleDownloadQR} className="download-btn">
                  <Download size={18} />
                  Download QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillsSection({ profileData, onAddSkill, onRemoveSkill }) {
  const [inputValues, setInputValues] = useState({
    technical: '',
    soft: '',
    languages: '',
    tools: ''
  });

  const handleKeyPress = (e, skillType) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddSkill(skillType, inputValues[skillType]);
      setInputValues(prev => ({ ...prev, [skillType]: '' }));
    }
  };

  return (
    <div>
      {['technical', 'soft', 'languages', 'tools'].map(skillType => (
        <div key={skillType} style={{ marginBottom: '25px' }}>
          <label style={{ textTransform: 'capitalize', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
            {skillType === 'technical' && '💻 Technical Skills'}
            {skillType === 'soft' && '🤝 Soft Skills'}
            {skillType === 'languages' && '🌍 Languages'}
            {skillType === 'tools' && '⚙️ Tools & Platforms'}
          </label>
          <input
            type="text"
            value={inputValues[skillType]}
            onChange={(e) => setInputValues(prev => ({ ...prev, [skillType]: e.target.value }))}
            onKeyPress={(e) => handleKeyPress(e, skillType)}
            placeholder={`Add ${skillType} skill and press Enter`}
            style={{ marginBottom: '10px' }}
          />
          <div className="input-list">
            {profileData.skills[skillType]?.map((skill, index) => (
              <div key={index} className="input-tag">
                <span>{skill}</span>
                <button 
                  type="button"
                  onClick={() => onRemoveSkill(skillType, index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}