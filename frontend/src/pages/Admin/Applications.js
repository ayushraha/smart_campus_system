import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/admin/applications');
      setApplications(response.data);
    } catch (error) {
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-page">
      <h1>All Applications</h1>

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
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.studentId?.name}</td>
                <td>{app.studentId?.email}</td>
                <td>{app.jobId?.title}</td>
                <td>{app.jobId?.company}</td>
                <td>
                  <span className={`badge ${app.status}`}>{app.status}</span>
                </td>
                <td>{format(new Date(app.appliedDate), 'MMM dd, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="no-data">No applications found</div>
        )}
      </div>
    </div>
  );
};

export default Applications;