import { Bell, Languages, Moon, Sun } from 'lucide-react';
import { usePreferences } from '../../../context/PreferencesContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import './Settings.css';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const {
    theme,
    setTheme,
    notificationPreferences,
    setNotificationPreferences,
  } = usePreferences();

  function updateNotificationPreference(key, enabled) {
    setNotificationPreferences((current) => ({
      ...current,
      [key]: enabled,
    }));
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1>{t('Settings')}</h1>
        <p>{t('Customize how the admin dashboard looks and which alerts it shows.')}</p>
      </header>

      <section className="settings-card" aria-labelledby="settings-appearance-title">
        <div className="settings-card__heading">
          <div className="settings-card__icon"><Sun size={20} /></div>
          <div>
            <h2 id="settings-appearance-title">{t('Appearance')}</h2>
            <p>{t('Choose a theme and display language for this browser.')}</p>
          </div>
        </div>

        <fieldset className="settings-fieldset">
          <legend>{t('Theme')}</legend>
          <div className="settings-choice-row">
            {[
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
            ].map(({ value, label, Icon }) => (
              <label className="settings-choice" key={value}>
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                />
                <Icon size={18} />
                <span>{t(label)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="settings-select">
          <span className="settings-select__label">
            <Languages size={17} />
            {t('Display language')}
          </span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={t('Display language')}
          >
            <option value="en">{t('English')}</option>
            <option value="km">{t('Khmer')}</option>
          </select>
        </label>
      </section>

      <section className="settings-card" aria-labelledby="settings-notifications-title">
        <div className="settings-card__heading">
          <div className="settings-card__icon"><Bell size={20} /></div>
          <div>
            <h2 id="settings-notifications-title">{t('Notifications')}</h2>
            <p>{t('Choose which university data alerts appear in the navigation bar.')}</p>
          </div>
        </div>

        <label className="settings-toggle">
          <span className="settings-toggle__copy">
            <strong>{t('Inactive universities')}</strong>
            <small>{t('Show an alert when a university is inactive.')}</small>
          </span>
          <input
            type="checkbox"
            checked={notificationPreferences.inactiveUniversities}
            onChange={(event) => updateNotificationPreference(
              'inactiveUniversities',
              event.target.checked
            )}
          />
        </label>

        <label className="settings-toggle">
          <span className="settings-toggle__copy">
            <strong>{t('Universities without a type')}</strong>
            <small>{t('Show an alert when a university has no type assigned.')}</small>
          </span>
          <input
            type="checkbox"
            checked={notificationPreferences.unclassifiedUniversities}
            onChange={(event) => updateNotificationPreference(
              'unclassifiedUniversities',
              event.target.checked
            )}
          />
        </label>

        <p className="settings-saved">{t('Your preferences are saved automatically on this device.')}</p>
      </section>
    </div>
  );
}
