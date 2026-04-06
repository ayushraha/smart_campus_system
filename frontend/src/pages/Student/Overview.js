import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiFileText, FiCheckCircle, FiClock, FiStar, FiUsers, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    shortlisted: 0,
    selected: 0,
    availableJobs: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userType === 'current') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        axios.get('/api/student/dashboard/stats'),
        axios.get('/api/student/applications?limit=5')
      ]);
      setStats(statsRes.data);
      setRecentApplications(appsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (user?.userType === 'alumni') {
    return (
      <div className="overview alumni-mode">
        <div className="alumni-welcome-card">
          <div className="alumni-badge-main">Graduated / Alumni</div>
          <h1>Welcome back to the Campus, {user.name.split(' ')[0]}!</h1>
          <p>As an esteemed graduate of JSPM, you can now give back to the community as a Mentor.</p>
          
          <div className="alumni-actions">
            <Link to="/student/become-mentor" className="btn-mentor-cta">
              <FiStar /> Apply to Become a Mentor
            </Link>
            <Link to="/student/ai-mentor-match" className="btn-network-cta">
              <FiUsers /> Join Mentorship Network
            </Link>
          </div>
        </div>

        <div className="alumni-benefits-grid">
          <div className="benefit-card">
            <FiStar className="benefit-icon" />
            <h3>Share Knowledge</h3>
            <p>Guide juniors on how to crack interviews and handle real-world challenges.</p>
          </div>
          <div className="benefit-card">
            <FiUsers className="benefit-icon" />
            <h3>Build Network</h3>
            <p>Connect with other alumni and industry professionals in our exclusive network.</p>
          </div>
          <div className="benefit-card">
            <FiMessageSquare className="benefit-icon" />
            <h3>Mock Interviews</h3>
            <p>Help students by conducting mock interviews and providing valuable feedback.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview">
      {/* Existing Current Student Overview Content */}
      <h1 className="overview-title">Placement Snapshot</h1>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><FiFileText /></div>
          <div className="stat-info">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        {/* ... (keep other stat cards) ... */}
        <div className="stat-card yellow">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-info">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><FiCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats.shortlisted}</h3>
            <p>Shortlisted</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><FiCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats.selected}</h3>
            <p>Selected</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><FiBriefcase /></div>
          <div className="stat-info">
            <h3>{stats.availableJobs}</h3>
            <p>Available Jobs</p>
          </div>
        </div>
      </div>

      <div className="recent-applications">
        <h2>Recent Applications</h2>
        {recentApplications.map((app) => (
          <div key={app._id} className="application-item">
            <div className="app-info">
              <h3>{app.jobId?.title}</h3>
              <p>{app.jobId?.company} - {app.jobId?.location}</p>
            </div>
            <span className={`badge ${app.status}`}>{app.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Overview;