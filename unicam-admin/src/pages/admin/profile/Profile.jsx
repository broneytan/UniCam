/**
 * Profile — Admin profile summary and logout action.
 */
import { LogOut, Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import '../universities/Universities.css';

export default function Profile({ admin, onLogout }) {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="card card--compact">
        <div className="profile-header">
          <div className="profile-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
          <div>
            <h2>{admin?.name || t('Administrator')}</h2>
            <p>{admin?.role || t('Administrator')}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="info-tile">
            <UserCircle size={18} />
            <span className="info-label">{t('Role')}</span>
            <strong>{admin?.role || t('Administrator')}</strong>
          </div>
          <div className="info-tile">
            <Mail size={18} />
            <span className="info-label">{t('Email')}</span>
            <strong>{admin?.email || t('Not provided')}</strong>
          </div>
          <div className="info-tile">
            <ShieldCheck size={18} />
            <span className="info-label">{t('Access')}</span>
            <strong>{t('Admin')}</strong>
          </div>
        </div>

        <button className="btn btn--danger" onClick={onLogout}>
          <LogOut size={16} /> {t('Logout')}
        </button>
      </div>
    </div>
  );
}
