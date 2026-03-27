import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiSearch, FiMapPin, FiBriefcase, FiDollarSign,
  FiCalendar, FiClock, FiUsers, FiStar, FiX,
  FiChevronRight, FiFilter, FiZap
} from 'react-icons/fi';
import { format } from 'date-fns';
import './Jobs.css';

const JOB_TYPE_COLORS = {
  'Full-time':  { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  'Part-time':  { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  'Internship': { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  'Contract':   { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
};

const getCompanyInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const getCompanyColor = (name = '') => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444'];
  return colors[name.charCodeAt(0) % colors.length];
};

const Jobs = () => {
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]         = useState({ search: '', location: '', jobType: '' });
  const [applicationData, setApplicationData] = useState({ coverLetter: '', resume: '' });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)   params.append('search',   filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType)  params.append('jobType',  filters.jobType);
      const { data } = await axios.get(`/api/student/jobs?${params}`);
      setJobs(data);
    } catch {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await axios.post(`/api/student/jobs/${selectedJob._id}/apply`, applicationData);
      toast.success('🎉 Application submitted successfully!');
      setSelectedJob(null);
      setApplicationData({ coverLetter: '', resume: '' });
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const daysUntil = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const typeStyle = (type) => JOB_TYPE_COLORS[type] || JOB_TYPE_COLORS['Full-time'];

  return (
    <div className="jb-root">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="jb-header">
        <div>
          <h1 className="jb-title">Browse Jobs</h1>
          <p className="jb-subtitle">
            <FiZap style={{ color: '#f59e0b' }} />
            {loading ? 'Loading opportunities...' : `${jobs.length} opportunities available`}
          </p>
        </div>
        <button className="jb-filter-toggle" onClick={() => setShowFilters(v => !v)}>
          <FiFilter /> Filters
          {(filters.jobType || filters.location) && <span className="jb-filter-dot" />}
        </button>
      </div>

      {/* ── Search & Filters ─────────────────────────────────────── */}
      <div className="jb-search-wrap">
        <div className="jb-search-box">
          <FiSearch className="jb-search-icon" />
          <input
            className="jb-search-input"
            type="text"
            placeholder="Search by role, company, or keyword..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {showFilters && (
        <div className="jb-filters-panel">
          <div className="jb-filter-group">
            <label>Job Type</label>
            <div className="jb-filter-pills">
              {['', 'Full-time', 'Part-time', 'Internship', 'Contract'].map(t => (
                <button
                  key={t}
                  className={`jb-pill ${filters.jobType === t ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, jobType: t })}
                >
                  {t || 'All Types'}
                </button>
              ))}
            </div>
          </div>
          <div className="jb-filter-group">
            <label>Location</label>
            <input
              className="jb-location-input"
              type="text"
              placeholder="e.g. Pune, Mumbai, Remote..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────────────────────── */}
      {loading && (
        <div className="jb-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="jb-skeleton" />
          ))}
        </div>
      )}

      {/* ── Job Cards Grid ───────────────────────────────────────── */}
      {!loading && (
        <>
          {jobs.length === 0 ? (
            <div className="jb-empty">
              <div className="jb-empty-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="jb-grid">
              {jobs.map((job, idx) => {
                const ts = typeStyle(job.jobType);
                const days = daysUntil(job.applicationDeadline);
                const urgent = days <= 3 && days >= 0;
                const color = getCompanyColor(job.company);
                return (
                  <div key={job._id} className="jb-card" style={{ animationDelay: `${idx * 0.05}s` }}>

                    {/* Card top bar accent */}
                    <div className="jb-card-accent" style={{ background: color }} />

                    <div className="jb-card-body">
                      {/* Company avatar + type badge */}
                      <div className="jb-card-top">
                        <div className="jb-company-avatar" style={{ background: `${color}22`, border: `1.5px solid ${color}44`, color }}>
                          {getCompanyInitials(job.company)}
                        </div>
                        <div
                          className="jb-type-badge"
                          style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}
                        >
                          {job.jobType}
                        </div>
                      </div>

                      {/* Title & Company */}
                      <h3 className="jb-job-title">{job.title}</h3>
                      <p className="jb-job-company">
                        <FiBriefcase style={{ color }} /> {job.company}
                      </p>

                      {/* Meta row */}
                      <div className="jb-meta">
                        {job.location && (
                          <span className="jb-meta-item">
                            <FiMapPin /> {job.location}
                          </span>
                        )}
                        {job.salary?.min && (
                          <span className="jb-meta-item">
                            <FiDollarSign /> {job.salary.min}–{job.salary.max} {job.salary.currency}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="jb-description">
                        {job.description?.substring(0, 120)}{job.description?.length > 120 ? '...' : ''}
                      </p>

                      {/* Skills chips */}
                      {job.requirements?.length > 0 && (
                        <div className="jb-skills">
                          {job.requirements.slice(0, 4).map((skill, i) => (
                            <span key={i} className="jb-skill-chip">{skill}</span>
                          ))}
                          {job.requirements.length > 4 && (
                            <span className="jb-skill-chip jb-skill-more">+{job.requirements.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="jb-card-footer">
                        <div className={`jb-deadline ${urgent ? 'urgent' : ''}`}>
                          <FiCalendar />
                          {urgent
                            ? `⚡ Only ${days} day${days !== 1 ? 's' : ''} left!`
                            : days < 0
                              ? 'Deadline passed'
                              : `Closes ${format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}`}
                        </div>
                        <button className="jb-apply-btn" onClick={() => setSelectedJob(job)}>
                          Apply Now <FiChevronRight />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Apply Modal ──────────────────────────────────────────── */}
      {selectedJob && (
        <div className="jb-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="jb-modal" onClick={e => e.stopPropagation()}>
            <button className="jb-modal-close" onClick={() => setSelectedJob(null)}><FiX /></button>

            {/* Modal Header */}
            <div className="jb-modal-header" style={{ borderColor: getCompanyColor(selectedJob.company) }}>
              <div
                className="jb-modal-avatar"
                style={{
                  background: `${getCompanyColor(selectedJob.company)}22`,
                  color: getCompanyColor(selectedJob.company),
                  border: `2px solid ${getCompanyColor(selectedJob.company)}55`
                }}
              >
                {getCompanyInitials(selectedJob.company)}
              </div>
              <div>
                <h2 className="jb-modal-title">{selectedJob.title}</h2>
                <p className="jb-modal-company">{selectedJob.company} · {selectedJob.location}</p>
              </div>
            </div>

            {/* Job Info chips */}
            <div className="jb-modal-chips">
              {selectedJob.jobType && (
                <span className="jb-chip"><FiBriefcase /> {selectedJob.jobType}</span>
              )}
              {selectedJob.salary?.min && (
                <span className="jb-chip"><FiDollarSign /> {selectedJob.salary.min}–{selectedJob.salary.max} {selectedJob.salary.currency}</span>
              )}
              {selectedJob.applicationDeadline && (
                <span className="jb-chip"><FiCalendar /> Closes {format(new Date(selectedJob.applicationDeadline), 'MMM dd, yyyy')}</span>
              )}
            </div>

            {/* Apply Form */}
            <form onSubmit={handleApply} className="jb-form">
              <div className="jb-form-group">
                <label className="jb-label">Cover Letter <span>*</span></label>
                <textarea
                  className="jb-textarea"
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  required
                  rows={6}
                  placeholder="Tell us why you're a perfect fit for this role..."
                />
              </div>
              <div className="jb-form-group">
                <label className="jb-label">Resume URL <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="url"
                  className="jb-input"
                  value={applicationData.resume}
                  onChange={(e) => setApplicationData({ ...applicationData, resume: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="jb-modal-actions">
                <button type="button" className="jb-btn-cancel" onClick={() => setSelectedJob(null)}>Cancel</button>
                <button type="submit" className="jb-btn-submit" disabled={applying}>
                  {applying ? (
                    <><span className="jb-spinner" /> Submitting...</>
                  ) : (
                    <><FiZap /> Submit Application</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;