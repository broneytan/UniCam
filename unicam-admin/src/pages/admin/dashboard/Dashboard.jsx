/**
 * Dashboard — Main overview page with statistics, charts,
 * recent universities table, and quick action shortcuts.
 * All data is fetched from the real Laravel API.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle,
  Plus,
  List,
  ArrowRight,
  Eye,
  Pencil,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../../api/api';
import StatCard from '../../../components/StatCard';
import './Dashboard.css';

// Chart color palette
const CHART_COLORS = ['#2E75E1', '#5B9CF5', '#93C4FD', '#BAD9FE', '#1D5FBF', '#4A8AED'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all pages of universities and majors for accurate stats
        const [uniRes, majorRes] = await Promise.all([
          api.get('/universities', { params: { page: 1 } }),
          api.get('/majors', { params: { page: 1 } }),
        ]);

        let allUnis = uniRes.data.data || [];
        let allMajors = majorRes.data.data || [];

        // If there are more pages, fetch them all
        const uniLastPage = uniRes.data.last_page || 1;
        const majorLastPage = majorRes.data.last_page || 1;

        if (uniLastPage > 1) {
          const uniPages = [];
          for (let i = 2; i <= uniLastPage; i++) {
            uniPages.push(api.get('/universities', { params: { page: i } }));
          }
          const results = await Promise.all(uniPages);
          results.forEach((r) => { allUnis = allUnis.concat(r.data.data || []); });
        }

        if (majorLastPage > 1) {
          const majorPages = [];
          for (let i = 2; i <= majorLastPage; i++) {
            majorPages.push(api.get('/majors', { params: { page: i } }));
          }
          const results = await Promise.all(majorPages);
          results.forEach((r) => { allMajors = allMajors.concat(r.data.data || []); });
        }

        setUniversities(allUnis);
        setMajors(allMajors);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- Computed Statistics ---
  const totalUniversities = universities.length;
  const activeUniversities = universities.filter((u) => u.is_active).length;
  const totalMajors = majors.length;
  // Students stat — no backend support yet
  const totalStudents = '—';

  // --- Chart Data: Universities by Type ---
  const uniByType = universities.reduce((acc, u) => {
    const type = u.university_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const uniTypeData = Object.entries(uniByType).map(([name, value]) => ({ name, value }));

  // --- Chart Data: Majors by University ---
  const majorsByUni = {};
  majors.forEach((m) => {
    const uniName = m.university?.short_name || m.university?.name || 'Unknown';
    majorsByUni[uniName] = (majorsByUni[uniName] || 0) + 1;
  });
  const majorsByUniData = Object.entries(majorsByUni)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8

  // Recent universities (latest 5)
  const recentUniversities = universities.slice(0, 5);

  return (
    <div className="dashboard">
      {/* Greeting & summary */}
      <div className="dashboard__greeting">
        <div>
          <h2 className="dashboard__greeting-title">Welcome back!</h2>
          <p className="dashboard__greeting-text">
            Here's an overview of your university management system.
          </p>
        </div>
      </div>

      {/* Statistic Cards */}
      <div className="dashboard__stats">
        <StatCard
          icon={GraduationCap}
          label="Total Universities"
          value={loading ? '...' : totalUniversities}
          color="#2E75E1"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Universities"
          value={loading ? '...' : activeUniversities}
          color="#16A34A"
          subtitle={!loading && totalUniversities > 0 ? `${Math.round((activeUniversities / totalUniversities) * 100)}% active` : undefined}
        />
        <StatCard
          icon={BookOpen}
          label="Total Majors"
          value={loading ? '...' : totalMajors}
          color="#F59E0B"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={totalStudents}
          color="#8B5CF6"
          subtitle="Coming soon"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard__charts">
        {/* Universities by Type (Pie) */}
        <div className="dashboard__chart-card">
          <h3 className="dashboard__chart-title">Universities by Type</h3>
          {uniTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={uniTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {uniTypeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard__chart-empty">
              <p>No university data available</p>
            </div>
          )}
        </div>

        {/* Majors by University (Bar) */}
        <div className="dashboard__chart-card">
          <h3 className="dashboard__chart-title">Majors by University</h3>
          {majorsByUniData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={majorsByUniData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                  }}
                />
                <Bar dataKey="count" fill="#2E75E1" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard__chart-empty">
              <p>No major data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard__quick-actions">
        <h3 className="dashboard__section-title">Quick Actions</h3>
        <div className="dashboard__quick-grid">
          <button className="dashboard__quick-btn" onClick={() => navigate('/universities/add')}>
            <Plus size={20} />
            <span>Add University</span>
          </button>
          <button className="dashboard__quick-btn" onClick={() => navigate('/universities')}>
            <List size={20} />
            <span>Manage Universities</span>
          </button>
          <button className="dashboard__quick-btn" onClick={() => navigate('/majors')}>
            <BookOpen size={20} />
            <span>Manage Majors</span>
          </button>
        </div>
      </div>

      {/* Recent Universities */}
      <div className="dashboard__recent">
        <div className="dashboard__recent-header">
          <h3 className="dashboard__section-title">Recent Universities</h3>
          <button className="btn-secondary" onClick={() => navigate('/universities')}>
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="dashboard__loading">Loading...</div>
        ) : recentUniversities.length > 0 ? (
          <div className="dashboard__recent-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>University</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Tuition Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUniversities.map((uni) => (
                  <tr key={uni.id}>
                    <td>
                      <div className="dashboard__uni-name">
                        <strong>{uni.name}</strong>
                        {uni.short_name && <span className="dashboard__uni-short">{uni.short_name}</span>}
                      </div>
                    </td>
                    <td>{uni.location || '—'}</td>
                    <td>{uni.university_type || '—'}</td>
                    <td>{uni.tuition_fee ? `$${Number(uni.tuition_fee).toLocaleString()}` : '—'}</td>
                    <td>
                      <span className={`status-badge ${uni.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        {uni.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-btn"
                          title="View details"
                          onClick={() => navigate(`/universities`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="table-action-btn"
                          title="Edit"
                          onClick={() => navigate(`/universities/edit/${uni.id}`)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard__empty-state">
            <GraduationCap size={40} />
            <p>No universities found. Add your first university to get started.</p>
            <button className="btn-primary" onClick={() => navigate('/universities/add')}>
              <Plus size={16} /> Add University
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
