import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatTrend from './StatTrend';

/**
 * KpiCard - Analytics KPI Card with Sparkline and Trend
 * Color Classes: 'primary' (Corporate Blue) | 'purple' (Violet) | 'teal' | 'success' (Emerald) | 'warning' (Amber) | 'danger' (Rose)
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
      accent: '#2563EB',
      bgGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      sparkline: '#2563EB',
    },
    purple: {
      accent: '#7C3AED',
      bgGlow: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      sparkline: '#7C3AED',
    },
    teal: {
      accent: '#14B8A6',
      bgGlow: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      sparkline: '#14B8A6',
    },
    success: {
      accent: '#059669',
      bgGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      sparkline: '#059669',
    },
    emerald: {
      accent: '#059669',
      bgGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      sparkline: '#059669',
    },
    warning: {
      accent: '#D97706',
      bgGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      sparkline: '#D97706',
    },
    danger: {
      accent: '#DC2626',
      bgGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      sparkline: '#DC2626',
    },
  };

  const scheme = colorMap[colorClass] || colorMap.primary;

  const formattedSparkline =
    sparklineData && sparklineData.length > 0
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
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] animate-pulse flex flex-col justify-between h-[150px]">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  const gradId = `grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div
      className={`group relative p-5 rounded-2xl overflow-hidden bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-[#263449] hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${scheme.bgGlow}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 truncate">
            {value !== undefined && value !== null ? value : 0}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105 ${scheme.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Sparkline Area */}
      <div className="flex justify-center items-center py-2">
        <div className="w-24 sm:w-32 h-9 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity relative">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedSparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="1">
                    <stop offset="0%" stopColor={scheme.sparkline} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={scheme.sparkline} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={scheme.sparkline}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Trend */}
      <div className="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100 dark:border-[#263449]/70">
        <div className="shrink-0 w-full flex items-center justify-between">
          {trend !== undefined ? (
            <StatTrend value={trend} label={trendLabel} isPositiveGood={isPositiveGood} size="sm" />
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">{trendLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
