import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './TrackApplications.css';
import {
  Search, Filter, RefreshCw, Briefcase, MapPin, Clock,
  ChevronDown, ChevronUp, Trash2, ExternalLink, CheckCircle,
  XCircle, AlertCircle, Calendar, Building
} from 'lucide-react';

const API     = process.env.REACT_APP_API_URL;
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// Pipeline stages in order
const STAGES = [
  { key: 'pending',     label: 'Applied',      icon: '📤', color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  { key: 'shortlisted', label: 'Shortlisted',  icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  { key: 'interview',   label: 'Interview',    icon: '🎤', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { key: 'selected',    label: 'Selected',     icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  { key: 'rejected',    label: 'Not Selected', icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.10)'   },
];

const stageIndex = (status) => {
  const positiveIdx = STAGES.findIndex(s => s.key === status);
  return positiveIdx === -1 ? 0 : positiveIdx;
};

const isTerminal = (status) => status === 'selected' || status === 'rejected';

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return formatDate(d);
};

export default function TrackApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [expanded, setExpanded]         = useState(null);
  const [view, setView]                 = useState('timeline'); // timeline / kanban

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/student/applications`, { headers: HEADERS() });
      setApplications(res.data || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await axios.delete(`${API}/student/applications/${id}`, { headers: HEADERS() });
      toast.success('Application withdrawn');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot withdraw');
    }
  };

  // Filtering
  const filtered = applications.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter;
    const matchSearch = !search ||
      a.jobId?.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.jobId?.company?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Kanban grouping
  const kanbanCols = STAGES.map(s => ({
    ...s,
    apps: filtered.filter(a => a.status === s.key)
  }));

  // Summary counts
  const counts = STAGES.reduce((acc, s) => {
    acc[s.key] = applications.filter(a => a.status === s.key).length;
    return acc;
  }, {});

  // ── Render a single application pipeline tracker ──────────────────
  const PipelineTracker = ({ app }) => {
    const curIdx    = stageIndex(app.status);
    const terminal  = isTerminal(app.status);
    const isRejected = app.status === 'rejected';
    const visibleStages = STAGES.slice(0, terminal ? curIdx + 1 : 4);

    return (
      <div className="ta-pipeline">
        {visibleStages.map((stage, i) => {
          const done    = i < curIdx;
          const current = i === curIdx;
          const future  = i > curIdx;
          return (
            <React.Fragment key={stage.key}>
              <div className={`ta-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${future ? 'future' : ''} ${isRejected && current ? 'rejected' : ''}`}>
                <div className="ta-node-circle" style={current ? { borderColor: stage.color, boxShadow: `0 0 12px ${stage.color}66` } : {}}>
                  {done ? '✓' : current ? stage.icon : ''}
                </div>
                <div className="ta-node-label">{stage.label}</div>
              </div>
              {i < visibleStages.length - 1 && (
                <div className={`ta-connector ${done ? 'done' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── Application Card ──────────────────────────────────────────────
  const AppCard = ({ app }) => {
    const stage      = STAGES.find(s => s.key === app.status) || STAGES[0];
    const isExpanded = expanded === app._id;

    return (
      <div className={`ta-card ${app.status}`}>
        <div className="ta-card-top" onClick={() => setExpanded(isExpanded ? null : app._id)}>
          <div className="ta-card-left">
            <div className="ta-company-badge" style={{ background: stage.bg, borderColor: stage.color + '44' }}>
              <Building size={14} color={stage.color} />
            </div>
            <div>
              <div className="ta-job-title">{app.jobId?.title || 'Unknown Role'}</div>
              <div className="ta-job-meta">
                <span><Building size={11} />{app.jobId?.company || '—'}</span>
                {app.jobId?.location && <span><MapPin size={11} />{app.jobId.location}</span>}
                <span><Clock size={11} />{timeAgo(app.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="ta-card-right">
            <span className="ta-status-badge" style={{ background: stage.bg, color: stage.color, borderColor: stage.color + '55' }}>
              {stage.icon} {stage.label}
            </span>
            {isExpanded ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
          </div>
        </div>

        {/* Pipeline tracker row */}
        <PipelineTracker app={app} />

        {/* Expanded detail */}
        {isExpanded && (
          <div className="ta-card-detail">
            <div className="ta-detail-row">
              <div className="ta-detail-item">
                <label>Applied On</label>
                <span>{formatDate(app.createdAt)}</span>
              </div>
              <div className="ta-detail-item">
                <label>Job Type</label>
                <span>{app.jobId?.jobType || '—'}</span>
              </div>
              {app.jobId?.salary?.min && (
                <div className="ta-detail-item">
                  <label>Salary</label>
                  <span>₹{app.jobId.salary.min}–{app.jobId.salary.max} LPA</span>
                </div>
              )}
              {app.interviewDetails?.date && (
                <div className="ta-detail-item highlight">
                  <label>📅 Interview Date</label>
                  <span>{formatDate(app.interviewDetails.date)} {app.interviewDetails.time && `· ${app.interviewDetails.time}`}</span>
                </div>
              )}
              {app.interviewDetails?.mode && (
                <div className="ta-detail-item">
                  <label>Mode</label>
                  <span>{app.interviewDetails.mode === 'online' ? '💻 Online' : '🏢 Offline'}</span>
                </div>
              )}
              {app.interviewDetails?.location && (
                <div className="ta-detail-item">
                  <label>Venue</label>
                  <span>{app.interviewDetails.location}</span>
                </div>
              )}
              {app.interviewDetails?.meetingLink && (
                <div className="ta-detail-item">
                  <label>Meeting Link</label>
                  <a href={app.interviewDetails.meetingLink} target="_blank" rel="noopener noreferrer" className="ta-link">
                    Join Meeting <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>

            {app.feedback && (
              <div className="ta-feedback">
                <label>💬 Recruiter Feedback</label>
                <p>{app.feedback}</p>
              </div>
            )}

            {app.interviewDetails?.notes && (
              <div className="ta-feedback">
                <label>📝 Interview Notes</label>
                <p>{app.interviewDetails.notes}</p>
              </div>
            )}

            {app.status === 'pending' && (
              <button className="ta-withdraw-btn" onClick={() => handleWithdraw(app._id)}>
                <Trash2 size={13} /> Withdraw Application
              </button>
            )}

            {app.status === 'selected' && (
              <div className="ta-congrats">
                🎉 Congratulations! You've been selected for this role. Check your email for next steps.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="ta-page">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="ta-header">
        <div>
          <h1 className="ta-title">Application Tracker</h1>
          <p className="ta-subtitle">Track your placement journey in real-time</p>
        </div>
        <div className="ta-header-actions">
          <button className="ta-view-toggle" onClick={() => setView(v => v === 'timeline' ? 'kanban' : 'timeline')}>
            {view === 'timeline' ? '⊞ Kanban' : '☰ Timeline'}
          </button>
          <button className="ta-refresh-btn" onClick={fetchApplications}>
            <RefreshCw size={14} className={loading ? 'ta-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="ta-summary">
        {STAGES.map(s => (
          <div
            key={s.key}
            className={`ta-summary-card ${filter === s.key ? 'active' : ''}`}
            style={{ '--card-color': s.color }}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
          >
            <span className="ta-summary-icon">{s.icon}</span>
            <span className="ta-summary-count">{counts[s.key] || 0}</span>
            <span className="ta-summary-label">{s.label}</span>
          </div>
        ))}
        <div className="ta-summary-card total" onClick={() => setFilter('all')}>
          <span className="ta-summary-icon">📋</span>
          <span className="ta-summary-count">{applications.length}</span>
          <span className="ta-summary-label">Total</span>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="ta-controls">
        <div className="ta-search">
          <Search size={14} className="ta-search-icon" />
          <input
            placeholder="Search by company or job title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ta-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="ta-loading">
          <div className="ta-loading-spinner" />
          Loading your applications…
        </div>
      ) : filtered.length === 0 ? (
        <div className="ta-empty">
          <Briefcase size={48} strokeWidth={1} />
          <h3>No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
          <p>{filter !== 'all' ? 'Try a different filter.' : 'Browse jobs and apply to start tracking your placement journey!'}</p>
        </div>
      ) : view === 'timeline' ? (
        <div className="ta-list">
          {filtered.map(app => <AppCard key={app._id} app={app} />)}
        </div>
      ) : (
        /* Kanban view */
        <div className="ta-kanban">
          {kanbanCols.filter(c => c.key !== 'rejected').map(col => (
            <div key={col.key} className="ta-kanban-col">
              <div className="ta-kanban-col-header" style={{ borderColor: col.color }}>
                <span>{col.icon} {col.label}</span>
                <span className="ta-kanban-count" style={{ background: col.bg, color: col.color }}>{col.apps.length}</span>
              </div>
              <div className="ta-kanban-cards">
                {col.apps.length === 0 ? (
                  <div className="ta-kanban-empty">No applications</div>
                ) : col.apps.map(app => (
                  <div key={app._id} className="ta-kanban-card" style={{ borderLeftColor: col.color }}>
                    <div className="ta-kanban-job">{app.jobId?.title}</div>
                    <div className="ta-kanban-company"><Building size={11} />{app.jobId?.company}</div>
                    <div className="ta-kanban-date"><Clock size={11} />{timeAgo(app.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
