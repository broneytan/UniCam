/**
 * Navbar — Top navigation bar with burger menu, breadcrumbs,
 * notifications, and admin account menu.
 * Sticky on scroll. Adapts to sidebar collapsed/expanded state.
 */
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Home,
} from 'lucide-react';
import './Navbar.css';

// Map route paths to readable breadcrumb labels
const BREADCRUMB_MAP = {
  '/dashboard': 'Dashboard',
  '/universities': 'Universities',
  '/universities/add': 'Add University',
  '/majors': 'Majors',
  '/majors/add': 'Add Major',
  '/students': 'Students',
  '/profile': 'Admin Profile',
  '/settings': 'Settings',
};

// Map of page titles
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/universities': 'University Management',
  '/universities/add': 'Add University',
  '/majors': 'Major Management',
  '/majors/add': 'Add Major',
  '/students': 'Student Management',
  '/profile': 'Admin Profile',
  '/settings': 'Settings',
};

export default function Navbar({ onToggleSidebar, onToggleMobile, admin, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Build breadcrumb segments from current path
  function getBreadcrumbs() {
    const path = location.pathname;
    const segments = [];

    // Always start with Dashboard
    segments.push({ label: 'Dashboard', path: '/dashboard', icon: Home });

    // Handle edit paths like /universities/edit/5
    if (path.match(/^\/universities\/edit\/\d+/)) {
      segments.push({ label: 'Universities', path: '/universities' });
      segments.push({ label: 'Edit University', path: path });
    } else if (path.match(/^\/majors\/edit\/\d+/)) {
      segments.push({ label: 'Majors', path: '/majors' });
      segments.push({ label: 'Edit Major', path: path });
    } else if (path !== '/dashboard') {
      // Build intermediate breadcrumbs
      const parts = path.split('/').filter(Boolean);
      let accumulated = '';
      for (const part of parts) {
        accumulated += '/' + part;
        const label = BREADCRUMB_MAP[accumulated];
        if (label) {
          segments.push({ label, path: accumulated });
        }
      }
    }

    return segments;
  }

  // Get current page title
  function getPageTitle() {
    const path = location.pathname;
    if (path.match(/^\/universities\/edit\/\d+/)) return 'Edit University';
    if (path.match(/^\/majors\/edit\/\d+/)) return 'Edit Major';
    return PAGE_TITLES[path] || 'Dashboard';
  }

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <header className="navbar" role="banner">
      <div className="navbar__left">
        {/* Burger menu — toggles sidebar on desktop, opens drawer on mobile */}
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
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Page title & breadcrumb */}
        <div className="navbar__title-group">
          <h1 className="navbar__title">{pageTitle}</h1>
          <nav className="navbar__breadcrumb" aria-label="Breadcrumb">
            <ol className="navbar__breadcrumb-list">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const Icon = crumb.icon;
                return (
                  <li key={crumb.path} className="navbar__breadcrumb-item">
                    {index > 0 && (
                      <ChevronRight size={12} className="navbar__breadcrumb-sep" />
                    )}
                    {isLast ? (
                      <span className="navbar__breadcrumb-current">
                        {Icon && <Icon size={12} />}
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        className="navbar__breadcrumb-link"
                        onClick={() => navigate(crumb.path)}
                      >
                        {Icon && <Icon size={12} />}
                        {crumb.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      <div className="navbar__right">
        {/* Notifications (placeholder — real data future) */}
        <button className="navbar__icon-btn" aria-label="Notifications" title="Notifications">
          <Bell size={20} />
        </button>

        {/* Admin profile dropdown */}
        <div className="navbar__profile" ref={profileRef}>
          <button
            className="navbar__profile-btn"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="navbar__avatar">
              {(admin?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="navbar__profile-name">{admin?.name || 'Admin'}</span>
          </button>

          {/* Dropdown menu */}
          {profileOpen && (
            <div className="navbar__dropdown" role="menu">
              <button
                className="navbar__dropdown-item"
                onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                role="menuitem"
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button
                className="navbar__dropdown-item"
                onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                role="menuitem"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="navbar__dropdown-divider" />
              <button
                className="navbar__dropdown-item navbar__dropdown-item--danger"
                onClick={() => { onLogout(); setProfileOpen(false); }}
                role="menuitem"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
