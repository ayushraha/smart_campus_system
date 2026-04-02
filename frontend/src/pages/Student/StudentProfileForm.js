// frontend/src/pages/Student/StudentProfileForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  User, MapPin, GraduationCap, Wrench, Briefcase,
  FolderOpen, Award, Link2, Target, Download,
  ChevronRight, CheckCircle, Save, Loader
} from 'lucide-react';
import './StudentProfileForm.css';

const API = () => (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const EMPTY_PROFILE = {
  personalInfo: { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '' },
  address: { street: '', city: '', state: '', zipCode: '', country: '' },
  education: { institution: '', degree: '', field: '', startDate: '', endDate: '', cgpa: '' },
  skills: { technical: [], soft: [], languages: [], tools: [] },
  workExperience: [],
  projects: [],
  certifications: [],
  socialLinks: { linkedin: '', github: '', portfolio: '', twitter: '' },
  careerPreferences: { preferredRoles: [], preferredIndustries: [], willingToRelocate: false, workPreference: '' },
};

const EMPTY_WORK = { company: '', jobTitle: '', duration: '', description: '', current: false };
const EMPTY_PROJECT = { title: '', description: '', technologies: [], link: '', highlights: '' };
const EMPTY_CERT = { name: '', issuer: '', date: '', credentialId: '' };

// ── Section completion check ──────────────────────────────────────────────
function sectionComplete(profileData) {
  const p = profileData;
  return {
    personal:    !!(p.personalInfo.firstName && p.personalInfo.email),
    address:     !!(p.address.city && p.address.country),
    education:   !!(p.education.institution && p.education.degree),
    skills:      (p.skills.technical.length + p.skills.tools.length) > 0,
    experience:  p.workExperience.length > 0,
    projects:    p.projects.length > 0,
    certs:       p.certifications.length > 0,
    social:      !!(p.socialLinks.linkedin || p.socialLinks.github),
    career:      p.careerPreferences.preferredRoles.length > 0,
  };
}

function calcCompletion(profileData) {
  const sc = sectionComplete(profileData);
  return Math.round((Object.values(sc).filter(Boolean).length / Object.keys(sc).length) * 100);
}

// ── Tag input component ────────────────────────────────────────────────────
function TagInput({ tags = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onChange([...tags, v]); setInput(''); }
  };
  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));
  return (
    <div className="tag-input-wrap">
      <div className="tag-list">
        {tags.map((t, i) => (
          <span key={i} className="tag-item">
            {t} <button type="button" onClick={() => remove(i)}>×</button>
          </span>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button type="button" className="tag-add-btn" onClick={add}>+</button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StudentProfileForm() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [qrCode, setQrCode]           = useState(null);
  const [saved, setSaved]             = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  const completion = calcCompletion(profileData);
  const sections   = sectionComplete(profileData);

  // ── Load existing profile on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API()}/api/student-profile/my-profile`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (data.success && data.profile) {
          setProfileData(prev => ({
            personalInfo:      data.profile.personalInfo      || prev.personalInfo,
            address:           data.profile.address           || prev.address,
            education:         data.profile.education         || prev.education,
            skills:            data.profile.skills            || prev.skills,
            workExperience:    data.profile.workExperience    || [],
            projects:          data.profile.projects          || [],
            certifications:    data.profile.certifications    || [],
            socialLinks:       data.profile.socialLinks       || prev.socialLinks,
            careerPreferences: data.profile.careerPreferences || prev.careerPreferences,
          }));
          if (data.qrCode) setQrCode(data.qrCode);
        }
      } catch (err) {
        console.warn('No existing profile found — starting fresh');
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  // ── Generic field updaters ───────────────────────────────────────────────
  const set = (section, field, value) =>
    setProfileData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const setSkill = (type, tags) =>
    setProfileData(prev => ({ ...prev, skills: { ...prev.skills, [type]: tags } }));

  const setArray = (key, val) =>
    setProfileData(prev => ({ ...prev, [key]: val }));

  const setCareer = (field, value) =>
    setProfileData(prev => ({
      ...prev,
      careerPreferences: { ...prev.careerPreferences, [field]: value },
    }));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.personalInfo.firstName.trim() || !profileData.personalInfo.email.trim()) {
      toast.error('First name and email are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API()}/api/student-profile/create-profile`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.qrCode) setQrCode(data.qrCode);
        setSaved(true);
        toast.success(`Profile saved! ${data.profileCompletion}% complete.`);
        setTimeout(() => navigate('/student/view-profile'), 1400);
      } else {
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (err) {
      toast.error('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const a = document.createElement('a');
    a.href = qrCode; a.download = 'student_id_qr.png'; a.click();
  };

  if (fetching) {
    return (
      <div className="spf-loading">
        <div className="spf-loading-spinner"><Loader size={32} className="spin"/></div>
        <p>Loading your profile…</p>
      </div>
    );
  }

  const NAV_ITEMS = [
    { key: 'personal',    Icon: User,         label: 'Personal',    done: sections.personal   },
    { key: 'address',     Icon: MapPin,        label: 'Address',     done: sections.address    },
    { key: 'education',   Icon: GraduationCap, label: 'Education',   done: sections.education  },
    { key: 'skills',      Icon: Wrench,        label: 'Skills',      done: sections.skills     },
    { key: 'experience',  Icon: Briefcase,     label: 'Experience',  done: sections.experience },
    { key: 'projects',    Icon: FolderOpen,    label: 'Projects',    done: sections.projects   },
    { key: 'certs',       Icon: Award,         label: 'Certs',       done: sections.certs      },
    { key: 'social',      Icon: Link2,         label: 'Social',      done: sections.social     },
    { key: 'career',      Icon: Target,        label: 'Career',      done: sections.career     },
  ];

  return (
    <div className="spf-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="spf-header">
        <div>
          <h1 className="spf-title">Complete Your Profile</h1>
          <p className="spf-subtitle">A complete profile boosts your chances with recruiters by 4×</p>
        </div>
        <div className="spf-completion-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#c9a227" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - completion / 100)}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}/>
          </svg>
          <div className="spf-completion-text">{completion}%</div>
        </div>
      </div>

      <div className="spf-body">
        {/* ── Side Nav ──────────────────────────────────────────────── */}
        <nav className="spf-nav">
          {NAV_ITEMS.map(({ key, Icon, label, done }) => (
            <button key={key} type="button"
              className={`spf-nav-item ${activeSection === key ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => setActiveSection(key)}>
              <Icon size={16}/>
              <span>{label}</span>
              {done && <CheckCircle size={12} className="spf-nav-check"/>}
              {activeSection === key && <ChevronRight size={14} className="spf-nav-arrow"/>}
            </button>
          ))}
        </nav>

        {/* ── Form ──────────────────────────────────────────────────── */}
        <form className="spf-form" onSubmit={handleSubmit}>

          {/* Personal Info */}
          {activeSection === 'personal' && (
            <div className="spf-section">
              <div className="spf-section-header"><User size={20}/> Personal Information</div>
              <div className="spf-grid">
                <Field label="First Name *" value={profileData.personalInfo.firstName}
                  onChange={v => set('personalInfo','firstName',v)} placeholder="John"/>
                <Field label="Last Name" value={profileData.personalInfo.lastName}
                  onChange={v => set('personalInfo','lastName',v)} placeholder="Doe"/>
                <Field label="Email *" type="email" value={profileData.personalInfo.email}
                  onChange={v => set('personalInfo','email',v)} placeholder="john@example.com"/>
                <Field label="Phone" type="tel" value={profileData.personalInfo.phone}
                  onChange={v => set('personalInfo','phone',v)} placeholder="+91 9876543210"/>
                <Field label="Date of Birth" type="date" value={profileData.personalInfo.dateOfBirth}
                  onChange={v => set('personalInfo','dateOfBirth',v)}/>
                <div className="spf-field">
                  <label>Gender</label>
                  <select value={profileData.personalInfo.gender} onChange={e => set('personalInfo','gender',e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {activeSection === 'address' && (
            <div className="spf-section">
              <div className="spf-section-header"><MapPin size={20}/> Address</div>
              <div className="spf-grid">
                <div className="spf-field full">
                  <label>Street</label>
                  <input value={profileData.address.street} placeholder="123 Main St"
                    onChange={e => set('address','street',e.target.value)}/>
                </div>
                <Field label="City *"    value={profileData.address.city}    onChange={v => set('address','city',v)}    placeholder="Mumbai"/>
                <Field label="State"     value={profileData.address.state}   onChange={v => set('address','state',v)}   placeholder="Maharashtra"/>
                <Field label="Zip Code"  value={profileData.address.zipCode} onChange={v => set('address','zipCode',v)} placeholder="400001"/>
                <Field label="Country *" value={profileData.address.country} onChange={v => set('address','country',v)} placeholder="India"/>
              </div>
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="spf-section">
              <div className="spf-section-header"><GraduationCap size={20}/> Education</div>
              <div className="spf-grid">
                <div className="spf-field full">
                  <label>Institution *</label>
                  <input value={profileData.education.institution} placeholder="IIT Bombay, BITS Pilani…"
                    onChange={e => set('education','institution',e.target.value)}/>
                </div>
                <Field label="Degree *"       value={profileData.education.degree}    onChange={v => set('education','degree',v)}    placeholder="B.Tech, M.Sc, MBA…"/>
                <Field label="Field of Study"  value={profileData.education.field}     onChange={v => set('education','field',v)}     placeholder="Computer Science"/>
                <Field label="Start Date" type="date" value={profileData.education.startDate} onChange={v => set('education','startDate',v)}/>
                <Field label="End Date (or Expected)" type="date" value={profileData.education.endDate} onChange={v => set('education','endDate',v)}/>
                <Field label="CGPA / GPA" type="number" value={profileData.education.cgpa} onChange={v => set('education','cgpa',v)} placeholder="8.5"/>
              </div>
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="spf-section">
              <div className="spf-section-header"><Wrench size={20}/> Skills</div>
              {[
                { key: 'technical', label: '💻 Technical Skills',     placeholder: 'React, Node.js, Python…'  },
                { key: 'tools',     label: '⚙️ Tools & Platforms',    placeholder: 'Git, Docker, AWS…'        },
                { key: 'soft',      label: '🤝 Soft Skills',          placeholder: 'Leadership, Teamwork…'    },
                { key: 'languages', label: '🌍 Languages',            placeholder: 'English, Hindi, French…'  },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="skill-group">
                  <label className="skill-group-label">{label}</label>
                  <TagInput tags={profileData.skills[key] || []} placeholder={placeholder}
                    onChange={tags => setSkill(key, tags)}/>
                </div>
              ))}
            </div>
          )}

          {/* Work Experience */}
          {activeSection === 'experience' && (
            <div className="spf-section">
              <div className="spf-section-header"><Briefcase size={20}/> Work Experience</div>
              {profileData.workExperience.map((w, i) => (
                <div key={i} className="spf-card">
                  <div className="spf-card-header">
                    <span>{w.jobTitle || `Experience ${i+1}`}</span>
                    <button type="button" className="spf-remove-btn"
                      onClick={() => setArray('workExperience', profileData.workExperience.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                  <div className="spf-grid">
                    <Field label="Company"   value={w.company}   onChange={v => { const a=[...profileData.workExperience]; a[i]={...a[i],company:v};   setArray('workExperience',a); }} placeholder="Google, Infosys…"/>
                    <Field label="Job Title" value={w.jobTitle}  onChange={v => { const a=[...profileData.workExperience]; a[i]={...a[i],jobTitle:v};  setArray('workExperience',a); }} placeholder="Software Engineer"/>
                    <Field label="Duration"  value={w.duration}  onChange={v => { const a=[...profileData.workExperience]; a[i]={...a[i],duration:v};  setArray('workExperience',a); }} placeholder="Jun 2023 – Aug 2023"/>
                    <div className="spf-field full">
                      <label>Description</label>
                      <textarea rows={3} value={w.description} placeholder="Key responsibilities and achievements…"
                        onChange={e => { const a=[...profileData.workExperience]; a[i]={...a[i],description:e.target.value}; setArray('workExperience',a); }}/>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="spf-add-btn"
                onClick={() => setArray('workExperience', [...profileData.workExperience, { ...EMPTY_WORK }])}>
                + Add Experience
              </button>
            </div>
          )}

          {/* Projects */}
          {activeSection === 'projects' && (
            <div className="spf-section">
              <div className="spf-section-header"><FolderOpen size={20}/> Projects</div>
              {profileData.projects.map((p, i) => (
                <div key={i} className="spf-card">
                  <div className="spf-card-header">
                    <span>{p.title || `Project ${i+1}`}</span>
                    <button type="button" className="spf-remove-btn"
                      onClick={() => setArray('projects', profileData.projects.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                  <div className="spf-grid">
                    <Field label="Project Title *" value={p.title} onChange={v => { const a=[...profileData.projects]; a[i]={...a[i],title:v}; setArray('projects',a); }} placeholder="Smart Campus System"/>
                    <Field label="Project Link"  value={p.link}  onChange={v => { const a=[...profileData.projects]; a[i]={...a[i],link:v};  setArray('projects',a); }} placeholder="https://github.com/..."/>
                    <div className="spf-field full">
                      <label>Description *</label>
                      <textarea rows={3} value={p.description} placeholder="What does this project do? What problem does it solve?"
                        onChange={e => { const a=[...profileData.projects]; a[i]={...a[i],description:e.target.value}; setArray('projects',a); }}/>
                    </div>
                    <div className="spf-field full">
                      <label>Technologies Used</label>
                      <TagInput tags={p.technologies || []} placeholder="React, Node.js, MongoDB…"
                        onChange={tags => { const a=[...profileData.projects]; a[i]={...a[i],technologies:tags}; setArray('projects',a); }}/>
                    </div>
                    <div className="spf-field full">
                      <label>Key Highlights</label>
                      <textarea rows={2} value={p.highlights || ''} placeholder="e.g., Reduced load time by 40%, served 500+ users…"
                        onChange={e => { const a=[...profileData.projects]; a[i]={...a[i],highlights:e.target.value}; setArray('projects',a); }}/>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="spf-add-btn"
                onClick={() => setArray('projects', [...profileData.projects, { ...EMPTY_PROJECT, technologies: [] }])}>
                + Add Project
              </button>
            </div>
          )}

          {/* Certifications */}
          {activeSection === 'certs' && (
            <div className="spf-section">
              <div className="spf-section-header"><Award size={20}/> Certifications</div>
              {profileData.certifications.map((c, i) => (
                <div key={i} className="spf-card">
                  <div className="spf-card-header">
                    <span>{c.name || `Certification ${i+1}`}</span>
                    <button type="button" className="spf-remove-btn"
                      onClick={() => setArray('certifications', profileData.certifications.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                  <div className="spf-grid">
                    <Field label="Certification Name *" value={c.name}         onChange={v => { const a=[...profileData.certifications]; a[i]={...a[i],name:v};         setArray('certifications',a); }} placeholder="AWS Solutions Architect"/>
                    <Field label="Issuing Organisation"  value={c.issuer}       onChange={v => { const a=[...profileData.certifications]; a[i]={...a[i],issuer:v};       setArray('certifications',a); }} placeholder="Amazon Web Services"/>
                    <Field label="Date Issued" type="date" value={c.date}       onChange={v => { const a=[...profileData.certifications]; a[i]={...a[i],date:v};         setArray('certifications',a); }}/>
                    <Field label="Credential / Cert ID"  value={c.credentialId} onChange={v => { const a=[...profileData.certifications]; a[i]={...a[i],credentialId:v}; setArray('certifications',a); }} placeholder="ABC-123-XYZ"/>
                  </div>
                </div>
              ))}
              <button type="button" className="spf-add-btn"
                onClick={() => setArray('certifications', [...profileData.certifications, { ...EMPTY_CERT }])}>
                + Add Certification
              </button>
            </div>
          )}

          {/* Social Links */}
          {activeSection === 'social' && (
            <div className="spf-section">
              <div className="spf-section-header"><Link2 size={20}/> Social & Portfolio Links</div>
              <div className="spf-grid">
                <Field label="🔗 LinkedIn"  type="url" value={profileData.socialLinks.linkedin}  onChange={v => set('socialLinks','linkedin',v)}  placeholder="https://linkedin.com/in/yourname"/>
                <Field label="🐙 GitHub"    type="url" value={profileData.socialLinks.github}    onChange={v => set('socialLinks','github',v)}    placeholder="https://github.com/yourname"/>
                <Field label="🌐 Portfolio" type="url" value={profileData.socialLinks.portfolio} onChange={v => set('socialLinks','portfolio',v)} placeholder="https://yourportfolio.com"/>
                <Field label="🐦 Twitter"   type="url" value={profileData.socialLinks.twitter}   onChange={v => set('socialLinks','twitter',v)}   placeholder="https://twitter.com/yourname"/>
              </div>
            </div>
          )}

          {/* Career Preferences */}
          {activeSection === 'career' && (
            <div className="spf-section">
              <div className="spf-section-header"><Target size={20}/> Career Preferences</div>
              <div className="spf-grid">
                <div className="spf-field full">
                  <label>Preferred Roles</label>
                  <TagInput tags={profileData.careerPreferences.preferredRoles || []}
                    placeholder="Frontend Developer, Data Analyst, DevOps…"
                    onChange={tags => setCareer('preferredRoles', tags)}/>
                </div>
                <div className="spf-field full">
                  <label>Preferred Industries</label>
                  <TagInput tags={profileData.careerPreferences.preferredIndustries || []}
                    placeholder="FinTech, EdTech, Healthcare, SaaS…"
                    onChange={tags => setCareer('preferredIndustries', tags)}/>
                </div>
                <div className="spf-field">
                  <label>Work Preference</label>
                  <select value={profileData.careerPreferences.workPreference}
                    onChange={e => setCareer('workPreference', e.target.value)}>
                    <option value="">Select</option>
                    <option>Remote</option><option>On-site</option><option>Hybrid</option>
                  </select>
                </div>
                <div className="spf-field">
                  <label>Willing to Relocate?</label>
                  <select value={profileData.careerPreferences.willingToRelocate}
                    onChange={e => setCareer('willingToRelocate', e.target.value === 'true')}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Submit Bar ──────────────────────────────────────────── */}
          <div className="spf-actions">
            {qrCode && (
              <button type="button" className="spf-btn-qr" onClick={handleDownloadQR}>
                <Download size={16}/> Download QR
              </button>
            )}
            <button type="submit" className="spf-btn-save" disabled={loading || saved} id="save-profile-btn">
              {loading ? <><Loader size={15} className="spin"/> Saving…</>
               : saved  ? <><CheckCircle size={15}/> Saved! Redirecting…</>
               :          <><Save size={15}/> Save Profile</>}
            </button>
            <button type="button" className="spf-btn-view" onClick={() => navigate('/student/view-profile')}>
              View Profile →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Field helper ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="spf-field">
      <label>{label}</label>
      <input type={type} value={value || ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}/>
    </div>
  );
}