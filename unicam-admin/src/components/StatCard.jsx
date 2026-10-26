/**
 * StatCard — Dashboard summary statistic card.
 * Displays an icon, numeric value, and label.
 * Supports optional trend indicator.
 */
import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon-wrap" style={{ background: color ? `${color}14` : undefined }}>
        <Icon size={22} style={{ color: color || 'var(--color-primary)' }} />
      </div>
      <div className="stat-card__content">
        <span className="stat-card__value">{value ?? '—'}</span>
        <span className="stat-card__label">{label}</span>
        {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
