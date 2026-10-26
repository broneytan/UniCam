/**
 * Students — Placeholder page for future student management features.
 */
import { Users, Search, UserCheck } from 'lucide-react';
import '../universities/Universities.css';

export default function Students() {
  return (
    <div className="page-shell">
      <div className="card card--compact">
        <div className="placeholder-header">
          <Users size={26} />
          <h2>Students</h2>
        </div>
        <p>Student management functionality is not yet supported by the backend API.</p>
        <div className="placeholder-grid">
          <div className="placeholder-tile">
            <Search size={18} />
            <span>Search by name or email</span>
          </div>
          <div className="placeholder-tile">
            <UserCheck size={18} />
            <span>Profile details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
