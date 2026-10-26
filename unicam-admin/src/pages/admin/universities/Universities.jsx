/**
 * Universities — Full CRUD management page for universities.
 * Supports list view with search, filters, pagination,
 * and add/edit/delete operations via the Laravel API.
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, GraduationCap,
  X,
} from 'lucide-react';
import api from '../../../api/api';
import DataTable from '../../../components/DataTable';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/toastContext';
import './Universities.css';

export default function Universities() {
  const location = useLocation();
  const { showToast } = useToast();

  // Data state
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });

  // Search and filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUni, setEditingUni] = useState(null); // null = add mode
  const [viewUni, setViewUni] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [form, setForm] = useState(getEmptyForm());

  // Form errors
  const [errors, setErrors] = useState({});

  function getEmptyForm() {
    return {
      name: '', short_name: '', description: '', location: '',
      address: '', website: '', phone: '', email: '',
      university_type: '', tuition_fee: '', image_url: '', is_active: true,
    };
  }

  // --- Fetch Universities ---
  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/universities', { params: { page } });
      setUniversities(res.data.data || []);
      setPagination({
        page: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        total: res.data.total || 0,
        perPage: res.data.per_page || 10,
      });
    } catch {
      showToast('Failed to load universities.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  // --- Open Add Form ---
  const handleAdd = () => {
    setEditingUni(null);
    setForm(getEmptyForm());
    setErrors({});
    setFormOpen(true);
  };

  // --- Open Edit Form ---
  const handleEdit = (uni) => {
    setEditingUni(uni);
    setForm({
      name: uni.name || '',
      short_name: uni.short_name || '',
      description: uni.description || '',
      location: uni.location || '',
      address: uni.address || '',
      website: uni.website || '',
      phone: uni.phone || '',
      email: uni.email || '',
      university_type: uni.university_type || '',
      tuition_fee: uni.tuition_fee || '',
      image_url: uni.image_url || '',
      is_active: uni.is_active ?? true,
    });
    setErrors({});
    setFormOpen(true);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  useEffect(() => {
    const path = location.pathname;

    if (path === '/universities/add') {
      handleAdd();
      return;
    }

    const match = path.match(/^\/universities\/edit\/(\d+)$/);
    if (!match) return;

    const id = Number(match[1]);
    const existing = universities.find((uni) => uni.id === id);

    if (existing) {
      handleEdit(existing);
      return;
    }

    api.get(`/universities/${id}`)
      .then((res) => handleEdit(res.data))
      .catch(() => showToast('Unable to load university details.', 'error'));
  }, [location.pathname, universities, showToast, handleAdd, handleEdit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // --- Filtered Data (client-side search & filter on current page) ---
  const filteredData = universities.filter((uni) => {
    const matchSearch = !search ||
      uni.name?.toLowerCase().includes(search.toLowerCase()) ||
      uni.location?.toLowerCase().includes(search.toLowerCase()) ||
      uni.short_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || uni.university_type === typeFilter;
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' && uni.is_active) ||
      (statusFilter === 'inactive' && !uni.is_active);
    return matchSearch && matchType && matchStatus;
  });

  // Get unique types for filter dropdown
  const uniqueTypes = [...new Set(universities.map((u) => u.university_type).filter(Boolean))];

  // --- Form Validation ---
  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'University name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      errs.website = 'Website must start with http:// or https://';
    }
    if (form.image_url && !/^https?:\/\/.+/.test(form.image_url)) {
      errs.image_url = 'Image URL must start with http:// or https://';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // --- Submit Form (Create or Update) ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      // Prepare payload — only send non-empty fields
      const payload = { ...form };
      if (payload.tuition_fee === '') payload.tuition_fee = null;
      else payload.tuition_fee = Number(payload.tuition_fee);

      if (editingUni) {
        await api.put(`/admin/universities/${editingUni.id}`, payload);
        showToast('University updated successfully.', 'success');
      } else {
        await api.post('/admin/universities', payload);
        showToast('University created successfully.', 'success');
      }
      setFormOpen(false);
      fetchUniversities();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save university.';
      showToast(message, 'error');
      // Set validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors = {};
        Object.entries(err.response.data.errors).forEach(([key, msgs]) => {
          backendErrors[key] = msgs[0];
        });
        setErrors(backendErrors);
      }
    } finally {
      setFormLoading(false);
    }
  }

  // --- Delete University ---
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/universities/${deleteTarget.id}`);
      showToast('University deleted successfully.', 'success');
      setDeleteTarget(null);
      fetchUniversities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete university.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  // --- Update form field ---
  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  // --- Table Columns ---
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '60px',
      render: (row) => <span style={{ color: 'var(--color-text-muted)' }}>#{row.id}</span>,
    },
    {
      key: 'name',
      label: 'University',
      render: (row) => (
        <div className="uni-cell">
          <strong>{row.name}</strong>
          {row.short_name && <span className="uni-cell__short">{row.short_name}</span>}
        </div>
      ),
    },
    { key: 'location', label: 'Location' },
    { key: 'university_type', label: 'Type' },
    {
      key: 'tuition_fee',
      label: 'Tuition Fee',
      render: (row) => row.tuition_fee ? `$${Number(row.tuition_fee).toLocaleString()}` : '—',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="table-actions">
          <button className="table-action-btn" title="View" onClick={() => setViewUni(row)}>
            <Eye size={15} />
          </button>
          <button className="table-action-btn" title="Edit" onClick={() => handleEdit(row)}>
            <Pencil size={15} />
          </button>
          <button className="table-action-btn table-action-btn--danger" title="Delete" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="universities-page">
      <DataTable
        title="Universities"
        columns={columns}
        data={filteredData}
        loading={loading}
        emptyMessage="No universities found. Add your first university to get started."
        emptyIcon={GraduationCap}
        searchPlaceholder="Search by name or location..."
        searchValue={search}
        onSearch={setSearch}
        filters={[
          {
            label: 'All Types',
            value: 'type',
            options: uniqueTypes.map((t) => ({ label: t, value: t })),
          },
          {
            label: 'All Status',
            value: 'status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        filterValues={{ type: typeFilter, status: statusFilter }}
        onFilterChange={(key, val) => {
          if (key === 'type') setTypeFilter(val);
          if (key === 'status') setStatusFilter(val);
        }}
        pagination={pagination}
        onPageChange={setPage}
        actions={
          <button className="btn-primary" onClick={handleAdd}>
            <Plus size={16} /> Add University
          </button>
        }
      />

      {/* --- View Detail Modal --- */}
      {viewUni && (
        <div className="modal-overlay" onClick={() => setViewUni(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>University Details</h2>
              <button className="modal__close" onClick={() => setViewUni(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <div className="detail-grid">
                <DetailRow label="Name" value={viewUni.name} />
                <DetailRow label="Short Name" value={viewUni.short_name} />
                <DetailRow label="Type" value={viewUni.university_type} />
                <DetailRow label="Location" value={viewUni.location} />
                <DetailRow label="Address" value={viewUni.address} />
                <DetailRow label="Email" value={viewUni.email} />
                <DetailRow label="Phone" value={viewUni.phone} />
                <DetailRow label="Website" value={viewUni.website} isLink />
                <DetailRow label="Tuition Fee" value={viewUni.tuition_fee ? `$${Number(viewUni.tuition_fee).toLocaleString()}` : null} />
                <DetailRow label="Status" value={viewUni.is_active ? 'Active' : 'Inactive'} badge={viewUni.is_active ? 'active' : 'inactive'} />
                <DetailRow label="Description" value={viewUni.description} full />
                {viewUni.majors && viewUni.majors.length > 0 && (
                  <div className="detail-row detail-row--full">
                    <span className="detail-label">Majors ({viewUni.majors.length})</span>
                    <div className="detail-value">
                      {viewUni.majors.map((m) => (
                        <span key={m.id} className="detail-tag">{m.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Add/Edit Form Modal --- */}
      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editingUni ? 'Edit University' : 'Add University'}</h2>
              <button className="modal__close" onClick={() => setFormOpen(false)}><X size={18} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-grid">
                <FormField label="Name" required error={errors.name}>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="University name" />
                </FormField>

                <FormField label="Short Name" error={errors.short_name}>
                  <input type="text" value={form.short_name} onChange={(e) => updateField('short_name', e.target.value)} placeholder="e.g. MIT" />
                </FormField>

                <FormField label="Location" error={errors.location}>
                  <input type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="City or region" />
                </FormField>

                <FormField label="Address" error={errors.address}>
                  <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full address" />
                </FormField>

                <FormField label="University Type" error={errors.university_type}>
                  <select value={form.university_type} onChange={(e) => updateField('university_type', e.target.value)}>
                    <option value="">Select type</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="International">International</option>
                  </select>
                </FormField>

                <FormField label="Tuition Fee ($)" error={errors.tuition_fee}>
                  <input type="number" value={form.tuition_fee} onChange={(e) => updateField('tuition_fee', e.target.value)} placeholder="e.g. 5000" min="0" step="0.01" />
                </FormField>

                <FormField label="Email" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="admin@university.edu" />
                </FormField>

                <FormField label="Phone" error={errors.phone}>
                  <input type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+1 234 567 890" />
                </FormField>

                <FormField label="Website" error={errors.website}>
                  <input type="text" value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://university.edu" />
                </FormField>

                <FormField label="Image URL" error={errors.image_url}>
                  <input type="text" value={form.image_url} onChange={(e) => updateField('image_url', e.target.value)} placeholder="https://example.com/image.jpg" />
                </FormField>

                <FormField label="Description" error={errors.description} full>
                  <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Brief description of the university" rows={3} />
                </FormField>

                <FormField label="Status">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-switch" />
                    <span>{form.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                </FormField>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingUni ? 'Update University' : 'Create University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation --- */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete University"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// --- Helper Components ---

function DetailRow({ label, value, isLink, badge, full }) {
  return (
    <div className={`detail-row ${full ? 'detail-row--full' : ''}`}>
      <span className="detail-label">{label}</span>
      {badge ? (
        <span className={`status-badge status-badge--${badge}`}>{value}</span>
      ) : isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="detail-value detail-link">{value}</a>
      ) : (
        <span className="detail-value">{value || '—'}</span>
      )}
    </div>
  );
}

function FormField({ label, required, error, children, full }) {
  return (
    <div className={`form-field ${full ? 'form-field--full' : ''} ${error ? 'form-field--error' : ''}`}>
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
