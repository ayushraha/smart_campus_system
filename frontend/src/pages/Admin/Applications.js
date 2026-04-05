import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiSearch } from 'react-icons/fi';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let data = applications;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(a =>
        (a.studentId?.name || '').toLowerCase().includes(q) ||
        (a.studentId?.email || '').toLowerCase().includes(q) ||
        (a.jobId?.title || '').toLowerCase().includes(q) ||
        (a.jobId?.company || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      data = data.filter(a => a.status === statusFilter);
    }
    if (companyFilter) {
      data = data.filter(a => a.jobId?.company === companyFilter);
    }
    setFiltered(data);
  }, [search, statusFilter, companyFilter, applications]);

  // Derive unique companies for the dropdown
  const uniqueCompanies = Array.from(new Set(applications.map(a => a.jobId?.company).filter(Boolean))).sort();

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/admin/applications');
      setApplications(response.data);
      setFiltered(response.data);
    } catch (error) {
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1>All Applications</h1>
        <span style={{ color: '#888', fontSize: 14 }}>{filtered.length} records</span>
      </div>

      {/* Search & Filter */}
      <div className="filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by student, email, job or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <option value="">All Companies</option>
          {uniqueCompanies.map((comp, idx) => (
            <option key={idx} value={comp}>{comp}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>Company</th>
              <th>Status</th>
              <th>Applied Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app._id}>
                <td>{app.studentId?.name || <em style={{color:'#aaa'}}>Deleted User</em>}</td>
                <td>{app.studentId?.email || <em style={{color:'#aaa'}}>N/A</em>}</td>
                <td>{app.jobId?.title || <em style={{color:'#aaa'}}>Deleted Job</em>}</td>
                <td>{app.jobId?.company || '—'}</td>
                <td>
                  <span className={`badge ${app.status}`}>{app.status}</span>
                </td>
                <td>
                  {app.appliedDate
                    ? format(new Date(app.appliedDate), 'MMM dd, yyyy')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="no-data">
            {applications.length === 0 ? 'No applications found' : 'No results match your search'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;