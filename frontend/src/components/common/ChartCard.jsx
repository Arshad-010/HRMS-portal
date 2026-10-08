import React from 'react';
import EmptyState from './EmptyState';
import SkeletonLoader from './SkeletonLoader';

/**
 * ChartCard - Container card for analytics charts
 * @param {string} title - Chart title
 * @param {string} subtitle - One-line plain-English subtitle
 * @param {React.ReactNode} children - Chart component
 * @param {React.ReactNode} action - Header action (e.g. dropdown, tabs, export)
 * @param {boolean} loading - Loading state
 * @param {boolean} isEmpty - True if data array is empty
 * @param {string} emptyTitle - Fallback heading
 * @param {string} emptyDesc - Fallback description
 * @param {string} className - Optional container styling
 * @param {number} minHeight - Minimum height (default 320px)
 */
export const ChartCard = ({
  title,
  subtitle,
  children,
  action,
  loading = false,
  isEmpty = false,
  emptyTitle = 'No telemetry records found',
  emptyDesc = 'Data will appear here once relevant workforce events are recorded.',
  className = '',
  minHeight = 320,
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md ${className}`}>
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight m-0">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div 
        className="flex-1 w-full flex items-center justify-center pt-4 relative"
        style={{ minHeight: `${minHeight}px` }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col justify-center">
            <SkeletonLoader type="chart" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDesc}
            compact={true}
          />
        ) : (
          <div className="w-full h-full min-h-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
