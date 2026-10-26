/**
 * Sidebar — Interactive nested dropdown sidebar with collapsible navigation.
 * Features:
 * - Expandable/collapsible parent menu items with chevron icons
 * - Thin vertical connector lines (YouTube comment-thread style)
 * - Active parent + sub-feature highlighting
 * - Smooth expand/collapse transitions
 * - Collapsible on desktop, drawer on mobile
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  UserCircle,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  List,
} from 'lucide-react';
import './Sidebar.css';

// Navigation menu structure with nested sub-items
const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'universities',
    label: 'Universities',
    icon: GraduationCap,
    children: [
      { id: 'uni-list', label: 'All Universities', icon: List, path: '/universities' },
      { id: 'uni-add', label: 'Add University', icon: Plus, path: '/universities/add' },
    ],
  },
  {
    id: 'majors',
    label: 'Majors',
    icon: BookOpen,
    children: [
      { id: 'major-list', label: 'All Majors', icon: List, path: '/majors' },
      { id: 'major-add', label: 'Add Major', icon: Plus, path: '/majors/add' },
    ],
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    path: '/students',
  },
  {
    id: 'profile',
    label: 'Admin Profile',
    icon: UserCircle,
    path: '/profile',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    path: '#logout',
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, admin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Toggle a parent menu's expanded state
  function toggleMenu(menuId) {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }

  // Check if a path is currently active
  function isActive(path) {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  // Check if a parent menu has any active child
  function hasActiveChild(item) {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child.path));
  }

  // Navigate and close mobile drawer
  function handleNavigate(path) {
    if (path === '#logout') {
      if (onLogout) onLogout();
      return;
    }

    navigate(path);
    if (mobileOpen) onMobileClose();
  }

  // Render a single menu item (parent or standalone)
  function renderMenuItem(item) {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id] || hasActiveChild(item);
    const itemIsActive = isActive(item.path) || hasActiveChild(item);

    return (
      <li key={item.id} className="sidebar__menu-item">
        {/* Parent / standalone button */}
        <button
          className={`sidebar__menu-btn ${itemIsActive ? 'sidebar__menu-btn--active' : ''}`}
          onClick={() => {
            if (hasChildren) {
              // If sidebar is collapsed, expand it first
              if (collapsed) {
                onToggle();
              }
              toggleMenu(item.id);
            } else {
              handleNavigate(item.path);
            }
          }}
          title={collapsed ? item.label : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-current={itemIsActive && !hasChildren ? 'page' : undefined}
        >
          <span className="sidebar__menu-icon">
            <Icon size={20} />
          </span>
          <span className="sidebar__menu-label">{item.label}</span>
          {hasChildren && (
            <span className={`sidebar__chevron ${isExpanded ? 'sidebar__chevron--open' : ''}`}>
              <ChevronDown size={16} />
            </span>
          )}
        </button>

        {/* Sub-menu with connector lines */}
        {hasChildren && (
          <ul
            className={`sidebar__submenu ${isExpanded ? 'sidebar__submenu--open' : ''}`}
            role="group"
          >
            {item.children.map((child, index) => {
              const ChildIcon = child.icon;
              const childActive = isActive(child.path);
              const isLastChild = index === item.children.length - 1;

              return (
                <li
                  key={child.id}
                  className={`sidebar__submenu-item ${isLastChild ? 'sidebar__submenu-item--last' : ''}`}
                >
                  {/* Vertical connector line */}
                  <span className="sidebar__connector">
                    <span className="sidebar__connector-vertical" />
                    <span className="sidebar__connector-horizontal" />
                  </span>

                  <button
                    className={`sidebar__submenu-btn ${childActive ? 'sidebar__submenu-btn--active' : ''}`}
                    onClick={() => handleNavigate(child.path)}
                    aria-current={childActive ? 'page' : undefined}
                  >
                    <ChildIcon size={16} />
                    <span>{child.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div className="sidebar__backdrop" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo section */}
        <div className="sidebar__header">
          <div className="sidebar__logo" onClick={() => handleNavigate('/dashboard')}>
            <div className="sidebar__logo-icon">
              <GraduationCap size={24} />
            </div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-title">UniCam</span>
              <span className="sidebar__logo-subtitle">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu" role="menubar">
            {MENU_ITEMS.map(renderMenuItem)}
          </ul>
        </nav>

        {/* Admin profile section at bottom */}
        <div className="sidebar__footer">
          <div className="sidebar__admin" title={admin?.name || 'Admin'}>
            <div className="sidebar__admin-avatar">
              {(admin?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar__admin-info">
              <span className="sidebar__admin-name">{admin?.name || 'Admin'}</span>
              <span className="sidebar__admin-role">{admin?.role || 'Administrator'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
