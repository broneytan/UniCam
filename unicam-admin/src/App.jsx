
import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import api from './api/api';
import ConfirmDialog from './components/ConfirmDialog';
import { ToastProvider } from './components/Toast';
import { PreferencesProvider } from './context/PreferencesContext';
import { LanguageProvider } from './i18n/LanguageContext';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/auth/AdminLogin';
import Dashboard from './pages/admin/dashboard/Dashboard';
import Majors from './pages/admin/majors/Majors';
import Profile from './pages/admin/profile/Profile';
import Settings from './pages/admin/settings/Settings';
import Students from './pages/admin/students/Students';
import Universities from './pages/admin/universities/Universities';

function App() {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (!token || !user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      return null;
    }
  });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);
    const token = localStorage.getItem('admin_token');

    try {
      if (token) {
        await api.post('/admin/logout');
      }
    } catch {
      // Ignore API logout failures and clear the local session.
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setAdmin(null);
      setLogoutDialogOpen(false);
      setLogoutLoading(false);
    }
  }

  function requestLogout() {
    setLogoutDialogOpen(true);
  }

  function cancelLogout() {
    if (!logoutLoading) {
      setLogoutDialogOpen(false);
    }
  }

  function handleLogin(user) {
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdmin(user);
  }

  return (
    <LanguageProvider>
      <PreferencesProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  admin ? <Navigate to="/dashboard" replace /> : <AdminLogin onLogin={handleLogin} />
                }
              />

              <Route
                path="*"
                element={
                  admin ? (
                    <AdminAppShell admin={admin} onLogout={requestLogout} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
            <ConfirmDialog
              open={logoutDialogOpen}
              title="Confirm Logout"
              message="Are you sure you want to log out?"
              confirmLabel="Logout"
              cancelLabel="Stay logged in"
              variant="warning"
              loading={logoutLoading}
              onConfirm={handleLogout}
              onCancel={cancelLogout}
            />
          </BrowserRouter>
        </ToastProvider>
      </PreferencesProvider>
    </LanguageProvider>
  );
}

function AdminAppShell({ admin, onLogout }) {
  return (
    <Routes>
      <Route element={<AdminLayout admin={admin} onLogout={onLogout} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/universities" element={<Universities />} />
        <Route path="/universities/add" element={<Universities />} />
        <Route path="/universities/edit/:id" element={<Universities />} />
        <Route path="/majors" element={<Majors />} />
        <Route path="/majors/add" element={<Majors />} />
        <Route path="/majors/edit/:id" element={<Majors />} />
        <Route path="/students" element={<Students />} />
        <Route path="/profile" element={<Profile admin={admin} onLogout={onLogout} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
