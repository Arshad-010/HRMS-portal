import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../../config/brand';

/**
 * Scalable SVG Brand Symbol
 * Represents workforce collaboration (connected people), leadership, and upward growth.
 * Colors: Corporate Blue (#2563EB), Violet Accent (#7C3AED), Growth Green (#10B981), Midnight Navy (#0F172A).
 */
export const BrandSymbol = ({ size = 'md', className = '', hasGlow = true }) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${currentSize} ${className}`}
      aria-hidden="true"
    >
      {/* Optional ambient background glow */}
      {hasGlow && (
        <span
          className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-violet-600/20 to-emerald-500/25 blur-sm opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none"
        />
      )}

      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Midnight container gradient */}
          <linearGradient id="hrms-badge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Central leader / growth spine gradient (Corporate Blue) */}
          <linearGradient id="hrms-leader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Left collaborator gradient (Violet Accent) */}
          <linearGradient id="hrms-collab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Right progress & growth gradient (Growth Green) */}
          <linearGradient id="hrms-growth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Upward horizon base bridge */}
          <linearGradient id="hrms-bridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* Outer squircle tile with subtle enterprise border */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="url(#hrms-badge-bg)"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* Subtle internal grid/matrix highlight */}
        <rect
          x="3"
          y="3"
          width="42"
          height="20"
          rx="11"
          fill="white"
          fillOpacity="0.04"
        />

        {/* Left Team Member (Violet Collaboration) */}
        <circle cx="14" cy="18" r="3.25" fill="url(#hrms-collab-grad)" />
        <path
          d="M7 35.5 C7.5 28.5, 13 25.5, 17 28.5 C15 31.5, 12 34.5, 7 35.5 Z"
          fill="url(#hrms-collab-grad)"
          fillOpacity="0.95"
        />

        {/* Right Team Member (Growth & Momentum) */}
        <circle cx="34" cy="18" r="3.25" fill="url(#hrms-growth-grad)" />
        <path
          d="M41 35.5 C40.5 28.5, 35 25.5, 31 28.5 C33 31.5, 36 34.5, 41 35.5 Z"
          fill="url(#hrms-growth-grad)"
          fillOpacity="0.95"
        />

        {/* Central Rising Leader / Workforce Core (Ascending Arrow Shape) */}
        <circle cx="24" cy="11.5" r="4.25" fill="url(#hrms-leader-grad)" />
        <path
          d="M16.5 35.5 C17.5 25, 21.5 20, 24 17.5 C26.5 20, 30.5 25, 31.5 35.5 C27.5 32.5, 20.5 32.5, 16.5 35.5 Z"
          fill="url(#hrms-leader-grad)"
        />

        {/* Interconnected Base Horizon Bridge (Unified Workforce) */}
        <path
          d="M11 38.5 C18 34, 30 34, 37 38.5"
          stroke="url(#hrms-bridge-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Growth Peak Accent Star/Sparkle (Upward Progress Indicator) */}
        <circle cx="38.5" cy="9.5" r="2" fill="#10B981" />
        <circle cx="38.5" cy="9.5" r="3.5" fill="#10B981" fillOpacity="0.25" />
      </svg>
    </div>
  );
};

/**
 * Reusable Brand Logo Component
 * Supports multiple layouts (full, horizontal, vertical/hero, symbol)
 * and responsive sizes (xs, sm, md, lg, xl).
 */
export const BrandLogo = ({
  variant = 'horizontal',
  size = 'md',
  showTagline,
  tagline = BRAND_CONFIG.tagline,
  linkTo,
  badge,
  className = '',
  symbolClassName = '',
  onClick,
}) => {
  // Auto-determine tagline display based on variant if not explicitly set
  const shouldShowTagline = showTagline !== undefined 
    ? showTagline 
    : (variant === 'full' || variant === 'vertical' || variant === 'hero');

  // Text scale classes based on size
  const textSizeMap = {
    xs: {
      title: 'text-xs',
      tagline: 'text-[9px]',
      badge: 'text-[8px] px-1 py-0.2',
    },
    sm: {
      title: 'text-sm',
      tagline: 'text-[10px]',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      title: 'text-base',
      tagline: 'text-[11px]',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      title: 'text-lg sm:text-xl',
      tagline: 'text-xs',
      badge: 'text-[11px] px-2 py-0.5',
    },
    xl: {
      title: 'text-2xl sm:text-3xl',
      tagline: 'text-sm',
      badge: 'text-xs px-2.5 py-1',
    },
    '2xl': {
      title: 'text-3xl sm:text-4xl',
      tagline: 'text-base',
      badge: 'text-xs px-3 py-1',
    },
  };

  const currentText = textSizeMap[size] || textSizeMap.md;

  // Content rendering
  const renderContent = () => {
    if (variant === 'symbol') {
      return (
        <BrandSymbol size={size} className={symbolClassName} />
      );
    }

    if (variant === 'vertical' || variant === 'hero') {
      return (
        <div className={`flex flex-col items-center text-center select-none ${className}`}>
          <BrandSymbol size={size} className={`mb-3 ${symbolClassName}`} />
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-tight text-blue-600 dark:text-blue-500 ${currentText.title}`}>
              {BRAND_CONFIG.prefix}
            </span>
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${currentText.title}`}>
              {BRAND_CONFIG.suffix}
            </span>
            {badge && (
              <span className={`font-bold uppercase tracking-wider rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 ${currentText.badge}`}>
                {badge}
              </span>
            )}
          </div>
          {shouldShowTagline && (
            <p className={`font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xs ${currentText.tagline}`}>
              {tagline}
            </p>
          )}
        </div>
      );
    }

    // Default: 'horizontal' or 'full'
    return (
      <div className={`group flex items-center gap-3 select-none ${className}`}>
        <BrandSymbol size={size} className={symbolClassName} />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-blue-600 dark:text-blue-400 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300 ${currentText.title}`}>
              {BRAND_CONFIG.prefix}
            </span>
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors ${currentText.title}`}>
              {BRAND_CONFIG.suffix}
            </span>
            {badge && (
              <span className={`font-bold uppercase tracking-wider rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0 ${currentText.badge}`}>
                {badge}
              </span>
            )}
          </div>
          {shouldShowTagline && (
            <p className={`font-medium text-slate-500 dark:text-slate-400 m-0 leading-tight mt-0.5 truncate ${currentText.tagline}`}>
              {tagline}
            </p>
          )}
        </div>
      </div>
    );
  };

  // If linkTo is explicitly provided or false
  if (linkTo === false) {
    return (
      <div onClick={onClick} className="inline-flex cursor-default">
        {renderContent()}
      </div>
    );
  }

  if (linkTo) {
    return (
      <Link to={linkTo} onClick={onClick} className="inline-flex no-underline">
        {renderContent()}
      </Link>
    );
  }

  // Not wrapped in link
  return renderContent();
};

export default BrandLogo;
