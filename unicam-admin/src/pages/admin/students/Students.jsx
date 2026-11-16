/**
 * Students — Placeholder page for future student management features.
 */
import { Users, Search, UserCheck } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import '../universities/Universities.css';

export default function Students() {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="card card--compact">
        <div className="placeholder-header">
          <Users size={26} />
          <h2>{t('Students')}</h2>
        </div>
        <p>{t('Student management functionality is not yet supported by the backend API.')}</p>
        <div className="placeholder-grid">
          <div className="placeholder-tile">
            <Search size={18} />
            <span>{t('Search by name or email')}</span>
          </div>
          <div className="placeholder-tile">
            <UserCheck size={18} />
            <span>{t('Profile details')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
