import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ROLES = [
  { value: 'student',   label: '🎓 Student',   desc: 'Looking for placement opportunities' },
  { value: 'recruiter', label: '💼 Recruiter',  desc: 'Hiring talent from JSPM campus' },
  { value: 'admin',     label: '🛡️ Admin',      desc: 'Manage the placement portal' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'student', password: '', confirmPassword: ''
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]         = useState(1); // 1 = role select, 2 = form

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const selectRole   = role => { setFormData({ ...formData, role }); setStep(2); };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const user = await register(registerData);
      if (user.role === 'admin')     navigate('/admin');
      else if (user.role === 'student')   navigate('/student');
      else if (user.role === 'recruiter') navigate('/recruiter');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <h1 className="auth-left-title">Join thousands of<br />students getting<br />placed at top MNCs.</h1>
            <p className="auth-left-desc">
              Create your free account and access everything you need — AI resume tools,
              live drives, mentors, and more.
            </p>

            <div className="auth-steps-preview">
              {['Create your profile', 'Explore placement drives', 'Get placed! 🎉'].map((s, i) => (
                <div key={i} className="auth-step-item">
                  <div className="auth-step-num">{i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="auth-left-stats">
              <div><strong>5000+</strong><span>Students</span></div>
              <div><strong>200+</strong><span>Recruiters</span></div>
              <div><strong>95%</strong><span>Placed</span></div>
            </div>
          </div>

          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Create Account</h2>
                <p className="auth-form-sub">Who are you joining as?</p>
              </div>

              <div className="auth-role-cards">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    className={`auth-role-card ${formData.role === r.value ? 'selected' : ''}`}
                    onClick={() => selectRole(r.value)}
                    type="button"
                  >
                    <span className="auth-role-card-icon">{r.label.split(' ')[0]}</span>
                    <div>
                      <div className="auth-role-card-label">{r.label.split(' ').slice(1).join(' ')}</div>
                      <div className="auth-role-card-desc">{r.desc}</div>
                    </div>
                    <span className="auth-role-card-arrow">→</span>
                  </button>
                ))}
              </div>

              <p className="auth-switch">
                Already registered? <Link to="/login">Sign in →</Link>
              </p>
            </>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <>
              <div className="auth-form-header">
                <button className="auth-back-btn" onClick={() => setStep(1)}>← Back</button>
                <h2 className="auth-form-title">
                  {formData.role === 'student' ? '🎓 Student' : '💼 Recruiter'} Registration
                </h2>
                <p className="auth-form-sub">Fill in your details to get started</p>
              </div>

              {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-row">
                  <div className="auth-field">
                    <label>Full Name</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">👤</span>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Phone Number</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">📱</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label>Email Address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">✉️</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={formData.role === 'student' ? 'college@jspm.in' : 'recruiter@company.com'}
                      required
                    />
                  </div>
                </div>

                <div className="auth-row">
                  <div className="auth-field">
                    <label>Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🔒</span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                      />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPass(!showPass)}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Confirm Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🔒</span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : <>Create Account <span className="auth-btn-arrow">→</span></>}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in →</Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
};

export default Register;