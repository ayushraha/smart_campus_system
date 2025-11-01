import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiBriefcase, FiFileText, FiUser, FiLogOut, FiVideo, FiFile } from 'react-icons/fi';
import '../Admin/Admin.css'; // Use Admin CSS as base
import './Student.css';
import { MessageCircle } from "lucide-react";


import Overview from './Overview';
import Jobs from './Jobs';
import Applications from './Applications';
import Profile from './Profile';
import Interviews from './Interviews';
import ResumeList from './ResumeList';
import ResumeBuilder from './ResumeBuilder';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user?.isApproved) {
    return (
      <div className="pending-approval">
        <h2>Account Pending Approval</h2>
        <p>Your account is being reviewed. Please wait for admin approval.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Student Portal</h2>
          <p>{user?.name}</p>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/student" 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiHome /> Dashboard
          </Link>
          <Link 
            to="/student/resume" 
            className={activeTab === 'resume' ? 'active' : ''}
            onClick={() => setActiveTab('resume')}
          >
            <FiFile /> My Resumes
          </Link>
          <Link 
            to="/student/jobs" 
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            <FiBriefcase /> Browse Jobs
          </Link>
          <Link to="/student/ai-chat">
             <MessageCircle size={20} /> AI Assistant
          </Link>
          <Link 
            to="/student/applications" 
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            <FiFileText /> My Applications
          </Link>
          <Link 
            to="/student/interviews" 
            className={activeTab === 'interviews' ? 'active' : ''}
            onClick={() => setActiveTab('interviews')}
          >
            <FiVideo /> Interviews
          </Link>
          <Link 
            to="/student/profile" 
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
          <Route path="/resume" element={<ResumeList />} />
          <Route path="/resume/new" element={<ResumeBuilder />} />
          <Route path="/resume/:resumeId" element={<ResumeBuilder />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;