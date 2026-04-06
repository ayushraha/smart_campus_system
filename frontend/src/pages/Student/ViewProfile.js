// frontend/src/pages/Student/ViewProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3, Download, Mail, Phone, MapPin, Calendar, User,
  GraduationCap, Code2, Wrench, Briefcase,
  Award, Target, Globe, Github, Linkedin,
  ExternalLink, CheckCircle, Loader, AlertCircle
} from 'lucide-react';
import './ViewProfile.css';

const API = () => (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export default function ViewProfile() {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [qrCode, setQrCode]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API()}/api/student-profile/my-profile`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
          setQrCode(data.qrCode || null);
        } else {
          setError('no-profile');
        }
      } catch {
        setError('network');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `${profile?.personalInfo?.firstName || 'student'}_ID.png`;
    a.click();
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="vp-loading">
      <Loader size={32} className="spin"/>
      <p>Loading profile…</p>
    </div>
  );

  /* ── No Profile Yet ── */
  if (error === 'no-profile') return (
    <div className="vp-empty">
      <AlertCircle size={48} className="vp-empty-icon"/>
      <h2>No Profile Found</h2>
      <p>Fill in your details to create your student profile and generate your unique QR ID.</p>
      <button className="vp-btn-primary" onClick={() => navigate('/student/profile-form')}>
        <Edit3 size={16}/> Create My Profile
      </button>
    </div>
  );

  if (error) return (
    <div className="vp-empty">
      <AlertCircle size={48} className="vp-empty-icon"/>
      <h2>Network Error</h2>
      <p>Could not load your profile. Please check your connection and try again.</p>
    </div>
  );

  const p  = profile;
  const pi = p.personalInfo || {};
  const ed = p.education    || {};
  const sl = p.socialLinks  || {};
  const cp = p.careerPreferences || {};
  const completion = p.overallProfileCompletion || 0;

  const tabs = [
    { key: 'overview',    label: '👤 Overview'    },
    { key: 'skills',      label: '🛠 Skills'      },
    { key: 'experience',  label: '💼 Experience'  },
    { key: 'projects',    label: '🔬 Projects'    },
    { key: 'certs',       label: '🏆 Certs'       },
    { key: 'career',      label: '🎯 Preferences' },
  ];

  return (
    <div className="vp-container">
      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div className="vp-hero">
        <div className="vp-avatar">
          {pi.profilePhoto ? (
            <img src={pi.profilePhoto} alt="Profile" className="vp-avatar-img" />
          ) : (
            <>{pi.firstName?.[0]?.toUpperCase() || '?'}{pi.lastName?.[0]?.toUpperCase() || ''}</>
          )}
        </div>
        <div className="vp-hero-info">
          <div className="vp-badge">
            <CheckCircle size={11}/>
            {completion >= 80 ? 'Complete Profile' : 'Profile In Progress'}
          </div>
          <h1 className="vp-name">
            {pi.firstName || '—'} {pi.lastName || ''}
          </h1>
          <p className="vp-headline">
            {cp.preferredRoles?.[0] || (ed.degree ? `${ed.degree} student` : 'Student')}
            {ed.institution ? ` · ${ed.institution}` : ''}
          </p>
          <div className="vp-meta-row">
            {pi.email && <span className="vp-meta-chip"><Mail size={11}/> {pi.email}</span>}
            {pi.phone && <span className="vp-meta-chip"><Phone size={11}/> {pi.phone}</span>}
            {(p.address?.city || p.address?.country) && (
              <span className="vp-meta-chip"><MapPin size={11}/> {[p.address.city, p.address.country].filter(Boolean).join(', ')}</span>
            )}
          </div>
          <div className="vp-social-row">
            {sl.linkedin && (
              <a href={sl.linkedin} target="_blank" rel="noreferrer" className="vp-social-btn linkedin">
                <Linkedin size={14}/> LinkedIn
              </a>
            )}
            {sl.github && (
              <a href={sl.github} target="_blank" rel="noreferrer" className="vp-social-btn github">
                <Github size={14}/> GitHub
              </a>
            )}
            {sl.portfolio && (
              <a href={sl.portfolio} target="_blank" rel="noreferrer" className="vp-social-btn portfolio">
                <Globe size={14}/> Portfolio
              </a>
            )}
          </div>
        </div>
        <div className="vp-hero-actions">
          {/* Completion ring */}
          <div className="vp-ring-wrap">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#c9a227" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - completion / 100)}`}
                style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div className="vp-ring-text">{completion}%</div>
          </div>
          <button className="vp-edit-btn" onClick={() => navigate('/student/profile-form')}>
            <Edit3 size={14}/> Edit Profile
          </button>
          {qrCode && (
            <button className="vp-qr-btn" onClick={handleDownloadQR}>
              <Download size={14}/> QR Card
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="vp-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`vp-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Panels ──────────────────────────────────────────────── */}
      <div className="vp-content">

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="vp-section-anim">
            <div className="vp-two-col">
              {/* Education */}
              <div className="vp-card">
                <div className="vp-card-title"><GraduationCap size={16}/> Education</div>
                {ed.institution ? (
                  <div className="vp-edu-block">
                    <div className="vp-edu-degree">{ed.degree}</div>
                    <div className="vp-edu-field">{ed.field}</div>
                    <div className="vp-edu-institution">{ed.institution}</div>
                    <div className="vp-edu-meta-row">
                      {(ed.startDate || ed.endDate) && (
                        <span className="vp-small-chip"><Calendar size={10}/> {ed.startDate ? new Date(ed.startDate).getFullYear() : '?'} – {ed.endDate ? new Date(ed.endDate).getFullYear() : 'Present'}</span>
                      )}
                      {ed.cgpa && <span className="vp-small-chip gold">CGPA: {ed.cgpa}</span>}
                    </div>
                  </div>
                ) : <p className="vp-empty-field">No education details added yet.</p>}
              </div>

              {/* Career preferences summary */}
              <div className="vp-card">
                <div className="vp-card-title"><Target size={16}/> Career Goals</div>
                {cp.preferredRoles?.length ? (
                  <>
                    <div className="vp-label">Target Roles</div>
                    <div className="vp-tag-wrap">
                      {cp.preferredRoles.map((r,i) => <span key={i} className="vp-tag primary">{r}</span>)}
                    </div>
                    {cp.preferredIndustries?.length > 0 && (
                      <>
                        <div className="vp-label" style={{ marginTop:12 }}>Industries</div>
                        <div className="vp-tag-wrap">
                          {cp.preferredIndustries.map((r,i) => <span key={i} className="vp-tag">{r}</span>)}
                        </div>
                      </>
                    )}
                    <div className="vp-pref-row">
                      {cp.workPreference && <span className="vp-pref-chip">{cp.workPreference}</span>}
                      {cp.willingToRelocate && <span className="vp-pref-chip">Open to Relocation</span>}
                    </div>
                  </>
                ) : <p className="vp-empty-field">No career preferences added yet.</p>}
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="vp-card vp-qr-card">
                <div className="vp-card-title"><Award size={16}/> Your Student ID</div>
                <div className="vp-qr-body">
                  <img src={qrCode} alt="Student QR Code" className="vp-qr-img"/>
                  <div>
                    <p className="vp-qr-desc">Show this QR code to admins or recruiters for instant profile access.</p>
                    <button className="vp-edit-btn" style={{ marginTop:12 }} onClick={handleDownloadQR}>
                      <Download size={14}/> Download QR Card
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
          <div className="vp-section-anim">
            {[
              { key: 'technical', Label: 'Technical Skills',  Icon: Code2,    color: 'gold'   },
              { key: 'tools',     Label: 'Tools & Platforms', Icon: Wrench,   color: 'blue'   },
              { key: 'soft',      Label: 'Soft Skills',       Icon: User,     color: 'green'  },
              { key: 'languages', Label: 'Languages',         Icon: Globe,    color: 'purple' },
            ].map(({ key, Label, Icon, color }) => (
              (p.skills?.[key]?.length > 0) && (
                <div key={key} className="vp-card" style={{ marginBottom: 16 }}>
                  <div className="vp-card-title"><Icon size={16}/> {Label}</div>
                  <div className="vp-tag-wrap">
                    {p.skills[key].map((s, i) => (
                      <span key={i} className={`vp-tag skill-tag ${color}`}>{s}</span>
                    ))}
                  </div>
                </div>
              )
            ))}
            {!p.skills?.technical?.length && !p.skills?.tools?.length && (
              <EmptyState msg="No skills added yet." action={() => navigate('/student/profile-form')}/>
            )}
          </div>
        )}

        {/* Experience */}
        {activeTab === 'experience' && (
          <div className="vp-section-anim">
            {p.workExperience?.length > 0 ? p.workExperience.map((w, i) => (
              <div key={i} className="vp-card vp-exp-card">
                <div className="vp-exp-header">
                  <div>
                    <div className="vp-exp-title">{w.jobTitle}</div>
                    <div className="vp-exp-company"><Briefcase size={12}/> {w.company}</div>
                  </div>
                  {w.duration && (
                    <span className="vp-small-chip"><Calendar size={10}/> {w.duration}</span>
                  )}
                </div>
                {w.description && <p className="vp-exp-desc">{w.description}</p>}
              </div>
            )) : <EmptyState msg="No work experience added yet." action={() => navigate('/student/profile-form')}/>}
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <div className="vp-section-anim">
            {p.projects?.length > 0 ? (
              <div className="vp-projects-grid">
                {p.projects.map((proj, i) => (
                  <div key={i} className="vp-project-card">
                    <div className="vp-proj-header">
                      <div className="vp-proj-title">{proj.title}</div>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="vp-proj-link">
                          <ExternalLink size={13}/>
                        </a>
                      )}
                    </div>
                    <p className="vp-proj-desc">{proj.description}</p>
                    {proj.highlights && (
                      <div className="vp-proj-highlights">
                        <span className="vp-label">✨ Highlights</span>
                        <p>{proj.highlights}</p>
                      </div>
                    )}
                    {proj.technologies?.length > 0 && (
                      <div className="vp-tag-wrap" style={{ marginTop: 10 }}>
                        {proj.technologies.map((t, j) => (
                          <span key={j} className="vp-tag small">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <EmptyState msg="No projects added yet." action={() => navigate('/student/profile-form')}/>}
          </div>
        )}

        {/* Certifications */}
        {activeTab === 'certs' && (
          <div className="vp-section-anim">
            {p.certifications?.length > 0 ? p.certifications.map((c, i) => (
              <div key={i} className="vp-card vp-cert-card">
                <div className="vp-cert-icon"><Award size={22}/></div>
                <div>
                  <div className="vp-cert-name">{c.name}</div>
                  <div className="vp-cert-issuer">{c.issuer}</div>
                  <div className="vp-cert-meta">
                    {c.date && <span className="vp-small-chip"><Calendar size={10}/> {new Date(c.date).toLocaleDateString('en-IN', { year:'numeric', month:'short' })}</span>}
                    {c.credentialId && <span className="vp-small-chip">ID: {c.credentialId}</span>}
                  </div>
                </div>
              </div>
            )) : <EmptyState msg="No certifications added yet." action={() => navigate('/student/profile-form')}/>}
          </div>
        )}

        {/* Career Preferences */}
        {activeTab === 'career' && (
          <div className="vp-section-anim">
            <div className="vp-card">
              <div className="vp-card-title"><Target size={16}/> Career Preferences</div>
              <div className="vp-prefs-grid">
                <div>
                  <div className="vp-label">Preferred Roles</div>
                  <div className="vp-tag-wrap">
                    {cp.preferredRoles?.length
                      ? cp.preferredRoles.map((r,i) => <span key={i} className="vp-tag primary">{r}</span>)
                      : <span className="vp-empty-field">Not specified</span>}
                  </div>
                </div>
                <div>
                  <div className="vp-label">Preferred Industries</div>
                  <div className="vp-tag-wrap">
                    {cp.preferredIndustries?.length
                      ? cp.preferredIndustries.map((r,i) => <span key={i} className="vp-tag">{r}</span>)
                      : <span className="vp-empty-field">Not specified</span>}
                  </div>
                </div>
                <div>
                  <div className="vp-label">Work Arrangement</div>
                  <span className="vp-pref-chip">{cp.workPreference || 'Not specified'}</span>
                </div>
                <div>
                  <div className="vp-label">Willing to Relocate?</div>
                  <span className={`vp-pref-chip ${cp.willingToRelocate ? 'yes' : ''}`}>
                    {cp.willingToRelocate ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────
function EmptyState({ msg, action }) {
  return (
    <div className="vp-section-empty">
      <p>{msg}</p>
      <button className="vp-edit-btn" onClick={action}><Edit3 size={13}/> Add Now</button>
    </div>
  );
}
