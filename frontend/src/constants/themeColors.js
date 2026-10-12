/**
 * Design System Theme Colors for HRMS Command Center & Analytics
 * Palette:
 * - Primary: Corporate Blue (#2563EB / #60A5FA)
 * - Secondary Accent: Violet (#7C3AED / #A78BFA)
 * - Teal Accent: (#14B8A6 / #0D9488)
 * - Success: Emerald Green (#059669 / #10B981)
 * - Warning: Amber (#D97706 / #F59E0B)
 * - Danger: Rose (#DC2626 / #EF4444)
 */

export const THEME_COLORS = {
  primary: {
    DEFAULT: '#2563EB',
    light: '#60A5FA',
    dark: '#1D4ED8',
    bgLight: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.25)',
  },
  purple: {
    DEFAULT: '#7C3AED',
    light: '#A78BFA',
    dark: '#6D28D9',
    bgLight: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.25)',
  },
  teal: {
    DEFAULT: '#14B8A6',
    light: '#2DD4BF',
    dark: '#0D9488',
    bgLight: 'rgba(20, 184, 166, 0.08)',
    border: 'rgba(20, 184, 166, 0.25)',
  },
  success: {
    DEFAULT: '#059669',
    light: '#10B981',
    dark: '#047857',
    bgLight: 'rgba(5, 150, 105, 0.08)',
    border: 'rgba(5, 150, 105, 0.25)',
  },
  warning: {
    DEFAULT: '#D97706',
    light: '#F59E0B',
    dark: '#B45309',
    bgLight: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.25)',
  },
  danger: {
    DEFAULT: '#DC2626',
    light: '#EF4444',
    dark: '#B91C1C',
    bgLight: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.25)',
  },
  neutral: {
    slate50: '#F4F7FC',
    slate100: '#EDF2F9',
    slate200: '#E2E8F0',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    slate950: '#0B1220',
  },
};

// Recharts shared styling configuration
export const RECHARTS_THEME = {
  grid: {
    strokeDasharray: '3 3',
    stroke: 'currentColor',
    opacity: 0.1,
  },
  axis: {
    stroke: '#64748B',
    fontSize: 11,
    tickLine: false,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#111C2E',
      borderColor: '#263449',
      borderRadius: '12px',
      color: '#F1F5F9',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      fontSize: '12px',
      padding: '8px 12px',
    },
    itemStyle: {
      color: '#F1F5F9',
      fontWeight: 500,
    },
  },
  palette: [
    THEME_COLORS.primary.DEFAULT,
    THEME_COLORS.purple.DEFAULT,
    THEME_COLORS.teal.DEFAULT,
    THEME_COLORS.success.DEFAULT,
    THEME_COLORS.warning.DEFAULT,
    THEME_COLORS.danger.DEFAULT,
  ],
};

export default THEME_COLORS;
