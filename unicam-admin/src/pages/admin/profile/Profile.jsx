/**
 * Profile — Admin profile summary and logout action.
 */
import { LogOut, Mail, ShieldCheck, UserCircle } from 'lucide-react';
import '../universities/Universities.css';

export default function Profile({ admin, onLogout }) {
  return (
    <div className="page-shell">
      <div className="card card--compact">
        <div className="profile-header">
          <div className="profile-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
          <div>
            <h2>{admin?.name || 'Administrator'}</h2>
            <p>{admin?.role || 'Administrator'}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="info-tile">
            <UserCircle size={18} />
            <span className="info-label">Role</span>
            <strong>{admin?.role || 'Administrator'}</strong>
          </div>
          <div className="info-tile">
            <Mail size={18} />
            <span className="info-label">Email</span>
            <strong>{admin?.email || 'Not provided'}</strong>
          </div>
          <div className="info-tile">
            <ShieldCheck size={18} />
            <span className="info-label">Access</span>
            <strong>Admin</strong>
          </div>
        </div>

        <button className="btn btn--danger" onClick={onLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
