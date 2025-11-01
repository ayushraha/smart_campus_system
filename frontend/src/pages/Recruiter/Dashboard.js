import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiBriefcase,
  FiFileText,
  FiUser,
  FiLogOut,
  FiPlusCircle,
  FiVideo
} from 'react-icons/fi';
import '../Admin/Admin.css'; // Use Admin CSS as base
import './Recruiter.css';

import Overview from './Overview';
import Jobs from './Jobs';
import Applications from './Applications';
import Profile from './Profile';
import CreateJob from './CreateJob';
import Interviews from './Interviews';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show message if recruiter account is not approved
  if (!user?.isApproved) {
    return (
      <div className="pending-approval">
        <h2>Account Pending Approval</h2>
        <p>Your recruiter account is being reviewed by the admin. You will be notified once approved.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Recruiter Portal</h2>
          <p>{user?.name}</p>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/recruiter"
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiHome /> Dashboard
          </Link>
          <Link
            to="/recruiter/jobs/create"
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            <FiPlusCircle /> Post New Job
          </Link>
          <Link
            to="/recruiter/jobs"
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            <FiBriefcase /> My Jobs
          </Link>
          <Link
            to="/recruiter/applications"
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            <FiFileText /> Applications
          </Link>
          <Link
            to="/recruiter/interviews"
            className={activeTab === 'interviews' ? 'active' : ''}
            onClick={() => setActiveTab('interviews')}
          >
            <FiVideo /> Interviews
          </Link>
          <Link
            to="/recruiter/profile"
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/create" element={<CreateJob />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;