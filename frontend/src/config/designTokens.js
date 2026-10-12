/**
 * HRMS Enterprise Design System Tokens
 * Palette: Corporate Blue (#2563EB), Violet Accent (#7C3AED), Teal (#0D9488 / #14B8A6),
 * Growth Green (#059669 / #10B981), Amber (#D97706 / #F59E0B), Danger (#DC2626 / #EF4444).
 * Light Surface: #F4F7FC (Bg), #FFFFFF (Surface), #E2E8F0 (Borders), #0F172A (Text).
 * Dark Surface: #0B1220 (Bg), #111C2E (Surface), #263449 (Borders), #F1F5F9 (Text).
 */

export const DESIGN_TOKENS = {
  palette: {
    corporateBlue: {
      light: '#3B82F6',
      DEFAULT: '#2563EB',
      dark: '#1D4ED8',
      surface: 'rgba(37, 99, 235, 0.08)',
      border: 'rgba(37, 99, 235, 0.25)',
    },
    violet: {
      light: '#A78BFA',
      DEFAULT: '#7C3AED',
      dark: '#6D28D9',
      surface: 'rgba(124, 58, 237, 0.08)',
      border: 'rgba(124, 58, 237, 0.25)',
    },
    teal: {
      light: '#2DD4BF',
      DEFAULT: '#14B8A6',
      dark: '#0D9488',
      surface: 'rgba(20, 184, 166, 0.08)',
      border: 'rgba(20, 184, 166, 0.25)',
    },
    success: {
      light: '#34D399',
      DEFAULT: '#059669',
      dark: '#047857',
      surface: 'rgba(5, 150, 105, 0.08)',
      border: 'rgba(5, 150, 105, 0.25)',
    },
    warning: {
      light: '#FBBF24',
      DEFAULT: '#D97706',
      dark: '#B45309',
      surface: 'rgba(217, 119, 6, 0.08)',
      border: 'rgba(217, 119, 6, 0.25)',
    },
    danger: {
      light: '#F87171',
      DEFAULT: '#DC2626',
      dark: '#B91C1C',
      surface: 'rgba(220, 38, 38, 0.08)',
      border: 'rgba(220, 38, 38, 0.25)',
    },
  },

  // Consistent Status Badges used across Employees, Attendance, Leaves, and Tasks
  statusBadges: {
    // Attendance
    PRESENT: {
      label: 'Present',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    LATE: {
      label: 'Late',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    },
    HALF_DAY: {
      label: 'Half Day',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30',
      dot: 'bg-blue-500',
    },
    ABSENT: {
      label: 'Absent',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
    },
    ON_LEAVE: {
      label: 'On Leave',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30',
      dot: 'bg-violet-500',
    },

    // Leaves
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-500/10 dark:bg-slate-500/15',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-500/30',
      dot: 'bg-slate-400',
    },

    // Tasks
    TODO: {
      label: 'To Do',
      bg: 'bg-slate-500/10 dark:bg-slate-500/15',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-500/30',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30',
    },
    REVIEW: {
      label: 'In Review',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30',
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30',
    },

    // Employee Status
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    INACTIVE: {
      label: 'Inactive',
      bg: 'bg-slate-500/10 dark:bg-slate-500/15',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-500/30',
      dot: 'bg-slate-400',
    },
    PROBATION: {
      label: 'Probation',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30',
      dot: 'bg-violet-500',
    },
  },

  // Role Badge Styling
  roleBadges: {
    ADMIN: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    HR: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    MANAGER: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    EMPLOYEE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },

  // Shared Recharts Chart Palette
  charts: {
    colors: ['#2563EB', '#7C3AED', '#14B8A6', '#10B981', '#F59E0B', '#EF4444'],
    primary: '#2563EB',
    secondary: '#7C3AED',
    teal: '#14B8A6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
};

export default DESIGN_TOKENS;
