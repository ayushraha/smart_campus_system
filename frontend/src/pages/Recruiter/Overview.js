import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';

const Overview = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    pendingJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlisted: 0,
    selected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/recruiter/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="overview">
      <h1>Recruiter Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <FiBriefcase />
          </div>
          <div className="stat-info">
            <h3>{stats.totalJobs}</h3>
            <p>Total Jobs Posted</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <FiBriefcase />
          </div>
          <div className="stat-info">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats.pendingJobs}</h3>
            <p>Pending Approval</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card teal">
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
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn">Post New Job</button>
          <button className="action-btn">Review Applications</button>
          <button className="action-btn">View Reports</button>
        </div>
      </div>
    </div>
  );
};

export default Overview;