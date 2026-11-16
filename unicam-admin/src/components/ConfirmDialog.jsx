/**
 * ConfirmDialog — Reusable confirmation modal.
 * Displays a message and two action buttons (confirm + cancel).
 * Focuses the cancel button by default for safety.
 */
import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  const { t } = useLanguage();

  // Focus the cancel button when dialog opens (safer default)
  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleEsc(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="confirm-dialog__close" onClick={onCancel} aria-label={t('Close dialog')}>
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
          <AlertTriangle size={24} />
        </div>

        {/* Content */}
        <h2 className="confirm-dialog__title">{t(title)}</h2>
        <p className="confirm-dialog__message">{t(message)}</p>

        {/* Actions */}
        <div className="confirm-dialog__actions">
          <button
            ref={cancelRef}
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {t(cancelLabel)}
          </button>
          <button
            className={`confirm-dialog__btn confirm-dialog__btn--${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {t(loading ? 'Processing...' : confirmLabel)}
          </button>
        </div>
      </div>
    </div>
  );
}
