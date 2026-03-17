// frontend/src/pages/Recruiter/CreateDriveEvent.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, Users, Clock, Briefcase, ChevronRight } from 'lucide-react';
import './CreateDriveEvent.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TOKEN = () => localStorage.getItem('token');

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biotechnology', 'MBA', 'MCA', 'All Departments'
];

const EVENT_TYPES = [
  { value: 'placement-drive', label: '🎯 Placement Drive', desc: 'Full campus hiring drive' },
  { value: 'interview',       label: '🎤 Interview',       desc: 'Technical or HR rounds' },
  { value: 'ppt',             label: '💼 Pre-Placement Talk', desc: 'Company overview session' },
  { value: 'info-session',    label: 'ℹ️ Info Session',    desc: 'Q&A and information sharing' },
  { value: 'workshop',        label: '🧑‍💻 Workshop',      desc: 'Hands-on training session' },
  { value: 'deadline',        label: '⏰ Application Deadline', desc: 'Submission cutoff reminder' },
];

const CreateDriveEvent = () => {
  const [form, setForm] = useState({
    title: '',
    company: '',
    type: 'placement-drive',
    eventDate: '',
    applicationDeadline: '',
    description: '',
    venue: '',
    maxSlots: '',
    minCGPA: '',
    salaryMin: '',
    salaryMax: '',
    departments: [],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDept = (dept) => {
    setForm(prev => {
      if (dept === 'All Departments') {
        return { ...prev, departments: prev.departments.includes('All Departments') ? [] : ['All Departments'] };
      }
      const without = prev.departments.filter(d => d !== 'All Departments');
      if (without.includes(dept)) return { ...prev, departments: without.filter(d => d !== dept) };
      return { ...prev, departments: [...without, dept] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.eventDate) {
      toast.error('Please fill in Title, Company and Event Date');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        company: form.company,
        type: form.type,
        eventDate: form.eventDate,
        applicationDeadline: form.applicationDeadline || undefined,
        description: form.description,
        venue: form.venue,
        maxSlots: form.maxSlots ? parseInt(form.maxSlots) : 0,
        eligibility: {
          minCGPA: form.minCGPA ? parseFloat(form.minCGPA) : 0,
          departments: form.departments.includes('All Departments') ? [] : form.departments,
        },
        salary: (form.salaryMin || form.salaryMax) ? {
          min: form.salaryMin ? parseFloat(form.salaryMin) : 0,
          max: form.salaryMax ? parseFloat(form.salaryMax) : 0,
          currency: 'INR'
        } : undefined,
      };

      const res = await axios.post(`${API}/drive-events`, payload, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      });

      if (res.data.success) {
        toast.success('🎉 Drive event posted! Subscribed students have been notified.');
        setForm({
          title: '', company: '', type: 'placement-drive', eventDate: '',
          applicationDeadline: '', description: '', venue: '', maxSlots: '',
          minCGPA: '', salaryMin: '', salaryMax: '', departments: []
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
    setLoading(false);
  };

  return (
    <div className="cde-page">
      <div className="cde-header">
        <h1>📅 Post a Drive Event</h1>
        <p>Create a campus placement drive or event. Subscribed students will be notified instantly.</p>
      </div>

      <form className="cde-form" onSubmit={handleSubmit}>
        {/* Event Type selector */}
        <div className="cde-section">
          <label className="cde-label">Event Type</label>
          <div className="cde-type-grid">
            {EVENT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`cde-type-card ${form.type === t.value ? 'selected' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, type: t.value }))}
              >
                <span className="cde-type-label">{t.label}</span>
                <span className="cde-type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="cde-section">
          <div className="cde-section-title"><Briefcase size={16} /> Basic Information</div>
          <div className="cde-row">
            <div className="cde-field">
              <label className="cde-label">Drive Title *</label>
              <input className="cde-input" name="title" value={form.title}
                onChange={handleChange} placeholder="e.g. Google SWE Campus Drive 2026" required />
            </div>
            <div className="cde-field">
              <label className="cde-label">Company Name *</label>
              <input className="cde-input" name="company" value={form.company}
                onChange={handleChange} placeholder="e.g. Google" required />
            </div>
          </div>
          <div className="cde-field">
            <label className="cde-label">Description</label>
            <textarea className="cde-input cde-textarea" name="description" value={form.description}
              onChange={handleChange} placeholder="Describe the event, roles, process, etc." rows={4} />
          </div>
        </div>

        {/* Dates & Venue */}
        <div className="cde-section">
          <div className="cde-section-title"><Clock size={16} /> Schedule & Venue</div>
          <div className="cde-row">
            <div className="cde-field">
              <label className="cde-label">Event Date & Time *</label>
              <input className="cde-input" type="datetime-local" name="eventDate"
                value={form.eventDate} onChange={handleChange} required />
            </div>
            <div className="cde-field">
              <label className="cde-label">Application Deadline</label>
              <input className="cde-input" type="datetime-local" name="applicationDeadline"
                value={form.applicationDeadline} onChange={handleChange} />
            </div>
          </div>
          <div className="cde-row">
            <div className="cde-field">
              <label className="cde-label"><MapPin size={13} /> Venue</label>
              <input className="cde-input" name="venue" value={form.venue}
                onChange={handleChange} placeholder="e.g. Main Auditorium, Online (Teams)" />
            </div>
            <div className="cde-field">
              <label className="cde-label"><Users size={13} /> Max Slots (0 = unlimited)</label>
              <input className="cde-input" type="number" name="maxSlots" value={form.maxSlots}
                onChange={handleChange} placeholder="e.g. 100" min={0} />
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="cde-section">
          <div className="cde-section-title">🎓 Eligibility Criteria</div>
          <div className="cde-row">
            <div className="cde-field">
              <label className="cde-label">Minimum CGPA</label>
              <input className="cde-input" type="number" step="0.1" min="0" max="10"
                name="minCGPA" value={form.minCGPA} onChange={handleChange} placeholder="e.g. 7.0" />
            </div>
            <div className="cde-field">
              <label className="cde-label">Salary Range (₹ in LPA)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="cde-input" type="number" name="salaryMin" value={form.salaryMin}
                  onChange={handleChange} placeholder="Min (e.g. 8)" />
                <input className="cde-input" type="number" name="salaryMax" value={form.salaryMax}
                  onChange={handleChange} placeholder="Max (e.g. 15)" />
              </div>
            </div>
          </div>
          <div className="cde-field">
            <label className="cde-label">Target Departments</label>
            <div className="cde-dept-grid">
              {DEPARTMENTS.map(dept => (
                <label key={dept} className={`cde-dept-chip ${form.departments.includes(dept) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.departments.includes(dept)}
                    onChange={() => toggleDept(dept)} />
                  {dept}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="cde-submit-btn" disabled={loading}>
          {loading ? (
            <><span className="cde-spinner"></span> Posting Event...</>
          ) : (
            <>Post Drive Event <ChevronRight size={18} /></>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateDriveEvent;
