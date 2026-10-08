/**
 * Design System Theme Colors for HRMS Command Center
 * Defined palette:
 * - Primary: Sky Blue (#0ea5e9)
 * - Success: Green (#10b981)
 * - Warning: Amber (#f59e0b)
 * - Danger: Red (#ef4444)
 * - Purple Accent: Violet (#8b5cf6)
 */

export const THEME_COLORS = {
  primary: {
    DEFAULT: '#0ea5e9', // sky-500
    light: '#38bdf8',   // sky-400
    dark: '#0284c7',    // sky-600
    bgLight: 'rgba(14, 165, 233, 0.1)',
    border: 'rgba(14, 165, 233, 0.25)',
  },
  success: {
    DEFAULT: '#10b981', // emerald-500
    light: '#34d399',   // emerald-400
    dark: '#059669',    // emerald-600
    bgLight: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  warning: {
    DEFAULT: '#f59e0b', // amber-500
    light: '#fbbf24',   // amber-400
    dark: '#d97706',    // amber-600
    bgLight: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  danger: {
    DEFAULT: '#ef4444', // red-500
    light: '#f87171',   // red-400
    dark: '#dc2626',    // red-600
    bgLight: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  purple: {
    DEFAULT: '#8b5cf6', // violet-500
    light: '#a78bfa',   // violet-400
    dark: '#7c3aed',    // violet-600
    bgLight: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
  neutral: {
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    slate950: '#090d16',
  }
};

// Recharts shared styling configuration
export const RECHARTS_THEME = {
  grid: {
    strokeDasharray: '3 3',
    stroke: 'currentColor',
    opacity: 0.12,
  },
  axis: {
    stroke: '#64748b',
    fontSize: 11,
    tickLine: false,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderRadius: '12px',
      color: '#f8fafc',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      fontSize: '12px',
      padding: '8px 12px',
    },
    itemStyle: {
      color: '#f8fafc',
      fontWeight: 500,
    },
  },
  palette: [
    THEME_COLORS.primary.DEFAULT,
    THEME_COLORS.success.DEFAULT,
    THEME_COLORS.purple.DEFAULT,
    THEME_COLORS.warning.DEFAULT,
    THEME_COLORS.danger.DEFAULT,
    '#06b6d4', // cyan
    '#ec4899', // pink
  ]
};
