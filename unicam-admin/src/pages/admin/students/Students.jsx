import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Mail, ShieldCheck, Trash2, UserCheck, Users, X } from 'lucide-react';
import api from '../../../api/api';
import ConfirmDialog from '../../../components/ConfirmDialog';
import DataTable from '../../../components/DataTable';
import { useToast } from '../../../components/toastContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import '../universities/Universities.css';

export default function Students() {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const requestSequence = useRef(0);

  const fetchStudents = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);

    try {
      const response = await api.get('/admin/students', {
        params: { page, search },
      });

      if (requestId !== requestSequence.current) return;
      setStudents(response.data.data || []);
      setPagination({
        page: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0,
        perPage: response.data.per_page || 10,
      });
    } catch (error) {
      if (requestId === requestSequence.current) {
        showToast(t(error.response?.data?.message || 'Failed to load students.'), 'error');
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [page, search, showToast, t]);

  useEffect(() => {
    const timeout = window.setTimeout(fetchStudents, 250);
    return () => {
      window.clearTimeout(timeout);
      requestSequence.current += 1;
    };
  }, [fetchStudents]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  async function openStudent(student) {
    try {
      const response = await api.get(`/admin/students/${student.id}`);
      setSelectedStudent(response.data);
    } catch (error) {
      showToast(t(error.response?.data?.message || 'Unable to load student details.'), 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/admin/students/${deleteTarget.id}`);
      showToast(t('Student deleted successfully.'), 'success');
      setDeleteTarget(null);
      setSelectedStudent(null);
      if (students.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchStudents();
      }
    } catch (error) {
      showToast(t(error.response?.data?.message || 'Failed to delete student.'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (student) => (
        <div className="uni-cell">
          <strong>{student.name}</strong>
          <span className="uni-cell__short">{student.email}</span>
        </div>
      ),
    },
    {
      key: 'email_verified_at',
      label: 'Email Status',
      render: (student) => (
        <span className={`status-badge ${student.email_verified_at ? 'status-badge--active' : 'status-badge--inactive'}`}>
          {t(student.email_verified_at ? 'Verified' : 'Unverified')}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (student) => student.created_at
        ? new Date(student.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US')
        : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (student) => (
        <div className="table-actions">
          <button
            className="table-action-btn"
            title={t('View profile')}
            aria-label={t('View profile for {name}', { name: student.name })}
            onClick={() => openStudent(student)}
          >
            <Eye size={15} />
          </button>
          <button
            className="table-action-btn table-action-btn--danger"
            title={t('Delete')}
            aria-label={t('Delete {name}', { name: student.name })}
            onClick={() => setDeleteTarget(student)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="universities-page">
      <DataTable
        title="Students"
        columns={columns}
        data={students}
        loading={loading}
        emptyMessage="No students found."
        emptyIcon={Users}
        searchPlaceholder="Search by name or email..."
        searchValue={search}
        onSearch={updateSearch}
        pagination={pagination}
        onPageChange={setPage}
        actions={
          <div className="students-total">
            <Users size={16} />
            <span>{t('{total} students', { total: pagination.total })}</span>
          </div>
        }
      />

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h2>{t('Student Profile')}</h2>
              <button
                className="modal__close"
                onClick={() => setSelectedStudent(null)}
                aria-label={t('Close profile')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="profile-header">
                <div className="profile-avatar">
                  {(selectedStudent.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedStudent.name}</h2>
                  <p>{t('Student')}</p>
                </div>
              </div>
              <div className="profile-grid">
                <div className="info-tile">
                  <Mail size={18} />
                  <span className="info-label">{t('Email')}</span>
                  <strong>{selectedStudent.email}</strong>
                </div>
                <div className="info-tile">
                  <ShieldCheck size={18} />
                  <span className="info-label">{t('Email status')}</span>
                  <strong>{t(selectedStudent.email_verified_at ? 'Verified' : 'Unverified')}</strong>
                </div>
                <div className="info-tile">
                  <UserCheck size={18} />
                  <span className="info-label">{t('Registered')}</span>
                  <strong>
                    {selectedStudent.created_at
                      ? new Date(selectedStudent.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US')
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('Delete Student')}
        message={t('Are you sure you want to delete "{name}"? This action cannot be undone.', { name: deleteTarget?.name })}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
