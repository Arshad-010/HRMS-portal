import React from 'react';

/**
 * SkeletonLoader - Shimmering placeholder states
 * @param {string} type - 'kpi' | 'chart' | 'table' | 'card' | 'line'
 * @param {number} count - number of rows/cards to repeat
 */
export const SkeletonLoader = ({ type = 'kpi', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'kpi') {
    return (
      <>
        {items.map((i) => (
          <div 
            key={i} 
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col justify-between h-[142px]"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'chart') {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col h-full min-h-[340px]">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl min-h-[220px]"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
        <div className="h-12 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800"></div>
        {items.map((i) => (
          <div 
            key={i} 
            className="h-14 border-b border-slate-100 dark:border-slate-800/60 px-4 flex items-center gap-4 bg-white dark:bg-slate-900"
          >
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
  );
};

export default SkeletonLoader;
