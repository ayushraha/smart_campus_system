import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const STATS = [
  { value: '10,000+', label: 'Students Placed' },
  { value: '500+',    label: 'Partner Companies' },
  { value: '98%',     label: 'Interview Success Rate' },
  { value: '2 min',   label: 'Avg. Application Time' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI Resume Builder',
    desc: 'Smart AI crafts ATS-optimized resumes tailored to each job description. Get real-time suggestions and ATS score.',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)'
  },
  {
    icon: '📅',
    title: 'Drive Calendar',
    desc: 'Never miss a placement drive. Subscribe to companies, get instant notifications, and register with one click.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)'
  },
  {
    icon: '👥',
    title: 'Study Groups',
    desc: 'Join company-specific prep rooms. Chat with peers preparing for the same drive and share resources.',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.25)'
  },
  {
    icon: '🎬',
    title: 'AI Mock Interviews',
    desc: 'Practice with AI interviewers. Get scored on communication, confidence, and technical depth in real-time.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)'
  },
  {
    icon: '🤝',
    title: 'Mentor Network',
    desc: 'Connect with placed alumni from top companies. Book 1:1 sessions and get direct guidance from insiders.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)'
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Personalized alerts for matching drives, application deadlines, interview reminders — never fall behind.',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)'
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Profile', desc: 'Sign up and build your AI-powered resume. Upload your details once — apply everywhere.' },
  { step: '02', title: 'Discover Opportunities', desc: 'Browse company drives, subscribe for updates, and explore job openings matched to your profile.' },
  { step: '03', title: 'Prepare & Practice', desc: 'Join study groups, take mock AI interviews, connect with mentors, and improve your readiness score.' },
  { step: '04', title: 'Get Placed', desc: 'Apply with a single click, track your applications, attend interviews, and celebrate your offer! 🎉' },
];

const TESTIMONIALS = [
  { name: 'Aditya Kulkarni', role: 'SDE at TCS · JSPM Hadapsar', avatar: '👨‍💻', text: 'The AI resume builder helped me tailor my resume perfectly. Got shortlisted by TCS within days of using this platform!', company: 'TCS' },
  { name: 'Rutuja Deshmukh', role: 'Analyst at Infosys · JSPM Hadapsar', avatar: '👩‍💼', text: 'Drive Calendar notifications saved me — I never missed a single placement drive. Got placed in Infosys 2025 batch!', company: 'Infosys' },
  { name: 'Saurabh Jadhav', role: 'Engineer at Wipro · JSPM Hadapsar', avatar: '👨‍🔬', text: 'The study groups feature connected me with 6 batchmates. We prepared together and all 4 of us cracked Wipro!', company: 'Wipro' },
];

const JSPM_DEPARTMENTS = [
  'Computer Engineering', 'Information Technology', 'Electronics & Telecomm.',
  'Mechanical Engineering', 'Civil Engineering', 'MBA', 'MCA'
];

const JSPM_PARTNERS = ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'Accenture', 'Tech Mahindra', 'HCL'];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax mouse tracking
  useEffect(() => {
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      () => {},
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-root">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <img src="/jspm_logo.png" alt="JSPM" className="lp-nav-college-logo" />
            <div>
              <span className="lp-logo-text">Smart Campus</span>
              <span className="lp-logo-sub">JSPM Hadapsar · Pune</span>
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#testimonials">Stories</a>
          </div>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg" />
        <div className="lp-hero-overlay" />

        {/* Animated background orbs */}
        <div className="lp-orb lp-orb-1" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} />
        <div className="lp-orb lp-orb-2" style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }} />
        <div className="lp-orb lp-orb-3" style={{ transform: `translate(${mousePos.x * 0.8}px, ${-mousePos.y * 0.8}px)` }} />

        {/* 3D floating card */}
        <div
          className="lp-hero-3d-card"
          style={{ transform: `rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)` }}
        >
          <div className="lp-badge">🚀 India's Smartest Campus Recruitment Platform</div>

          <h1 className="lp-hero-title">
            Get Placed at Your<br />
            <span className="lp-gradient-text">Dream Company</span><br />
            with the Power of AI
          </h1>

          <p className="lp-hero-desc">
            From AI resume building to live mock interviews, study groups, and real-time
            drive notifications — <strong>Smart Campus Recruitment System</strong> is your complete placement companion.
          </p>

          <div className="lp-hero-btns">
            <button className="lp-btn-hero-primary" onClick={() => navigate('/register')}>
              Start Your Journey Free
              <span className="lp-btn-arrow">→</span>
            </button>
            <button className="lp-btn-hero-ghost" onClick={() => navigate('/login')}>
              I already have an account
            </button>
          </div>

          <div className="lp-hero-avatars">
            <div className="lp-avatar-stack">
              {['👩‍💻','👨‍💼','👩‍🔬','👨‍🎓','👩‍💼'].map((a, i) => (
                <span key={i} className="lp-avatar">{a}</span>
              ))}
            </div>
            <span className="lp-avatar-text">Join <strong>10,000+</strong> students already placed</span>
          </div>
        </div>

        {/* Floating UI mockup cards */}
        <div className="lp-hero-mockups" style={{ transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)` }}>
          <div className="lp-mock-card lp-mock-notif">
            <div className="lp-mock-dot green" />
            <div>
              <div className="lp-mock-title">Google Drive Posted!</div>
              <div className="lp-mock-sub">SWE Internship 2025 · 2 min ago</div>
            </div>
          </div>
          <div className="lp-mock-card lp-mock-ats">
            <div className="lp-mock-ats-label">ATS Score</div>
            <div className="lp-mock-ats-score">94%</div>
            <div className="lp-mock-ats-bar"><div className="lp-mock-ats-fill" /></div>
          </div>
          <div className="lp-mock-card lp-mock-interview">
            <div className="lp-mock-dot purple" />
            <div>
              <div className="lp-mock-title">Mock Interview</div>
              <div className="lp-mock-sub">Communication: 92/100</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JSPM College Stripe ─── */}
      <div className="lp-college-stripe">
        <img src="/jspm_logo.png" alt="JSPM Logo" className="lp-stripe-logo" />
        <div className="lp-stripe-text">
          <span className="lp-stripe-name">JSPM Hadapsar</span>
          <span className="lp-stripe-location">📍 Hadapsar, Pune, Maharashtra · AICTE Approved · NAAC Accredited</span>
        </div>
        <div className="lp-stripe-badge">Official Placement Portal</div>
      </div>
      <section className="lp-stats" id="stats" data-animate>
        <div className="lp-container">
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-card">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="lp-features" id="features" data-animate>
        <div className="lp-container">
          <div className="lp-section-badge">✨ Everything You Need</div>
          <h2 className="lp-section-title">Built for every step of your placement journey</h2>
          <p className="lp-section-sub">From resume to offer letter — CampusHire has a tool for every moment that matters.</p>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="lp-feature-card"
                style={{ '--card-color': f.color, '--card-glow': f.glow, animationDelay: `${i * 0.1}s` }}
              >
                <div className="lp-feature-icon-wrap">
                  <span className="lp-feature-icon">{f.icon}</span>
                  <div className="lp-feature-glow" />
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
                <div className="lp-feature-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="lp-hiw" id="how-it-works" data-animate>
        <div className="lp-container">
          <div className="lp-section-badge">🗺️ The Journey</div>
          <h2 className="lp-section-title">From signup to offer in 4 simple steps</h2>

          <div className="lp-hiw-grid">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="lp-hiw-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="lp-hiw-step">{h.step}</div>
                <div className="lp-hiw-connector" />
                <h3 className="lp-hiw-title">{h.title}</h3>
                <p className="lp-hiw-desc">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JSPM College Info Section ──────────────────────────────────── */}
      <section className="lp-college-section">
        <div className="lp-college-bg-orb" />
        <div className="lp-container">
          <div className="lp-college-grid">

            {/* Left: College info */}
            <div className="lp-college-info">
              <div className="lp-section-badge">🏛️ Our Institution</div>
              <h2 className="lp-section-title">Built exclusively for<br /><span className="lp-gradient-text">JSPM Hadapsar</span></h2>
              <p className="lp-college-desc">
                JSPM Hadapsar, Pune is one of Maharashtra's premier
                engineering institutions, consistently producing top-tier talent placed
                at leading MNCs across India and globally.
              </p>
              <div className="lp-college-meta">
                <div className="lp-college-meta-item">📍 Hadapsar, Pune – 411028</div>
                <div className="lp-college-meta-item">🎓 AICTE Approved &amp; NAAC Accredited</div>
                <div className="lp-college-meta-item">🏆 Affiliated to Savitribai Phule Pune University</div>
                <div className="lp-college-meta-item">📞 Placement Cell: +91-20-XXXX-XXXX</div>
              </div>
              <div className="lp-college-stats">
                <div className="lp-college-stat"><span>95%+</span><label>Placement Rate</label></div>
                <div className="lp-college-stat"><span>5000+</span><label>Students</label></div>
                <div className="lp-college-stat"><span>200+</span><label>Recruiters Visit</label></div>
              </div>
            </div>

            {/* Right: Logo + Departments */}
            <div className="lp-college-right">
              <div className="lp-college-logo-card">
                <img src="/jspm_logo.png" alt="JSPM College" className="lp-college-logo-img" />
                <div className="lp-college-logo-name">JSPM Hadapsar</div>
                <div className="lp-college-logo-city">Hadapsar · Pune</div>
              </div>

              <div className="lp-dept-section">
                <div className="lp-dept-label">Departments on Portal</div>
                <div className="lp-dept-chips">
                  {JSPM_DEPARTMENTS.map((d, i) => (
                    <span key={i} className="lp-dept-chip">{d}</span>
                  ))}
                </div>
              </div>

              <div className="lp-partners-section">
                <div className="lp-dept-label">Top Recruiting Partners</div>
                <div className="lp-partners-grid">
                  {JSPM_PARTNERS.map((p, i) => (
                    <div key={i} className="lp-partner-badge">{p}</div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="lp-testimonials" id="testimonials" data-animate>
        <div className="lp-container">
          <div className="lp-section-badge">💬 Success Stories</div>
          <h2 className="lp-section-title">Students who made it happen</h2>

          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testi-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="lp-testi-quote">"</div>
                <p className="lp-testi-text">{t.text}</p>
                <div className="lp-testi-person">
                  <span className="lp-testi-avatar">{t.avatar}</span>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                  <div className="lp-testi-company">{t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-orb lp-cta-orb-1" />
        <div className="lp-cta-orb lp-cta-orb-2" />
        <div className="lp-container lp-cta-inner">
          <h2 className="lp-cta-title">Your dream company is waiting.<br />Are you ready?</h2>
          <p className="lp-cta-sub">Join thousands of students who use Smart Campus Recruitment System to land offers at top companies.</p>
          <button className="lp-btn-cta" onClick={() => navigate('/register')}>
            Create Free Account →
          </button>
          <p className="lp-cta-note">No credit card required · Free forever for students</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-logo">
            <img src="/jspm_logo.png" alt="JSPM" className="lp-nav-college-logo" />
            <div>
              <span className="lp-logo-text">Smart Campus</span>
              <span className="lp-logo-sub">JSPM Hadapsar · Pune</span>
            </div>
          </div>
          <p className="lp-footer-copy">© 2025 Smart Campus Recruitment System · JSPM Hadapsar. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
