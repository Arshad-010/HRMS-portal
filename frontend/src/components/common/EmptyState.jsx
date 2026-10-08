import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Plus, RefreshCw } from 'lucide-react';

/**
 * EmptyState - Illustrated fallback so panels never look blank
 * @param {React.Component} icon - Lucide icon
 * @param {string} title - Heading
 * @param {string} description - One-line helper text
 * @param {string} actionText - Text for primary button
 * @param {function} onAction - Click handler
 * @param {string} actionTo - Optional route link
 * @param {boolean} compact - Fits nicely in small cards
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  description = 'There are no records matching your selected filters or time period.',
  actionText,
  onAction,
  actionTo,
  compact = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center w-full ${compact ? 'py-8 px-4' : 'py-12 px-6'}`}>
      <div className={`rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-3.5 shadow-xs ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <Icon className={compact ? 'w-5 h-5' : 'w-7 h-7'} />
      </div>
      <h4 className={`font-bold text-slate-800 dark:text-slate-100 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        {title}
      </h4>
      <p className={`text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {description}
      </p>

      {(actionText && (onAction || actionTo)) && (
        actionTo ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
