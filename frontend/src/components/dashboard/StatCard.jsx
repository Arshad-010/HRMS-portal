import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  colorClass = 'indigo',
  loading = false,
  empty = false
}) => {
  // Map color names to safe tailwind classes (since dynamic arbitrary classes aren't compiled)
  const colors = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  };

  const color = colors[colorClass] || colors.indigo;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-indigo-900/10">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">
            {title}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-2"></div>
          ) : empty ? (
            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">N/A</h3>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {value !== undefined && value !== null ? value : 0}
            </h3>
          )}
        </div>
        
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color.bg} ${color.text} ${color.border}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend !== undefined || trendLabel) && !loading && !empty && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend !== undefined && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {trendLabel && (
            <span className="text-slate-500 dark:text-slate-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
