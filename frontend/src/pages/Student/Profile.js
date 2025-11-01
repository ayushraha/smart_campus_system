import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    studentProfile: {
      rollNumber: '',
      department: '',
      year: '',
      cgpa: '',
      skills: [],
      resume: ''
    }
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        studentProfile: {
          rollNumber: user.studentProfile?.rollNumber || '',
          department: user.studentProfile?.department || '',
          year: user.studentProfile?.year || '',
          cgpa: user.studentProfile?.cgpa || '',
          skills: user.studentProfile?.skills || [],
          resume: user.studentProfile?.resume || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('studentProfile.')) {
      const field = name.split('.')[1];
      setProfileData({
        ...profileData,
        studentProfile: {
          ...profileData.studentProfile,
          [field]: value
        }
      });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !profileData.studentProfile.skills.includes(skillInput.trim())) {
      setProfileData({
        ...profileData,
        studentProfile: {
          ...profileData.studentProfile,
          skills: [...profileData.studentProfile.skills, skillInput.trim()]
        }
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setProfileData({
      ...profileData,
      studentProfile: {
        ...profileData.studentProfile,
        skills: profileData.studentProfile.skills.filter(s => s !== skill)
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Personal Information</h2>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Academic Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  name="studentProfile.rollNumber"
                  value={profileData.studentProfile.rollNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="studentProfile.department"
                  value={profileData.studentProfile.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Year of Study</label>
                <select
                  name="studentProfile.year"
                  value={profileData.studentProfile.year}
                  onChange={handleChange}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  name="studentProfile.cgpa"
                  value={profileData.studentProfile.cgpa}
                  onChange={handleChange}
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Skills</h2>
            
            <div className="skills-input">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" onClick={addSkill} className="btn-secondary">
                Add
              </button>
            </div>

            <div className="skills-list">
              {profileData.studentProfile.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>Resume</h2>
            
            <div className="form-group">
              <label>Resume URL</label>
              <input
                type="url"
                name="studentProfile.resume"
                value={profileData.studentProfile.resume}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;