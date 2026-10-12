import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * StatTrend - Semantic trend indicator pill
 * @param {number} value - Percentage change number (e.g. 5.4 or -2.1)
 * @param {string} label - Optional comparison label (e.g. "vs last period")
 * @param {boolean} isPositiveGood - If false (e.g. attrition, absenteeism), negative change is green
 * @param {string} size - 'sm' | 'md'
 */
export const StatTrend = ({ 
  value, 
  label = 'vs last period', 
  isPositiveGood = true,
  size = 'sm'
}) => {
  if (value === undefined || value === null) return null;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isZero = Math.abs(numericValue) < 0.01;
  const isUp = numericValue > 0;
  
  // Determine if this change is good or bad
  const isGood = isPositiveGood ? isUp : !isUp;

  let colorClasses = 'bg-slate-100 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  if (!isZero) {
    if (isGood) {
      colorClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else {
      colorClasses = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${colorClasses} ${padding}`}>
        {isZero ? (
          <Minus className="w-3 h-3" />
        ) : isUp ? (
          <ArrowUpRight className="w-3 h-3 shrink-0" />
        ) : (
          <ArrowDownRight className="w-3 h-3 shrink-0" />
        )}
        <span>
          {isUp ? '+' : ''}{numericValue.toFixed(1)}%
        </span>
      </span>
      {label && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
          {label}
        </span>
      )}
    </div>
  );
};

export default StatTrend;
