/**
 * AdminLayout — Main layout wrapper for all admin pages.
 * Contains the Sidebar, Navbar, and main content area.
 * Manages sidebar collapsed state and mobile drawer.
 */
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './AdminLayout.css';

export default function AdminLayout({ admin, onLogout }) {
  // Sidebar collapsed state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on window resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'admin-layout--collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        admin={admin}
        onLogout={onLogout}
      />

      <div className="admin-layout__main">
        <Navbar
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          admin={admin}
          onLogout={onLogout}
        />

        <main className="admin-layout__content">
          {/* Page content rendered by React Router <Outlet /> */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
