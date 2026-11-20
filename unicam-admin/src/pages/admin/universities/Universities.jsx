/**
 * Universities — Full CRUD management page for universities.
 * Supports list view with search, filters, pagination,
 * and add/edit/delete operations via the Laravel API.
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, GraduationCap,
  X,
} from 'lucide-react';
import api from '../../../api/api';
import DataTable from '../../../components/DataTable';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/toastContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import './Universities.css';

export default function Universities() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  // Form state
  const [form, setForm] = useState(getEmptyForm());

  // Form errors
  const [errors, setErrors] = useState({});

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

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
      showToast(t('Failed to load universities.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast, t]);

  // --- Open Add Form ---
  const handleAdd = useCallback(() => {
    setEditingUni(null);
    setForm(getEmptyForm());
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
    setErrors({});
    setFormOpen(true);
  }, [setEditingUni, setForm, setImageFile, setImagePreview, setRemoveImage, setErrors, setFormOpen]);

  // --- Open Edit Form ---
  const handleEdit = useCallback((uni) => {
    setEditingUni(uni);
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
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
  }, [setEditingUni, setImageFile, setImagePreview, setRemoveImage, setForm, setErrors, setFormOpen]);

  function closeForm() {
    setFormOpen(false);
    setEditingUni(null);
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);

    if (location.pathname !== '/universities') {
      navigate('/universities');
    }
  }

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
      .catch(() => showToast(t('Unable to load university details.'), 'error'));
  }, [location.pathname, universities, showToast, handleAdd, handleEdit, t]);
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
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      errs.image = 'Image must be 2 MB or smaller.';
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
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image_url') return;
        if (key === 'tuition_fee' && value !== '') {
          payload.append(key, String(Number(value)));
        } else if (typeof value === 'boolean') {
          payload.append(key, value ? '1' : '0');
        } else {
          payload.append(key, value ?? '');
        }
      });

      if (imageFile) {
        payload.append('image', imageFile);
      } else if (removeImage) {
        payload.append('remove_image', '1');
      }

      if (editingUni) {
        payload.append('_method', 'PUT');
        await api.post(`/admin/universities/${editingUni.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast(t('University updated successfully.'), 'success');
      } else {
        await api.post('/admin/universities', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast(t('University created successfully.'), 'success');
      }
      closeForm();
      if (!editingUni && page !== 1) {
        setPage(1);
      } else {
        fetchUniversities();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save university.';
      showToast(t(message), 'error');
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
      showToast(t('University deleted successfully.'), 'success');
      setDeleteTarget(null);
      fetchUniversities();
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to delete university.'), 'error');
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
      key: 'no',
      label: 'No',
      width: '60px',
      render: (_, rowIndex) => (
        <span style={{ color: 'var(--color-text-muted)' }}>
          {rowIndex + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'University',
      render: (row) => (
        <div className="uni-cell__identity">
          <UniversityImage src={row.image_url} name={row.name} size="thumbnail" />
          <div className="uni-cell">
            <strong>{row.name}</strong>
            {row.short_name && <span className="uni-cell__short">{row.short_name}</span>}
          </div>
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
          {t(row.is_active ? 'Active' : 'Inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="table-actions">
          <button className="table-action-btn" title={t('View')} onClick={() => setViewUni(row)}>
            <Eye size={15} />
          </button>
          <button className="table-action-btn" title={t('Edit')} onClick={() => handleEdit(row)}>
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
        rowNumberOffset={(page - 1) * (pagination.perPage || 10)}
        onPageChange={setPage}
        actions={
          <button className="btn-primary" onClick={handleAdd}>
            <Plus size={16} /> {t('Add University')}
          </button>
        }
      />

      {/* --- View Detail Modal --- */}
      {viewUni && (
        <div className="modal-overlay" onClick={() => setViewUni(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{t('University Details')}</h2>
              <button className="modal__close" onClick={() => setViewUni(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              {viewUni.image_url && (
                <UniversityImage
                  src={viewUni.image_url}
                  name={viewUni.name}
                  size="detail"
                />
              )}
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
                    <span className="detail-label">{t('Majors ({count})', { count: viewUni.majors.length })}</span>
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
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{t(editingUni ? 'Edit University' : 'Add University')}</h2>
              <button className="modal__close" onClick={closeForm} aria-label={t('Close form')}><X size={18} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-grid">
                <FormField label="Name" required error={errors.name}>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder={t('University name')} />
                </FormField>

                <FormField label="Short Name" error={errors.short_name}>
                  <input type="text" value={form.short_name} onChange={(e) => updateField('short_name', e.target.value)} placeholder={t('e.g. MIT')} />
                </FormField>

                <FormField label="Location" error={errors.location}>
                  <input type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder={t('City or region')} />
                </FormField>

                <FormField label="Address" error={errors.address}>
                  <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder={t('Full address')} />
                </FormField>

                <FormField label="University Type" error={errors.university_type}>
                  <select value={form.university_type} onChange={(e) => updateField('university_type', e.target.value)}>
                    <option value="">{t('Select type')}</option>
                    <option value="Public">{t('Public')}</option>
                    <option value="Private">{t('Private')}</option>
                    <option value="International">{t('International')}</option>
                  </select>
                </FormField>

                <FormField label="Tuition Fee ($)" error={errors.tuition_fee}>
                  <input type="number" value={form.tuition_fee} onChange={(e) => updateField('tuition_fee', e.target.value)} placeholder={t('e.g. 5000')} min="0" step="0.01" />
                </FormField>

                <FormField label="Email" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder={t('admin@university.edu')} />
                </FormField>

                <FormField label="Phone" error={errors.phone}>
                  <input type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder={t('+1 234 567 890')} />
                </FormField>

                <FormField label="Website" error={errors.website}>
                  <input type="text" value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder={t('https://university.edu')} />
                </FormField>

                <FormField label="University Image" error={errors.image}>
                  <ImageUpload
                    currentImage={form.image_url}
                    currentName={form.name}
                    previewUrl={imagePreview}
                    removeImage={removeImage}
                    onFileChange={(file) => {
                      setImageFile(file);
                      setImagePreview(file ? URL.createObjectURL(file) : '');
                      setRemoveImage(false);
                      if (errors.image) {
                        setErrors((previous) => {
                          const next = { ...previous };
                          delete next.image;
                          return next;
                        });
                      }
                    }}
                    onRemove={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setRemoveImage(true);
                    }}
                    onRestore={() => setRemoveImage(false)}
                  />
                  <span className="form-hint">{t('JPG, PNG, or WebP. Maximum file size: 2 MB.')}</span>
                </FormField>

                <FormField label="Description" error={errors.description} full>
                  <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder={t('Brief description of the university')} rows={3} />
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
                <button type="button" className="btn-secondary" onClick={closeForm}>{t('Cancel')}</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {t(formLoading ? 'Saving...' : editingUni ? 'Update University' : 'Create University')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation --- */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('Delete University')}
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

// --- Helper Components ---

function UniversityImage({ src, name, size }) {
  const { t } = useLanguage();
  const [failedSrc, setFailedSrc] = useState(null);

  return (
    <span className={`university-image university-image--${size}`}>
      {src && failedSrc !== src ? (
        <img src={src} alt={t('{name} logo', { name })} onError={() => setFailedSrc(src)} />
      ) : (
        <GraduationCap size={size === 'detail' ? 36 : 20} aria-hidden="true" />
      )}
    </span>
  );
}

function ImageUpload({
  currentImage,
  currentName,
  previewUrl,
  removeImage,
  onFileChange,
  onRemove,
  onRestore,
}) {
  const { t } = useLanguage();
  const preview = previewUrl || (!removeImage ? currentImage : '');

  return (
    <div className="image-upload">
      <UniversityImage src={preview} name={currentName || t('University')} size="preview" />
      <div className="image-upload__controls">
        <label className="image-upload__button">
          {t(preview ? 'Choose another image' : 'Choose image')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] || null);
              event.target.value = '';
            }}
          />
        </label>
        {preview && !removeImage ? (
          <button type="button" className="btn-secondary" onClick={onRemove}>
            {t('Remove image')}
          </button>
        ) : removeImage ? (
          <button type="button" className="btn-secondary" onClick={onRestore}>
            {t('Keep current image')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value, isLink, badge, full }) {
  const { t } = useLanguage();

  return (
    <div className={`detail-row ${full ? 'detail-row--full' : ''}`}>
      <span className="detail-label">{t(label)}</span>
      {badge ? (
        <span className={`status-badge status-badge--${badge}`}>{t(value)}</span>
      ) : isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="detail-value detail-link">{value}</a>
      ) : (
        <span className="detail-value">{value || '—'}</span>
      )}
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
