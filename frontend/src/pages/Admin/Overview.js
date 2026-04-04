import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiBriefcase, FiFileText, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const Overview = () => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    shortlisted: 0,
    selected: 0,
    availableJobs: 0,
    pendingJobs: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/applications?limit=5')
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

      {/* ⚠️ Pending Job Approvals Alert */}
      {stats.pendingJobs > 0 && (
        <Link to="/admin/jobs" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd, #fef8e7)',
            border: '1px solid #ffc107',
            borderLeft: '5px solid #e6a100',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(230,161,0,0.15)'
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(230,161,0,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(230,161,0,0.15)'}
          >
            <div style={{
              background: '#ffc107',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FiAlertCircle size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#856404', fontSize: '16px', marginBottom: '3px' }}>
                ⏳ {stats.pendingJobs} Job{stats.pendingJobs > 1 ? 's' : ''} Awaiting Your Approval
              </div>
              <div style={{ color: '#856404', fontSize: '13px' }}>
                Recruiters have posted jobs that are not yet visible to students. Click to review and approve.
              </div>
            </div>
            <div style={{
              background: '#e6a100',
              color: '#fff',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              Review Now →
            </div>
          </div>
        </Link>
      )}

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
            <p>Active Jobs</p>
          </div>
        </div>

        {/* Pending Jobs approval count card */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fff3cd, #fef8e7)', border: '1px solid #ffc107' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,193,7,0.2)', color: '#e6a100' }}>
            <FiClock />
          </div>
          <div className="stat-info">
            <h3 style={{ color: '#856404' }}>{stats.pendingJobs}</h3>
            <p style={{ color: '#856404' }}>Jobs Pending Approval</p>
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