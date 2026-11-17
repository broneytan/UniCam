/**
 * Navbar — Top navigation bar with search, display controls,
 * notifications, language options, and admin account menu.
 * Sticky on scroll. Adapts to sidebar collapsed/expanded state.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Globe2,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  GraduationCap,
  BookOpen,
  Loader2,
} from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../i18n/LanguageContext';
import { usePreferences } from '../context/PreferencesContext';
import './Navbar.css';

function getResponseRows(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchAllPages(endpoint) {
  const firstResponse = await api.get(endpoint, { params: { page: 1 } });
  const rows = getResponseRows(firstResponse.data);
  const lastPage = Number(firstResponse.data?.last_page || 1);
  const remainingRequests = [];

  for (let page = 2; page <= lastPage; page += 1) {
    remainingRequests.push(api.get(endpoint, { params: { page } }));
  }

  const remainingResponses = await Promise.all(remainingRequests);
  return [
    ...rows,
    ...remainingResponses.flatMap((response) => getResponseRows(response.data)),
  ];
}

function getSearchResults(directory, query) {
  if (!directory || query.trim().length < 2) return [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const universities = directory.universities
    .filter((university) => [
      university.name,
      university.short_name,
      university.location,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)))
    .map((university) => ({
      id: `university-${university.id}`,
      kind: 'university',
      title: university.name,
      detail: [university.short_name, university.location].filter(Boolean).join(' · '),
      path: `/universities/edit/${university.id}`,
    }));
  const majors = directory.majors
    .filter((major) => [
      major.name,
      major.university?.name,
      major.university?.short_name,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)))
    .map((major) => ({
      id: `major-${major.id}`,
      kind: 'major',
      title: major.name,
      detail: major.university?.short_name || major.university?.name || '',
      path: `/majors/edit/${major.id}`,
    }));

  return [...universities, ...majors].slice(0, 8);
}

export default function Navbar({ onToggleSidebar, onToggleMobile, admin, onLogout }) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, notificationPreferences } = usePreferences();
  const [openPanel, setOpenPanel] = useState('');
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');
  const controlsRef = useRef(null);
  const directoryPromiseRef = useRef(null);

  const loadDirectory = useCallback(async (refresh = false) => {
    if (directory && !refresh) return directory;
    if (directoryPromiseRef.current) return directoryPromiseRef.current;

    setDirectory(null);
    setDirectoryLoading(true);
    setDirectoryError('');
    const request = Promise.all([
      fetchAllPages('/universities'),
      fetchAllPages('/majors'),
    ])
      .then(([universities, majors]) => {
        const result = { universities, majors };
        setDirectory(result);
        return result;
      })
      .catch((error) => {
        directoryPromiseRef.current = null;
        throw error;
      })
      .finally(() => setDirectoryLoading(false));

    directoryPromiseRef.current = request;
    try {
      return await request;
    } finally {
      if (directoryPromiseRef.current === request) {
        directoryPromiseRef.current = null;
      }
    }
  }, [directory]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (controlsRef.current && !controlsRef.current.contains(e.target)) {
        setOpenPanel('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (openPanel !== 'search' || query.trim().length < 2 || directory) return undefined;

    const timeoutId = window.setTimeout(() => {
      loadDirectory().catch(() => {
        setDirectoryError(t('Search failed. Please try again.'));
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [directory, loadDirectory, openPanel, query, t]);

  const searchResults = useMemo(
    () => getSearchResults(directory, query),
    [directory, query]
  );

  const notificationAlerts = useMemo(() => {
    if (!directory) return [];
    const inactiveCount = directory.universities.filter(
      (university) => !(
        university.is_active === true ||
        university.is_active === 1 ||
        university.is_active === '1'
      )
    ).length;
    const unclassifiedCount = directory.universities.filter(
      (university) => !university.university_type
    ).length;

    return [
      notificationPreferences.inactiveUniversities && inactiveCount > 0 && {
        id: 'inactive',
        message: t('Inactive universities'),
        count: inactiveCount,
      },
      notificationPreferences.unclassifiedUniversities && unclassifiedCount > 0 && {
        id: 'unclassified',
        message: t('Universities without a type'),
        count: unclassifiedCount,
      },
    ].filter(Boolean);
  }, [directory, notificationPreferences, t]);

  function togglePanel(panel) {
    const nextPanel = openPanel === panel ? '' : panel;
    setOpenPanel(nextPanel);
    if (nextPanel === 'notifications') {
      loadDirectory(true).catch(() => {
        setDirectoryError(t('Could not load alerts.'));
      });
    }
  }

  function openSearchResult(path) {
    navigate(path);
    setOpenPanel('');
    setQuery('');
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;

    try {
      const searchableDirectory = directory || await loadDirectory();
      const firstResult = getSearchResults(searchableDirectory, query)[0];
      if (firstResult) openSearchResult(firstResult.path);
    } catch {
      setDirectoryError(t('Search failed. Please try again.'));
    }
  }

  return (
    <header className="navbar" role="banner" ref={controlsRef}>
      <div className="navbar__left">
        <button
          className="navbar__burger"
          onClick={() => {
            // On mobile, open the mobile drawer; on desktop, toggle collapse
            if (window.innerWidth <= 768) {
              onToggleMobile();
            } else {
              onToggleSidebar();
            }
          }}
          type="button"
          aria-label={t('Toggle navigation menu')}
          title={t('Toggle navigation menu')}
        >
          <Menu size={20} />
        </button>

        <form
          className="navbar__search-wrap"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <div className="navbar__search">
            <button
              className="navbar__search-submit"
              type="submit"
              aria-label={t('Search')}
              title={t('Search')}
            >
              <Search size={17} aria-hidden="true" />
            </button>
            <input
              type="search"
              aria-label={t('Search universities and majors')}
              placeholder={t('Search universities, majors...')}
              value={query}
              onFocus={() => setOpenPanel('search')}
              onChange={(event) => {
                setQuery(event.target.value);
                setDirectoryError('');
                setOpenPanel('search');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpenPanel('');
              }}
            />
          </div>
          {openPanel === 'search' && (
            <div className="navbar__search-results" role="listbox" aria-label={t('Search')}>
              {query.trim().length < 2 ? (
                <p className="navbar__search-message">{t('Type at least 2 characters to search.')}</p>
              ) : directoryLoading ? (
                <p className="navbar__search-message">
                  <Loader2 className="navbar__loading-icon" size={16} />
                  {t('Searching...')}
                </p>
              ) : directoryError ? (
                <div className="navbar__search-message navbar__search-message--error">
                  <span>{directoryError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      directoryPromiseRef.current = null;
                      setDirectory(null);
                      setDirectoryError('');
                    }}
                  >
                    {t('Retry')}
                  </button>
                </div>
              ) : searchResults.length ? (
                searchResults.map((result) => {
                  const ResultIcon = result.kind === 'university' ? GraduationCap : BookOpen;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      className="navbar__search-result"
                      key={result.id}
                      onClick={() => openSearchResult(result.path)}
                    >
                      <ResultIcon size={17} />
                      <span>
                        <strong>{result.title}</strong>
                        <small>{result.detail || t(result.kind === 'university' ? 'University result' : 'Major result')}</small>
                      </span>
                      <small>{t('Open')}</small>
                    </button>
                  );
                })
              ) : directory ? (
                <p className="navbar__search-message">{t('No matching universities or majors.')}</p>
              ) : null}
            </div>
          )}
        </form>
      </div>

      <div className="navbar__right">
        <button
          className="navbar__icon-btn"
          type="button"
          aria-label={t(`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`)}
          title={t(`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`)}
          aria-pressed={theme === 'dark'}
          onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        <div className="navbar__control">
          <button
            className="navbar__icon-btn"
            type="button"
            aria-label={t('Notifications')}
            title={t('Notifications')}
            aria-expanded={openPanel === 'notifications'}
            onClick={() => togglePanel('notifications')}
          >
            <Bell size={19} />
            {notificationAlerts.length > 0 && (
              <span className="navbar__notification-count">
                {notificationAlerts.length}
              </span>
            )}
          </button>
          {openPanel === 'notifications' && (
            <div className="navbar__popover navbar__popover--notifications">
              <strong>{t('Notifications')}</strong>
              <p className="navbar__popover-description">
                {t('Current alerts from your university records.')}
              </p>
              {directoryLoading ? (
                <p className="navbar__popover-state">{t('Loading alerts...')}</p>
              ) : directoryError ? (
                <div className="navbar__popover-error">
                  <p>{directoryError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      directoryPromiseRef.current = null;
                      setDirectory(null);
                      setDirectoryError('');
                      loadDirectory().catch(() => setDirectoryError(t('Could not load alerts.')));
                    }}
                  >
                    {t('Retry')}
                  </button>
                </div>
              ) : notificationAlerts.length ? (
                <div className="navbar__alert-list">
                  {notificationAlerts.map((alert) => (
                    <button
                      type="button"
                      className="navbar__alert-item"
                      key={alert.id}
                      onClick={() => {
                        navigate('/universities');
                        setOpenPanel('');
                      }}
                    >
                      <span>{alert.message}</span>
                      <strong>{alert.count}</strong>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="navbar__alert-review"
                    onClick={() => {
                      navigate('/universities');
                      setOpenPanel('');
                    }}
                  >
                    {t('Review universities')}
                  </button>
                </div>
              ) : (
                <p className="navbar__popover-state">{t('No current alerts.')}</p>
              )}
            </div>
          )}
        </div>

        <div className="navbar__control">
          <button
            className="navbar__icon-btn"
            type="button"
            aria-label={t('Language')}
            title={t('Language')}
            aria-expanded={openPanel === 'language'}
            onClick={() => togglePanel('language')}
          >
            <Globe2 size={19} />
          </button>
          {openPanel === 'language' && (
            <div className="navbar__popover navbar__popover--language" role="menu" aria-label={t('Language')}>
              <strong>{t('Language')}</strong>
              {[
                { value: 'en', label: 'English' },
                { value: 'km', label: 'Khmer' },
              ].map((option) => (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === option.value}
                  className={`navbar__language-option ${language === option.value ? 'navbar__language-option--selected' : ''}`}
                  key={option.value}
                  onClick={() => {
                    setLanguage(option.value);
                    setOpenPanel('');
                  }}
                >
                  <span>{t(option.label)}</span>
                  <span>{language === option.value ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="navbar__profile">
          <button
            className="navbar__icon-btn navbar__profile-btn"
            type="button"
            onClick={() => setOpenPanel((current) => current === 'profile' ? '' : 'profile')}
            aria-expanded={openPanel === 'profile'}
            aria-haspopup="menu"
            aria-label={`${t('User menu for')} ${admin?.name || t('Admin')}`}
            title={`${t('User menu for')} ${admin?.name || t('Admin')}`}
          >
            <User size={19} aria-hidden="true" />
          </button>

          {openPanel === 'profile' && (
            <div className="navbar__dropdown" role="menu">
              <button
                className="navbar__dropdown-item"
                onClick={() => { navigate('/profile'); setOpenPanel(''); }}
                role="menuitem"
              >
                <User size={16} />
                <span>{t('My Profile')}</span>
              </button>
              <button
                className="navbar__dropdown-item"
                onClick={() => { navigate('/settings'); setOpenPanel(''); }}
                role="menuitem"
              >
                <Settings size={16} />
                <span>{t('Settings')}</span>
              </button>
              <div className="navbar__dropdown-divider" />
              <button
                className="navbar__dropdown-item navbar__dropdown-item--danger"
                onClick={() => { onLogout(); setOpenPanel(''); }}
                role="menuitem"
              >
                <LogOut size={16} />
                <span>{t('Logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
