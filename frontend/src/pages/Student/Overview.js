import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';

const Overview = () => {
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
    fetchData();
  }, []);

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

  return (
    <div className="overview">
      <h1>Welcome Back!</h1>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.shortlisted}</h3>
            <p>Shortlisted</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.selected}</h3>
            <p>Selected</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <FiBriefcase />
          </div>
          <div className="stat-info">
            <h3>{stats.availableJobs}</h3>
            <p>Available Jobs</p>
          </div>
        </div>
      </div>

      <div className="recent-applications">
        <h2>Recent Applications</h2>
        {recentApplications.length > 0 ? (
          <div className="applications-list">
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
        ) : (
          <p className="no-data">No applications yet. Start applying to jobs!</p>
        )}
      </div>
    </div>
  );
};

export default Overview;