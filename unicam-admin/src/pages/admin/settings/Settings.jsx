/**
 * Settings — Placeholder for future dashboard preference configuration.
 */
import '../universities/Universities.css';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="card card--compact">
        <h2>{t('Settings')}</h2>
        <p>{t('Dashboard appearance and basic preferences are currently under development.')}</p>
        <ul className="placeholder-list">
          <li>{t('Appearance preferences')}</li>
          <li>{t('Account notifications')}</li>
          <li>{t('System configuration')}</li>
        </ul>
      </div>
    </div>
  );
}
