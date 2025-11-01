import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Reports = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await axios.get('/api/admin/reports/placements');
      setPlacements(response.data);
    } catch (error) {
      toast.error('Error fetching placement reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Company', 'Position', 'Salary', 'Selection Date'];
    const rows = placements.map(p => [
      p.studentId?.name,
      p.studentId?.email,
      p.jobId?.company,
      p.jobId?.title,
      `${p.jobId?.salary?.min} - ${p.jobId?.salary?.max} ${p.jobId?.salary?.currency}`,
      format(new Date(p.updatedAt), 'MMM dd, yyyy')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'placement_report.csv';
    a.click();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Placement Reports</h1>
        <button onClick={exportToCSV} className="btn-primary">
          Export to CSV
        </button>
      </div>

      <div className="stats-summary">
        <div className="summary-card">
          <h3>{placements.length}</h3>
          <p>Total Placements</p>
        </div>
        <div className="summary-card">
          <h3>{new Set(placements.map(p => p.jobId?.company)).size}</h3>
          <p>Companies</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Company</th>
              <th>Position</th>
              <th>Salary Range</th>
              <th>Selection Date</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={placement._id}>
                <td>{placement.studentId?.name}</td>
                <td>{placement.studentId?.email}</td>
                <td>{placement.studentId?.studentProfile?.department || 'N/A'}</td>
                <td>{placement.jobId?.company}</td>
                <td>{placement.jobId?.title}</td>
                <td>
                  {placement.jobId?.salary?.min} - {placement.jobId?.salary?.max} {placement.jobId?.salary?.currency}
                </td>
                <td>{format(new Date(placement.updatedAt), 'MMM dd, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {placements.length === 0 && (
          <div className="no-data">No placement data available</div>
        )}
      </div>
    </div>
  );
};

export default Reports;