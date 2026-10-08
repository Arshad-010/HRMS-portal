import React from 'react';
import { Award, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * ScoreBadge - Displays performance rating band and score
 * @param {number} score - Final performance score (0 to 100)
 * @param {string} band - Optional explicit band ('OUTSTANDING', 'EXCEEDS', 'MEETS', 'NEEDS_IMPROVEMENT')
 * @param {boolean} showScore - Whether to print the numeric score
 * @param {boolean} showIcon - Whether to display a contextual icon
 */
export const ScoreBadge = ({ score, band, showScore = true, showIcon = true }) => {
  let resolvedBand = band;
  const numScore = typeof score === 'number' ? score : (score ? parseFloat(score) : 0);

  if (!resolvedBand && numScore !== undefined) {
    if (numScore >= 90) resolvedBand = 'OUTSTANDING';
    else if (numScore >= 75) resolvedBand = 'EXCEEDS';
    else if (numScore >= 60) resolvedBand = 'MEETS';
    else resolvedBand = 'NEEDS_IMPROVEMENT';
  }

  const bandConfigs = {
    OUTSTANDING: {
      label: 'Outstanding',
      classes: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
      icon: Award,
      barColor: 'bg-violet-500',
    },
    EXCEEDS: {
      label: 'Exceeds Expectations',
      classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
      icon: TrendingUp,
      barColor: 'bg-sky-500',
    },
    MEETS: {
      label: 'Meets Expectations',
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
      icon: CheckCircle2,
      barColor: 'bg-amber-500',
    },
    NEEDS_IMPROVEMENT: {
      label: 'Needs Improvement',
      classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
      icon: AlertCircle,
      barColor: 'bg-rose-500',
    },
  };

  const current = bandConfigs[resolvedBand] || bandConfigs.MEETS;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${current.classes}`}>
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{current.label}</span>
      {showScore && numScore !== undefined && (
        <span className="ml-1 pl-1.5 border-l border-current/25 font-mono">
          {Math.round(numScore)}/100
        </span>
      )}
    </span>
  );
};

export default ScoreBadge;
