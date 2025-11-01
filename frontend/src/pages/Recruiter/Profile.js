import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    recruiterProfile: {
      companyName: '',
      designation: '',
      companyWebsite: '',
      companyDescription: '',
      companyLogo: ''
    }
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        recruiterProfile: {
          companyName: user.recruiterProfile?.companyName || '',
          designation: user.recruiterProfile?.designation || '',
          companyWebsite: user.recruiterProfile?.companyWebsite || '',
          companyDescription: user.recruiterProfile?.companyDescription || '',
          companyLogo: user.recruiterProfile?.companyLogo || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('recruiterProfile.')) {
      const field = name.split('.')[1];
      setProfileData({
        ...profileData,
        recruiterProfile: {
          ...profileData.recruiterProfile,
          [field]: value
        }
      });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
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
      <h1>Recruiter Profile</h1>

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

            <div className="form-group">
              <label>Designation</label>
              <input
                type="text"
                name="recruiterProfile.designation"
                value={profileData.recruiterProfile.designation}
                onChange={handleChange}
                placeholder="e.g., HR Manager"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Company Information</h2>
            
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="recruiterProfile.companyName"
                value={profileData.recruiterProfile.companyName}
                onChange={handleChange}
                placeholder="Your company name"
              />
            </div>

            <div className="form-group">
              <label>Company Website</label>
              <input
                type="url"
                name="recruiterProfile.companyWebsite"
                value={profileData.recruiterProfile.companyWebsite}
                onChange={handleChange}
                placeholder="https://www.company.com"
              />
            </div>

            <div className="form-group">
              <label>Company Logo URL</label>
              <input
                type="url"
                name="recruiterProfile.companyLogo"
                value={profileData.recruiterProfile.companyLogo}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Company Description</label>
              <textarea
                name="recruiterProfile.companyDescription"
                value={profileData.recruiterProfile.companyDescription}
                onChange={handleChange}
                rows="6"
                placeholder="Tell us about your company..."
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