import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  colorClass = 'blue',
  loading = false,
  empty = false,
}) => {
  const colors = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    indigo: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
    sky: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  };

  const color = colors[colorClass] || colors.blue;

  return (
    <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-blue-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
            {title}
          </span>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : empty ? (
            <h3 className="text-xl font-bold text-slate-400 mt-1">N/A</h3>
          ) : (
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {value !== undefined && value !== null ? value : 0}
            </h3>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${color.bg} ${color.text} ${color.border}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend !== undefined || trendLabel) && !loading && !empty && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend !== undefined && (
            <span className={`px-2 py-0.5 rounded-full font-bold ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {trendLabel && (
            <span className="text-slate-400 font-medium">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
