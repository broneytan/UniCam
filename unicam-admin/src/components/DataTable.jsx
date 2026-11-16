/**
 * DataTable — Reusable data table with search, filtering, pagination,
 * loading state, and empty state.
 */
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import './DataTable.css';

export default function DataTable({
  columns,         // Array of { key, label, render?, width? }
  data,            // Array of row objects
  loading,         // Boolean — show loading skeleton
  emptyMessage,    // Message to display when no data
  emptyIcon: EmptyIcon, // Optional icon for empty state
  searchPlaceholder, // Placeholder for search input
  onSearch,        // (searchTerm) => void
  searchValue,     // Controlled search value
  filters,         // Array of { label, value, options: [{ label, value }] }
  onFilterChange,  // (filterKey, value) => void
  filterValues,    // Object of current filter values
  pagination,      // { page, lastPage, total, perPage }
  onPageChange,    // (page) => void
  actions,         // Header action buttons: React element(s)
  title,           // Optional table title
}) {
  const { t } = useLanguage();

  return (
    <div className="data-table-wrapper">
      {/* Table header with search, filters, and actions */}
      <div className="data-table__header">
        <div className="data-table__header-left">
          {title && <h3 className="data-table__title">{title}</h3>}
        </div>

        <div className="data-table__header-right">
          {/* Search */}
          {onSearch && (
            <div className="data-table__search">
              <Search size={16} className="data-table__search-icon" />
              <input
                type="text"
                className="data-table__search-input"
                placeholder={t(searchPlaceholder || 'Search...')}
                value={searchValue || ''}
                onChange={(e) => onSearch(e.target.value)}
                aria-label={t('Search table')}
              />
            </div>
          )}

          {/* Filters */}
          {filters && filters.map((filter) => (
            <select
              key={filter.value}
              className="data-table__filter"
              value={filterValues?.[filter.value] || ''}
              onChange={(e) => onFilterChange?.(filter.value, e.target.value)}
              aria-label={t(filter.label)}
            >
              <option value="">{t(filter.label)}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.label)}</option>
              ))}
            </select>
          ))}

          {/* Actions */}
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="data-table__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {t(col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="data-table__skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="data-table__skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={columns.length}>
                  <div className="data-table__empty">
                    {EmptyIcon ? <EmptyIcon size={40} /> : <Inbox size={40} />}
                    <p>{t(emptyMessage || 'No records found.')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="data-table__pagination">
          <span className="data-table__pagination-info">
            {t('Page {page} of {lastPage}', {
              page: pagination.page,
              lastPage: pagination.lastPage,
            })}
            {pagination.total != null && ` · ${t('{total} total', { total: pagination.total })}`}
          </span>
          <div className="data-table__pagination-btns">
            <button
              className="data-table__page-btn"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              aria-label={t('Previous page')}
            >
              <ChevronLeft size={16} />
              {t('Previous')}
            </button>
            <button
              className="data-table__page-btn"
              disabled={pagination.page >= pagination.lastPage}
              onClick={() => onPageChange?.(pagination.page + 1)}
              aria-label={t('Next page')}
            >
              {t('Next')}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
