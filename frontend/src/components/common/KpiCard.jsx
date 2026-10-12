import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatTrend from './StatTrend';

/**
 * KpiCard - Analytics KPI Card with Sparkline and Trend
 * @param {string} title - Label (e.g. "Total Employees")
 * @param {string|number} value - Metric value (e.g. 54 or "92.4%")
 * @param {React.Component} icon - Lucide icon
 * @param {string} colorClass - 'primary' | 'success' | 'warning' | 'danger' | 'purple'
 * @param {number} trend - Percentage change (e.g. +4.2 or -1.5)
 * @param {string} trendLabel - Context label for trend (e.g. "vs last 30d")
 * @param {boolean} isPositiveGood - Whether higher is good (false for attrition/absenteeism)
 * @param {Array<number>} sparklineData - Array of numbers for mini trend sparkline
 * @param {boolean} loading - Skeleton loader toggle
 * @param {string} badge - Optional badge text (e.g. "This Month")
 */
export const KpiCard = ({
  title,
  value,
  icon: Icon,
  colorClass = 'primary',
  trend,
  trendLabel = 'vs last period',
  isPositiveGood = true,
  sparklineData = [],
  loading = false,
  badge,
}) => {
  const colorMap = {
    primary: {
      accent: '#0ea5e9',
      bgGlow: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
      iconBg: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      sparkline: '#0ea5e9',
    },
    success: {
      accent: '#10b981',
      bgGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      sparkline: '#10b981',
    },
    warning: {
      accent: '#f59e0b',
      bgGlow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      sparkline: '#f59e0b',
    },
    danger: {
      accent: '#ef4444',
      bgGlow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      sparkline: '#ef4444',
    },
    purple: {
      accent: '#8b5cf6',
      bgGlow: 'hover:border-violet-500/40 hover:shadow-violet-500/10',
      iconBg: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      sparkline: '#8b5cf6',
    },
  };

  const scheme = colorMap[colorClass] || colorMap.primary;

  // Transform sparkline points to recharts format
  const formattedSparkline = (sparklineData && sparklineData.length > 0)
    ? sparklineData.map((val, idx) => ({ idx, val }))
    : [
        { idx: 0, val: 20 },
        { idx: 1, val: 35 },
        { idx: 2, val: 28 },
        { idx: 3, val: 45 },
        { idx: 4, val: 40 },
        { idx: 5, val: 55 },
        { idx: 6, val: 62 },
      ];

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col justify-between h-[150px]">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative p-5 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${scheme.bgGlow}`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 truncate">
            {value !== undefined && value !== null ? value : 0}
          </div>
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-110 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Middle Sparkline Area */}
      <div className="flex justify-center items-center py-2">
        <div className="w-24 sm:w-32 h-10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity relative">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedSparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={scheme.sparkline} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={scheme.sparkline} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={scheme.sparkline}
                  strokeWidth={2}
                  fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Trend */}
      <div className="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100 dark:border-slate-800/80">
        <div className="shrink-0 w-full flex items-center justify-between">
          {trend !== undefined ? (
            <StatTrend 
              value={trend} 
              label={trendLabel} 
              isPositiveGood={isPositiveGood} 
              size="sm"
            />
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 dark:text-slate-400">
              {trendLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
