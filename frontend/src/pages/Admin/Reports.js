import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  FiFileText, FiDownload, FiSearch, FiFilter, FiBriefcase, 
  FiUsers, FiTrendingUp, FiCheckCircle 
} from 'react-icons/fi';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

const Reports = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await axios.get('/api/admin/reports/placements');
      setPlacements(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error fetching placement reports');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter Logic ───────────────────────────────────────────────────────────
  const filteredPlacements = useMemo(() => {
    return placements.filter(p => {
      const sName = p.studentId?.name || '';
      const sEmail = p.studentId?.email || '';
      const company = p.jobId?.company || '';
      const dept = p.studentId?.studentProfile?.department || '';

      const matchesSearch = sName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           sEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = !companyFilter || company === companyFilter;
      const matchesDept = !deptFilter || dept === deptFilter;

      return matchesSearch && matchesCompany && matchesDept;
    });
  }, [placements, searchTerm, companyFilter, deptFilter]);

  // Unique companies and departments for the dropdowns
  const companies = useMemo(() => {
    return [...new Set(placements.map(p => p.jobId?.company).filter(Boolean))].sort();
  }, [placements]);

  const departments = useMemo(() => {
    return [...new Set(placements.map(p => p.studentId?.studentProfile?.department).filter(Boolean))].sort();
  }, [placements]);

  // Unique placed students count
  const uniquePlacedCount = useMemo(() => {
    return new Set(filteredPlacements.map(p => p.studentId?._id)).size;
  }, [filteredPlacements]);

  // ─── Export Functions ────────────────────────────────────────────────────────
  
  const prepareExportData = () => {
    return filteredPlacements.map(p => ({
      'Student Name': p.studentId?.name || 'N/A',
      'Email': p.studentId?.email || 'N/A',
      'Department': p.studentId?.studentProfile?.department || 'N/A',
      'Company': p.jobId?.company || 'N/A',
      'Position': p.jobId?.title || 'N/A',
      'Salary': `${p.jobId?.salary?.min || 0} - ${p.jobId?.salary?.max || 0} ${p.jobId?.salary?.currency || 'INR'}`,
      'Selection Date': p.updatedAt ? format(new Date(p.updatedAt), 'MMM dd, yyyy') : 'N/A'
    }));
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    if (data.length === 0) return toast.info('No data to export');

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Placement_Report_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    toast.success('CSV Exported Successfully');
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    if (data.length === 0) return toast.info('No data to export');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Placements");
    XLSX.writeFile(wb, `Placement_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success('Excel Exported Successfully');
  };

  const exportToPDF = () => {
    try {
      const data = prepareExportData();
      if (data.length === 0) return toast.info('No data to export');

      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Add Report Header
      doc.setFontSize(18);
      doc.text("Placement Selection Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 30);
      doc.text(`Total Placements: ${filteredPlacements.length} | Unique Students: ${uniquePlacedCount}`, 14, 35);

      const tableColumn = Object.keys(data[0]);
      const tableRows = data.map(item => Object.values(item));

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 9, overflow: 'linebreak' },
        margin: { top: 40 }
      });

      doc.save(`Placement_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF Exported Successfully');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF. Please try CSV or Excel.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Placement Reports</h1>
          <p className="subtitle">Analyze and export recruitment data</p>
        </div>
        <div className="export-buttons">
          <button onClick={exportToCSV} className="btn-secondary">
            <FiDownload /> CSV
          </button>
          <button onClick={exportToExcel} className="btn-secondary">
            <FiDownload /> Excel
          </button>
          <button onClick={exportToPDF} className="btn-primary">
            <FiFileText /> PDF Report
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="summary-card purple">
          <div className="card-icon"><FiTrendingUp /></div>
          <div className="card-info">
            <h3>{placements.length}</h3>
            <p>Total Offers</p>
          </div>
        </div>
        <div className="summary-card green">
           <div className="card-icon"><FiUsers /></div>
           <div className="card-info">
            <h3>{uniquePlacedCount}</h3>
            <p>Students Placed</p>
           </div>
        </div>
        <div className="summary-card blue">
          <div className="card-icon"><FiBriefcase /></div>
          <div className="card-info">
            <h3>{companies.length}</h3>
            <p>Companies Hired</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search student or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <div className="filter-item">
            <FiBriefcase className="filter-icon" />
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="filter-item">
            <FiFilter className="filter-icon" />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {(searchTerm || companyFilter || deptFilter) && (
            <button className="clear-filter" onClick={() => {
              setSearchTerm(''); setCompanyFilter(''); setDeptFilter('');
            }}>Reset</button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Department</th>
              <th>Company</th>
              <th>Position</th>
              <th>Salary (INR)</th>
              <th>Selection Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlacements.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="student-cell">
                    <strong>{p.studentId?.name || "Deleted User"}</strong>
                    <span>{p.studentId?.email || ""}</span>
                  </div>
                </td>
                <td>{p.studentId?.studentProfile?.department || 'N/A'}</td>
                <td><span className="badge-company">{p.jobId?.company || '—'}</span></td>
                <td>{p.jobId?.title || 'N/A'}</td>
                <td>
                   {p.jobId?.salary?.min && p.jobId?.salary?.max 
                     ? `${(p.jobId.salary.min/100000).toFixed(1)} - ${(p.jobId.salary.max/100000).toFixed(1)} LPA` 
                     : '—'}
                </td>
                <td>
                  <div className="date-cell">
                    <FiCheckCircle className="status-icon" />
                    {p.updatedAt ? format(new Date(p.updatedAt), 'MMM dd, yyyy') : '—'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPlacements.length === 0 && (
          <div className="no-data-v2">
            <FiSearch size={40} />
            <p>No matching records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;