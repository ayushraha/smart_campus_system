import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin')     navigate('/admin');
      else if (user.role === 'student')   navigate('/student');
      else if (user.role === 'recruiter') navigate('/recruiter');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">

      {/* ── Left Panel ── */}
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <a href="/" className="auth-brand">
            <img src="/jspm_logo.png" alt="JSPM" className="auth-brand-logo" />
            <div>
              <div className="auth-brand-name">Smart Campus</div>
              <div className="auth-brand-sub">JSPM Hadapsar · Pune</div>
            </div>
          </a>

          <div className="auth-left-body">
            <h1 className="auth-left-title">Your placement<br />journey starts here.</h1>
            <p className="auth-left-desc">
              Connect with top recruiters, build AI-powered resumes, and land your dream job
              — all from JSPM's official placement portal.
            </p>

            <div className="auth-features">
              {[
                { icon: '🧠', text: 'AI Resume Builder & ATS Scorer' },
                { icon: '📅', text: 'Live Drive Calendar & Alerts' },
                { icon: '🎬', text: 'Mock AI Interview Practice' },
                { icon: '👥', text: 'Peer Study Groups' },
              ].map((f, i) => (
                <div key={i} className="auth-feature-item">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="auth-left-stats">
              <div><strong>5000+</strong><span>Students</span></div>
              <div><strong>200+</strong><span>Recruiters</span></div>
              <div><strong>95%</strong><span>Placed</span></div>
            </div>
          </div>

          {/* floating orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back 👋</h2>
            <p className="auth-form-sub">Sign in to your JSPM placement account</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>Sign In <span className="auth-btn-arrow">→</span></>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-role-hint">
            <p>Sign in as:</p>
            <div className="auth-role-pills">
              {['🎓 Student', '💼 Recruiter', '🛡️ Admin'].map((r, i) => (
                <span key={i} className="auth-role-pill">{r}</span>
              ))}
            </div>
          </div>

          <p className="auth-switch">
            New to Smart Campus?{' '}
            <Link to="/register">Create an account →</Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;