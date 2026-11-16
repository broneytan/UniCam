
/**
 * Dashboard — UniCam Admin Overview
 * Displays real statistics, analytics, quick actions,
 * and recently added universities from Laravel API.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle,
  Plus,
  List,
  ArrowRight,
  Eye,
  Pencil,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import api from '../../../api/api';
import StatCard from '../../../components/StatCard';
import { useLanguage } from '../../../i18n/LanguageContext';
import './Dashboard.css';

// ============================================
// Chart Colors
// ============================================

const UNIVERSITY_STATUS_COLORS = ['#16A34A', '#94A3B8'];

function getCreatedTimestamp(date) {
  const timestamp = date ? new Date(date).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

// ============================================
// Helper: Fetch all pages from Laravel
// ============================================

async function fetchAllPages(endpoint) {
  const firstResponse = await api.get(endpoint, {
    params: { page: 1 },
  });

  // Support Laravel paginated responses
  const firstData = Array.isArray(firstResponse.data)
    ? firstResponse.data
    : firstResponse.data.data || [];

  const lastPage = firstResponse.data.last_page || 1;

  if (lastPage <= 1) {
    return firstData;
  }

  const pageRequests = [];

  for (let page = 2; page <= lastPage; page++) {
    pageRequests.push(
      api.get(endpoint, { params: { page } })
    );
  }

  const pageResponses = await Promise.all(pageRequests);

  const remainingData = pageResponses.flatMap((response) =>
    Array.isArray(response.data)
      ? response.data
      : response.data.data || []
  );

  return [...firstData, ...remainingData];
}

// ============================================
// Main Dashboard Component
// ============================================

export default function Dashboard() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Dashboard data
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Used to retry fetching data
  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================
  // Fetch Dashboard Data
  // ============================================

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError('');

      try {
        const [allUniversities, allMajors] = await Promise.all([
          fetchAllPages('/universities'),
          fetchAllPages('/majors'),
        ]);

        if (isMounted) {
          setUniversities(allUniversities);
          setMajors(allMajors);
        }
      } catch (err) {
        console.error('Dashboard API error:', err);

        if (isMounted) {
          setError(
            'Unable to load dashboard data. Please check your API connection and try again.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // ============================================
  // Refresh Dashboard
  // ============================================

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((previous) => previous + 1);
  }, []);

  // ============================================
  // Computed Statistics
  // ============================================

  const totalUniversities = universities.length;

  const activeUniversities = universities.filter(
    (university) =>
      university.is_active === true ||
      university.is_active === 1 ||
      university.is_active === '1'
  ).length;

  const inactiveUniversities = totalUniversities - activeUniversities;
  const totalMajors = majors.length;

  const activePercentage =
    totalUniversities > 0
      ? Math.round((activeUniversities / totalUniversities) * 100)
      : 0;

  const universityStatusData = [
    { name: 'Active', value: activeUniversities },
    { name: 'Inactive', value: inactiveUniversities },
  ];

  const majorsByUni = {};

  majors.forEach((major) => {
    const universityName =
      major.university?.short_name ||
      major.university?.name ||
      'Unknown';

    majorsByUni[universityName] =
      (majorsByUni[universityName] || 0) + 1;
  });

  const majorsByUniData = Object.entries(majorsByUni)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ============================================
  // Recent Universities
  // ============================================

  const recentUniversities = [...universities]
    .sort((a, b) => getCreatedTimestamp(b.created_at) - getCreatedTimestamp(a.created_at))
    .slice(0, 5);

  const recentMajors = [...majors]
    .sort((a, b) => getCreatedTimestamp(b.created_at) - getCreatedTimestamp(a.created_at))
    .slice(0, 5);

  // ============================================
  // Currency Formatter
  // ============================================

  const formatTuitionFee = (fee) => {
    if (fee === null || fee === undefined || fee === '') {
      return '—';
    }

    return `$${Number(fee).toLocaleString()}`;
  };

  const formatCreatedDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

    return parsedDate.toLocaleDateString(language === 'km' ? 'km-KH' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================
  // Render Dashboard
  // ============================================

  return (
    <div className="dashboard">

      {/* ======================================
          Greeting and Refresh
      ====================================== */}

      <div className="dashboard__greeting">
        <div>
          <h2 className="dashboard__greeting-title">
            {t('Welcome back!')}
          </h2>

          <p className="dashboard__greeting-text">
            {t("Here's an overview of your university management system.")}
          </p>
        </div>

        <button
          type="button"
          className="dashboard__refresh-btn"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title={t('Refresh dashboard')}
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'dashboard__refresh-icon--spin' : ''}
          />
          <span>{t(refreshing ? 'Refreshing...' : 'Refresh')}</span>
        </button>
      </div>

      {/* ======================================
          API Error Message
      ====================================== */}

      {error && (
        <div className="dashboard__error">
          <div className="dashboard__error-content">
            <AlertCircle size={20} />

            <p>{t(error)}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {t('Retry')}
          </button>
        </div>
      )}

      {/* ======================================
          Statistics Cards
      ====================================== */}

      <div className="dashboard__stats">
        <StatCard
          icon={GraduationCap}
          label={t('Total Universities')}
          value={loading ? '...' : totalUniversities}
          color="#2E75E1"
        />

        <StatCard
          icon={CheckCircle}
          label={t('Active Universities')}
          value={loading ? '...' : activeUniversities}
          color="#16A34A"
          subtitle={
            !loading && totalUniversities > 0
              ? t('{count}% active', { count: activePercentage })
              : undefined
          }
        />

        <StatCard
          icon={BookOpen}
          label={t('Total Majors')}
          value={loading ? '...' : totalMajors}
          color="#F59E0B"
        />

        <StatCard
          icon={Layers}
          label={t('Inactive Universities')}
          value={loading ? '...' : inactiveUniversities}
          color="#8B5CF6"
          subtitle={
            !loading
              ? totalUniversities > 0
                ? t('{count}% inactive', { count: 100 - activePercentage })
                : t('No universities yet')
              : undefined
          }
        />
      </div>

      {/* ======================================
          Quick Actions
      ====================================== */}

      <section className="dashboard__quick-actions">
        <div className="dashboard__quick-header">
          <div>
            <h3 className="dashboard__section-title">{t('Quick Actions')}</h3>
            <p className="dashboard__section-description">
              {t('Common university and major management tasks.')}
            </p>
          </div>
        </div>

        <div className="dashboard__quick-grid">
          <button
            type="button"
            className="dashboard__quick-btn dashboard__quick-btn--primary"
            onClick={() => navigate('/universities/add')}
          >
            <Plus size={19} />
            <span>{t('Add University')}</span>
          </button>

          <button
            type="button"
            className="dashboard__quick-btn"
            onClick={() => navigate('/majors/add')}
          >
            <Plus size={19} />
            <span>{t('Add Major')}</span>
          </button>

          <button
            type="button"
            className="dashboard__quick-btn"
            onClick={() => navigate('/universities')}
          >
            <List size={19} />
            <span>{t('Manage Universities')}</span>
          </button>

          <button
            type="button"
            className="dashboard__quick-btn"
            onClick={() => navigate('/majors')}
          >
            <BookOpen size={19} />
            <span>{t('Manage Majors')}</span>
          </button>
        </div>
      </section>

      {/* ======================================
          Analytics Charts
      ====================================== */}

      <div className="dashboard__charts">
        <section className="dashboard__chart-card">
          <div className="dashboard__chart-header">
            <div>
              <h3 className="dashboard__chart-title">{t('University Status')}</h3>
              <p className="dashboard__chart-description">
                {t('Active and inactive universities')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard__chart-empty">
              {t('Loading university data...')}
            </div>
          ) : totalUniversities > 0 ? (
            <div className="dashboard__donut-content">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={universityStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={94}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {universityStatusData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={UNIVERSITY_STATUS_COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      t('{count} universities', { count: value }),
                      t(name),
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard__donut-center" aria-hidden="true">
                <strong>{totalUniversities}</strong>
                <span>{t('universities')}</span>
              </div>
              <div className="dashboard__donut-legend">
                {universityStatusData.map((item, index) => (
                  <div className="dashboard__donut-legend-item" key={item.name}>
                    <span
                      className="dashboard__donut-legend-dot"
                      style={{ backgroundColor: UNIVERSITY_STATUS_COLORS[index] }}
                    />
                    <span>{t(item.name)}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dashboard__chart-empty">
              {t('No university data available')}
            </div>
          )}
        </section>

        <section className="dashboard__chart-card">
          <div className="dashboard__chart-header">
            <div>
              <h3 className="dashboard__chart-title">{t('Majors by University')}</h3>
              <p className="dashboard__chart-description">
                {t('Top {count} universities by listed majors', { count: majorsByUniData.length })}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard__chart-empty">
              {t('Loading major data...')}
            </div>
          ) : majorsByUniData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={majorsByUniData}
                margin={{ top: 12, right: 12, left: -12, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  interval={0}
                  angle={majorsByUniData.length > 4 ? -20 : 0}
                  textAnchor={majorsByUniData.length > 4 ? 'end' : 'middle'}
                  height={majorsByUniData.length > 4 ? 55 : 30}
                />
                <YAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(value) => [
                    t('{count} majors', { count: value }),
                    t('Majors'),
                  ]}
                  cursor={{ fill: 'rgba(46, 117, 225, 0.08)' }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#2E75E1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard__chart-empty">
              {t('No major data available')}
            </div>
          )}
        </section>
      </div>

      {/* ======================================
          Recent Universities
      ====================================== */}

      <div className="dashboard__recent-grid">
        <section className="dashboard__recent">
          <div className="dashboard__recent-header">
            <div>
              <h3 className="dashboard__section-title">{t('Recent Universities')}</h3>

              <p className="dashboard__section-description">
                {t('Recently added universities in your system.')}
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary dashboard__view-all"
              onClick={() => navigate('/universities')}
            >
              {t('View All')}
              <ArrowRight size={15} />
            </button>
          </div>

          {loading ? (
            <div className="dashboard__loading">
              <RefreshCw size={20} className="dashboard__loading-icon" />
              <span>{t('Loading universities...')}</span>
            </div>
          ) : recentUniversities.length > 0 ? (
            <div className="dashboard__recent-table-wrap">
              <table className="data-table dashboard__table">
                <thead>
                  <tr>
                    <th>{t('University')}</th>
                    <th>{t('Location')}</th>
                    <th>{t('Type')}</th>
                    <th>{t('Tuition Fee')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Actions')}</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUniversities.map((university) => {
                    const isActive =
                      university.is_active === true ||
                      university.is_active === 1 ||
                      university.is_active === '1';

                    return (
                      <tr key={university.id}>
                        <td>
                          <div className="dashboard__uni-name">
                            <strong>{university.name}</strong>

                            {university.short_name && (
                              <span className="dashboard__uni-short">
                                {university.short_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>{university.location || '—'}</td>

                        <td>{university.university_type || '—'}</td>

                        <td>{formatTuitionFee(university.tuition_fee)}</td>

                        <td>
                          <span
                            className={`status-badge ${
                              isActive
                                ? 'status-badge--active'
                                : 'status-badge--inactive'
                            }`}
                          >
                            {t(isActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action-btn"
                              title={t('View universities')}
                              aria-label={t('View universities')}
                              onClick={() => navigate('/universities')}
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              className="table-action-btn"
                              title={t('Edit')}
                              aria-label={`${t('Edit')} ${university.name}`}
                              onClick={() =>
                                navigate(`/universities/edit/${university.id}`)
                              }
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <GraduationCap size={42} />

              <h4>{t('No universities found')}</h4>

              <p>
                {t('Add your first university to start managing your system.')}
              </p>

              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/universities/add')}
              >
                <Plus size={16} />
                {t('Add University')}
              </button>
            </div>
          )}
        </section>

        <section className="dashboard__recent dashboard__recent-majors">
          <div className="dashboard__recent-header">
            <div>
              <h3 className="dashboard__section-title">{t('Recent Majors')}</h3>
              <p className="dashboard__section-description">
                {t('Recently added programs in your system.')}
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary dashboard__view-all"
              onClick={() => navigate('/majors')}
            >
              {t('View All')}
              <ArrowRight size={15} />
            </button>
          </div>

          {loading ? (
            <div className="dashboard__loading">
              <RefreshCw size={20} className="dashboard__loading-icon" />
              <span>{t('Loading majors...')}</span>
            </div>
          ) : recentMajors.length > 0 ? (
            <div className="dashboard__major-list">
              {recentMajors.map((major) => (
                <button
                  type="button"
                  className="dashboard__major-item"
                  key={major.id}
                  onClick={() => navigate(`/majors/edit/${major.id}`)}
                  aria-label={t('Edit {name}', { name: major.name })}
                >
                  <span className="dashboard__major-icon">
                    <BookOpen size={17} />
                  </span>
                  <span className="dashboard__major-info">
                    <strong>{major.name}</strong>
                    <span>
                      {major.university?.short_name ||
                        major.university?.name ||
                        t('University unavailable')}
                    </span>
                  </span>
                  <span className="dashboard__major-date">
                    {formatCreatedDate(major.created_at)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state dashboard__major-empty">
              <BookOpen size={36} />
              <h4>{t('No majors found')}</h4>
              <p>{t('Add a major to see it here.')}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/majors/add')}
              >
                <Plus size={16} />
                {t('Add Major')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
