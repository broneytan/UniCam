import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'admin_theme';
const NOTIFICATIONS_STORAGE_KEY = 'admin_notification_preferences';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  inactiveUniversities: true,
  unclassifiedUniversities: true,
};

function getStoredNotificationPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY));
    const preferences = stored && typeof stored === 'object' && !Array.isArray(stored)
      ? stored
      : {};

    return {
      inactiveUniversities: typeof preferences.inactiveUniversities === 'boolean'
        ? preferences.inactiveUniversities
        : DEFAULT_NOTIFICATION_PREFERENCES.inactiveUniversities,
      unclassifiedUniversities: typeof preferences.unclassifiedUniversities === 'boolean'
        ? preferences.unclassifiedUniversities
        : DEFAULT_NOTIFICATION_PREFERENCES.unclassifiedUniversities,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() => (
    localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  ));
  const [notificationPreferences, setNotificationPreferences] = useState(
    getStoredNotificationPreferences
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notificationPreferences)
    );
  }, [notificationPreferences]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    notificationPreferences,
    setNotificationPreferences,
  }), [theme, notificationPreferences]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
