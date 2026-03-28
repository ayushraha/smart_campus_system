import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiBriefcase, FiFileText, FiUser, FiLogOut, FiVideo, FiFile } from 'react-icons/fi';
import '../Admin/Admin.css'; // Use Admin CSS as base
import './Student.css';
import { MessageCircle, Zap, FileCheck, Award, CalendarDays, Briefcase } from "lucide-react";
import NotificationBell from '../../components/NotificationBell';

import Overview from './Overview';
import Jobs from './Jobs';
import Applications from './Applications';
import Profile from './Profile';
import Interviews from './Interviews';
import ResumeList from './ResumeList';
import ResumeBuilder from './ResumeBuilder';
import PremiumResumeParser from './PremiumResumeParser';
import StudentProfileForm from './StudentProfileForm';
import MentorshipHub from './MentorshipHub';
import BecameMentor from './BecameMentor';
import DriveCalendar from './DriveCalendar';
import StudyGroups from './StudyGroups';
import TrackApplications from './TrackApplications';
import Messenger from './Messenger';

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
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Student Portal</h2>
            <p>{user?.name}</p>
          </div>
          <NotificationBell />
        </div>

        <nav className="sidebar-nav">
          {/* Main Dashboard */}
          <Link 
            to="/student" 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <FiHome /> Dashboard
          </Link>

          {/* Resume Section */}
          <div className="nav-section-title">Resume & Profile</div>
          
          <Link 
            to="/student/resume" 
            className={activeTab === 'resume' ? 'active' : ''}
            onClick={() => setActiveTab('resume')}
          >
            <FiFile /> My Resumes
          </Link>

          <Link 
            to="/student/profile-form" 
            className={activeTab === 'profile-form' ? 'active' : ''}
            onClick={() => setActiveTab('profile-form')}
          >
            <FileCheck size={20} /> Complete Profile
          </Link>

          <Link 
            to="/student/profile" 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> View Profile
          </Link>

          {/* Placement Section */}
          <div className="nav-section-title">Placement Journey</div>

          <Link 
            to="/student/jobs" 
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            <FiBriefcase /> Browse Jobs
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
            to="/student/calendar" 
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarDays size={18} /> Drive Calendar
          </Link>

          <Link 
            to="/student/study-groups" 
            className={activeTab === 'study-groups' ? 'active' : ''}
            onClick={() => setActiveTab('study-groups')}
          >
            <MessageCircle size={18} /> Study Groups
          </Link>

          <Link 
            to="/student/track-applications" 
            className={activeTab === 'track-applications' ? 'active' : ''}
            onClick={() => setActiveTab('track-applications')}
          >
            <Briefcase size={18} /> Track Applications
          </Link>

          {/* Learning & Tools Section */}
          <div className="nav-section-title">Learning & Tools</div>

          <Link 
            to="/student/ai-chat"
            className={activeTab === 'ai-chat' ? 'active' : ''}
            onClick={() => setActiveTab('ai-chat')}
          >
            <MessageCircle size={20} /> AI Assistant
          </Link>

          <Link 
            to="/student/premium-resume-parser" 
            className={activeTab === 'premium-resume-parser' ? 'active' : ''}
            onClick={() => setActiveTab('premium-resume-parser')}
          >
            <Zap size={20} /> Premium Resume Parser
          </Link>

          {/* ✅ MENTORSHIP SECTION (NEW) */}
          <div className="nav-section-title">🎓 Mentorship & Network</div>

          <Link 
            to="/student/mentorship" 
            className={activeTab === 'mentorship' ? 'active' : ''}
            onClick={() => setActiveTab('mentorship')}
          >
            <Award size={20} /> Mentorship Hub
          </Link>

          <Link 
            to="/student/messages" 
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            <MessageCircle size={20} /> Messages
          </Link>

          <Link 
            to="/student/become-mentor" 
            className={activeTab === 'become-mentor' ? 'active' : ''}
            onClick={() => setActiveTab('become-mentor')}
          >
            <Award size={20} /> Become a Mentor
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
          {/* Main Dashboard */}
          <Route path="/" element={<Overview />} />

          {/* Resume & Profile Routes */}
          <Route path="/resume" element={<ResumeList />} />
          <Route path="/resume/new" element={<ResumeBuilder />} />
          <Route path="/resume/:resumeId" element={<ResumeBuilder />} />
          <Route path="/profile-form" element={<StudentProfileForm />} />
          <Route path="/profile" element={<Profile />} />

          {/* Placement Routes */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/interviews" element={<Interviews />} />

          {/* Learning Tools Routes */}
          <Route path="/premium-resume-parser" element={<PremiumResumeParser />} />

          {/* Mentorship Routes */}
          <Route path="/mentorship" element={<MentorshipHub />} />
          <Route path="/messages" element={<Messenger />} />
          <Route path="/become-mentor" element={<BecameMentor />} />

          {/* Drive Calendar */}
          <Route path="/calendar" element={<DriveCalendar />} />

          {/* Study Groups */}
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/study-groups/*" element={<StudyGroups />} />

          {/* Track Applications */}
          <Route path="/track-applications" element={<TrackApplications />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;