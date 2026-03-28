import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiUsers, FiBriefcase, FiFileText, FiLogOut, FiBarChart2, FiPieChart } from 'react-icons/fi';
import { QrCode } from 'lucide-react'; // ADD QrCode import
import './Admin.css';

import Overview from './Overview';
import Users from './Users';
import Jobs from './Jobs';
import Applications from './Applications';
import QRScanner from './QRScanner'; // ADD THIS IMPORT
import PlacementAnalytics from './PlacementAnalytics';
import MentorApprovals from './MentorApprovals';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p>{user?.name}</p>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/admin" 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiHome /> Overview
          </Link>
          <Link 
            to="/admin/users" 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> Manage Users
          </Link>
          <Link 
            to="/admin/jobs" 
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            <FiBriefcase /> Manage Jobs
          </Link>
          <Link 
            to="/admin/applications" 
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            <FiFileText /> Applications
          </Link>
          <Link 
            to="/admin/reports" 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            <FiBarChart2 /> Reports
          </Link>

          <Link 
            to="/admin/analytics" 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            <FiPieChart /> Analytics
          </Link>

          <Link 
            to="/admin/qr-scanner" 
            className={activeTab === 'qr-scanner' ? 'active' : ''}
            onClick={() => setActiveTab('qr-scanner')}
          >
            <QrCode size={20} /> QR Scanner
          </Link>

          <Link 
            to="/admin/mentor-approvals" 
            className={activeTab === 'mentor-approvals' ? 'active' : ''}
            onClick={() => setActiveTab('mentor-approvals')}
          >
            <FiUsers size={20} /> Mentor Approvals
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
          <Route path="/users" element={<Users />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<PlacementAnalytics />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/mentor-approvals" element={<MentorApprovals />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;