import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { FiUsers, FiCheckCircle, FiDollarSign, FiBriefcase, FiTrendingUp } from 'react-icons/fi';

// ─── Color palette ───────────────────────────────────────────────
const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6'];
const STATUS_COLORS = {
  Pending: '#f59e0b',
  Shortlisted: '#3b82f6',
  Interview: '#8b5cf6',
  Selected: '#10b981',
  Rejected: '#ef4444',
};

// ─── Custom Tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="pa-tooltip">
        <p className="pa-tooltip-label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── KPI Card ────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="pa-kpi-card" style={{ '--kpi-accent': color }}>
    <div className="pa-kpi-icon" style={{ background: color }}>
      <Icon size={22} />
    </div>
    <div className="pa-kpi-body">
      <p className="pa-kpi-value">{value}</p>
      <p className="pa-kpi-label">{label}</p>
      {sub && <p className="pa-kpi-sub">{sub}</p>}
    </div>
  </div>
);

// ─── Chart Section Wrapper ────────────────────────────────────────
const ChartSection = ({ title, children, half }) => (
  <div className={`pa-chart-section${half ? ' pa-half' : ''}`}>
    <h3 className="pa-chart-title">{title}</h3>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────
const PlacementAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/analytics/placements');
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-wrapper">
        <div className="pa-header">
          <h1 className="pa-main-title">Placement Analytics</h1>
        </div>
        <div className="pa-skeleton-grid">
          {[1,2,3,4,5].map(i => <div key={i} className="pa-skeleton-card" />)}
        </div>
        <div className="pa-skeleton-charts">
          {[1,2,3,4].map(i => <div key={i} className="pa-skeleton-chart" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pa-wrapper">
        <div className="pa-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="pa-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const { summary, applicationFunnel, statusBreakdown, companyWise, departmentWise, monthlyTrend, salaryDistribution, jobTypeBreakdown } = data;

  const formatPackage = (val) => {
    if (!val) return '₹0';
    const lpa = val / 100000;
    if (lpa >= 1) return `₹${lpa.toFixed(1)} LPA`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="pa-wrapper">
      {/* ── Page Header ── */}
      <div className="pa-header">
        <div>
          <h1 className="pa-main-title">📊 Placement Analytics</h1>
          <p className="pa-subtitle">Real-time insights into campus placement performance</p>
        </div>
        <button onClick={fetchAnalytics} className="pa-refresh-btn">↻ Refresh</button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="pa-kpi-grid">
        <KPICard
          icon={FiUsers}
          label="Total Students"
          value={summary.totalStudents}
          color="#667eea"
        />
        <KPICard
          icon={FiCheckCircle}
          label="Total Placed"
          value={summary.totalPlacements}
          sub="Students selected"
          color="#10b981"
        />
        <KPICard
          icon={FiTrendingUp}
          label="Placement Rate"
          value={`${summary.placementRate}%`}
          sub="Of total students"
          color="#8b5cf6"
        />
        <KPICard
          icon={FiDollarSign}
          label="Avg. Package"
          value={formatPackage(summary.avgPackage)}
          color="#f59e0b"
        />
        <KPICard
          icon={FiBriefcase}
          label="Companies Hired"
          value={summary.uniqueCompanies}
          sub="Unique recruiters"
          color="#ef4444"
        />
      </div>

      {/* ── Charts Row 1: Monthly Trend + Application Funnel ── */}
      <div className="pa-charts-row">
        <ChartSection title="📈 Monthly Placement Trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="placGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="placements"
                name="Placements"
                stroke="#667eea"
                strokeWidth={2.5}
                fill="url(#placGrad)"
                dot={{ fill: '#667eea', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title="🔄 Application Status Breakdown" half>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusBreakdown.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* ── Charts Row 2: Company-wise + Dept-wise ── */}
      <div className="pa-charts-row">
        <ChartSection title="🏢 Top Companies by Placements">
          {companyWise.length === 0 ? (
            <p className="pa-no-data">No company data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={companyWise} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis
                  type="category"
                  dataKey="company"
                  width={110}
                  tick={{ fontSize: 11, fill: '#555' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="placements" name="Placements" radius={[0, 4, 4, 0]} barSize={18}>
                  {companyWise.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        <ChartSection title="🎓 Department-wise Placements" half>
          {departmentWise.length === 0 ? (
            <p className="pa-no-data">No department data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentWise} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 10, fill: '#666', angle: -25, textAnchor: 'end' }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="placements" name="Placements" radius={[4, 4, 0, 0]} barSize={28}>
                  {departmentWise.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>
      </div>

      {/* ── Charts Row 3: Salary Distribution + Job Type ── */}
      <div className="pa-charts-row">
        <ChartSection title="💰 Salary Distribution (LPA)">
          {salaryDistribution.every(d => d.count === 0) ? (
            <p className="pa-no-data">No salary data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salaryDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} barSize={50}>
                  {salaryDistribution.map((_, i) => (
                    <Cell key={i} fill={['#667eea', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        <ChartSection title="📋 Placement Funnel" half>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={applicationFunnel} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} barSize={50}>
                {applicationFunnel.map((_, i) => (
                  <Cell key={i} fill={['#667eea', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* ── Job Type Pie (if data exists) ── */}
      {jobTypeBreakdown && jobTypeBreakdown.length > 0 && (
        <div className="pa-charts-row">
          <ChartSection title="📂 Placement by Job Type">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={jobTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="type"
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                >
                  {jobTypeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </ChartSection>
        </div>
      )}
    </div>
  );
};

export default PlacementAnalytics;
