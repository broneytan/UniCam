/**
 * Majors — Major management page with search, filters, and CRUD actions.
 * Linked to universities via the real Laravel API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../../api/api';
import ConfirmDialog from '../../../components/ConfirmDialog';
import DataTable from '../../../components/DataTable';
import { useToast } from '../../../components/toastContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import '../universities/Universities.css';

const EMPTY_FORM = {
  university_id: '',
  name: '',
  description: '',
  tuition_fee: '',
  duration_years: '',
};

function buildFormFromMajor(major) {
  if (!major) {
    return { ...EMPTY_FORM };
  }

  return {
    university_id: String(major.university_id || ''),
    name: major.name || '',
    description: major.description || '',
    tuition_fee: major.tuition_fee ?? '',
    duration_years: major.duration_years ?? '',
  };
}

function resolveRouteModal(pathname, majors, routeMajor) {
  if (pathname === '/majors/add') {
    return { mode: 'add', major: null };
  }

  const match = pathname.match(/^\/majors\/edit\/(\d+)$/);
  if (!match) {
    return null;
  }

  const majorId = Number(match[1]);
  const existing = majors.find((major) => major.id === majorId);

  if (existing) {
    return { mode: 'edit', major: existing };
  }

  if (routeMajor && routeMajor.id === majorId) {
    return { mode: 'edit', major: routeMajor };
  }

  return { mode: 'pending', majorId };
}

function MajorFormModal({ mode, initialMajor, universities, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => buildFormFromMajor(initialMajor));
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  function validateForm() {
    const nextErrors = {};

    if (!form.university_id) {
      nextErrors.university_id = 'University is required.';
    }

    if (!form.name.trim()) {
      nextErrors.name = 'Major name is required.';
    }

    if (form.tuition_fee !== '' && Number(form.tuition_fee) < 0) {
      nextErrors.tuition_fee = 'Tuition fee cannot be negative.';
    }

    if (form.duration_years !== '' && (Number(form.duration_years) < 1 || Number(form.duration_years) > 20)) {
      nextErrors.duration_years = 'Duration must be between 1 and 20 years.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = { ...form };
      payload.university_id = Number(payload.university_id);

      if (payload.tuition_fee === '') {
        payload.tuition_fee = null;
      } else {
        payload.tuition_fee = Number(payload.tuition_fee);
      }

      if (payload.duration_years === '') {
        payload.duration_years = null;
      } else {
        payload.duration_years = Number(payload.duration_years);
      }

      await onSubmit({ payload, isEditing: mode === 'edit', currentMajor: initialMajor });
    } catch (err) {
      const backendErrors = err.response?.data?.errors || {};
      const nextErrors = {};

      Object.entries(backendErrors).forEach(([key, value]) => {
        nextErrors[key] = Array.isArray(value) ? value[0] : value;
      });

      setErrors(nextErrors);
      throw err;
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t(mode === 'edit' ? 'Edit Major' : 'Add Major')}</h2>
          <button className="modal__close" onClick={onClose} type="button" aria-label={t('Close form')}>×</button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField label="University" required error={errors.university_id}>
              <select
                value={form.university_id}
                onChange={(e) => setForm((prev) => ({ ...prev, university_id: e.target.value }))}
              >
                <option value="">{t('Select university')}</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>{university.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Major Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Tuition Fee ($)" error={errors.tuition_fee}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.tuition_fee}
                onChange={(e) => setForm((prev) => ({ ...prev, tuition_fee: e.target.value }))}
              />
            </FormField>

            <FormField label="Duration in Years" error={errors.duration_years}>
              <input
                type="number"
                min="1"
                max="20"
                value={form.duration_years}
                onChange={(e) => setForm((prev) => ({ ...prev, duration_years: e.target.value }))}
              />
            </FormField>

            <FormField label="Description" full error={errors.description}>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('Cancel')}</button>
            <button type="submit" className="btn-primary" disabled={submitLoading}>
              {submitLoading ? <><Loader2 size={16} className="spin" /> {t('Saving...')}</> : t(mode === 'edit' ? 'Update Major' : 'Create Major')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Majors() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [majors, setMajors] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [routeMajor, setRouteMajor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchUniversities() {
    try {
      const res = await api.get('/universities');
      setUniversities(res.data.data || []);
    } catch {
      setUniversities([]);
    }
  }

  const fetchMajors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/majors', { params: { page } });
      setMajors(res.data.data || []);
      setPagination({
        page: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        total: res.data.total || 0,
        perPage: res.data.per_page || 10,
      });
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to load majors.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast, t]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const match = path.match(/^\/majors\/edit\/(\d+)$/);

    if (!match) {
      setRouteMajor(null);
      return;
    }

    const majorId = Number(match[1]);
    const existing = majors.find((major) => major.id === majorId);

    if (existing) {
      setRouteMajor(existing);
      return;
    }

    api.get(`/majors/${majorId}`)
      .then((res) => setRouteMajor(res.data))
      .catch(() => showToast(t('Unable to load major details.'), 'error'));
  }, [location.pathname, majors, showToast, t]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredData = useMemo(() => {
    return majors.filter((major) => {
      const matchesSearch = !search || major.name?.toLowerCase().includes(search.toLowerCase());
      const matchesUniversity = !selectedUniversity || String(major.university_id) === String(selectedUniversity);
      return matchesSearch && matchesUniversity;
    });
  }, [majors, search, selectedUniversity]);

  const universityOptions = useMemo(
    () => universities.map((u) => ({ label: u.name, value: String(u.id) })),
    [universities]
  );

  const routeModal = useMemo(
    () => resolveRouteModal(location.pathname, majors, routeMajor),
    [location.pathname, majors, routeMajor]
  );

  const modalTarget = formOpen
    ? { mode: editingMajor ? 'edit' : 'add', major: editingMajor }
    : routeModal && routeModal.mode !== 'pending'
      ? routeModal
      : null;

  function openAddForm() {
    setEditingMajor(null);
    setFormOpen(true);
  }

  function openEditForm(major) {
    setEditingMajor(major);
    setFormOpen(true);
  }

  async function submitForm({ payload, isEditing, currentMajor }) {
    try {
      if (isEditing && currentMajor) {
        await api.put(`/admin/majors/${currentMajor.id}`, payload);
        showToast(t('Major updated successfully.'), 'success');
      } else {
        await api.post('/admin/majors', payload);
        showToast(t('Major created successfully.'), 'success');
      }

      setFormOpen(false);
      navigate('/majors');
      if (page !== 1) {
        setPage(1);
      } else {
        await fetchMajors();
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to save major.'), 'error');
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/admin/majors/${deleteTarget.id}`);
      showToast(t('Major deleted successfully.'), 'success');
      setDeleteTarget(null);
      setPage(1);
      await fetchMajors();
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to delete major.'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = [
    {
      key: 'no',
      label: 'No',
      width: '70px',
      render: (_, rowIndex) => <span>{rowIndex + 1}</span>,
    },
    { key: 'name', label: 'Major Name' },
    {
      key: 'university',
      label: 'University',
      render: (row) => row.university?.name || '—',
    },
    {
      key: 'tuition_fee',
      label: 'Tuition Fee',
      render: (row) => row.tuition_fee ? `$${Number(row.tuition_fee).toLocaleString()}` : '—',
    },
    { key: 'duration_years', label: 'Duration', render: (row) => row.duration_years ? `${row.duration_years} yrs` : '—' },
    {
      key: 'actions',
      label: 'Actions',
      width: '110px',
      render: (row) => (
        <div className="table-actions">
          <button className="table-action-btn" title={t('Edit')} onClick={() => openEditForm(row)}>
            <Pencil size={15} />
          </button>
          <button className="table-action-btn table-action-btn--danger" title={t('Delete')} onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="universities-page">
      <DataTable
        title="Majors"
        columns={columns}
        data={filteredData}
        loading={loading}
        emptyMessage="No majors found. Add your first major to get started."
        emptyIcon={BookOpen}
        searchPlaceholder="Search by major name..."
        searchValue={search}
        onSearch={setSearch}
        filters={[
          {
            label: 'All Universities',
            value: 'university',
            options: universityOptions,
          },
        ]}
        filterValues={{ university: selectedUniversity }}
        onFilterChange={(key, value) => {
          if (key === 'university') setSelectedUniversity(value);
        }}
        pagination={pagination}
        rowNumberOffset={(page - 1) * (pagination.perPage || 10)}
        onPageChange={setPage}
        actions={
          <button className="btn-primary" onClick={openAddForm}>
            <Plus size={16} /> {t('Add Major')}
          </button>
        }
      />

      {modalTarget && (
        <MajorFormModal
          key={`${location.pathname}-${modalTarget.mode}-${modalTarget.major?.id ?? 'new'}`}
          mode={modalTarget.mode}
          initialMajor={modalTarget.major}
          universities={universities}
          onClose={() => {
            setFormOpen(false);
            if (location.pathname !== '/majors') {
              navigate('/majors');
            }
          }}
          onSubmit={submitForm}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('Delete Major')}
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

function FormField({ label, required, error, children, full }) {
  const { t } = useLanguage();

  return (
    <div className={`form-field ${full ? 'form-field--full' : ''} ${error ? 'form-field--error' : ''}`}>
      <label className="form-label">
        {t(label)}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{t(error)}</span>}
    </div>
  );
}
