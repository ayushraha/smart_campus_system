import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/Admin/Dashboard';
import StudentDashboard from './pages/Student/Dashboard';
import RecruiterDashboard from './pages/Recruiter/Dashboard';
import InterviewRoom from './pages/Interview/InterviewRoom';
import InterviewAnalysis from './pages/Interview/InterviewAnalysis';
import './App.css';
import AIChat from './pages/Student/AIChat';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />;
  }

  return children;
};

// Unauthorized Page
const UnauthorizedPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        {user && (
          <div className="user-info">
            <p>Current Role: <strong>{user.role}</strong></p>
            <button 
              onClick={() => window.location.href = `/${user.role}`}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        {!user && (
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

// Not Found Page
const NotFoundPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        {user ? (
          <button 
            onClick={() => window.location.href = `/${user.role}`}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        ) : (
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Interview Routes - Accessible by both students and recruiters */}
            <Route 
              path="/interview/room/:roomId" 
              element={
                <ProtectedRoute allowedRoles={['student', 'recruiter']}>
                  <InterviewRoom />
                </ProtectedRoute>
              } 
            />
            
            {/* Interview Analysis - Multiple paths for flexibility */}
            <Route 
              path="/interview/:interviewId/analysis" 
              element={
                <ProtectedRoute allowedRoles={['student', 'recruiter', 'admin']}>
                  <InterviewAnalysis />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/recruiter/interviews/:interviewId/analysis" 
              element={
                <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                  <InterviewAnalysis />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student/interviews/:interviewId/analysis" 
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <InterviewAnalysis />
                </ProtectedRoute>
              } 
            />
            {/* AI Chat Route */}
            {/* AI Chat Route */}
<Route 
  path="/student/ai-chat" 
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <AIChat />
    </ProtectedRoute>
  } 
/>
            
            {/* Role-based Dashboards */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/recruiter/*" 
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Special Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {/* Toast Notifications */}
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;