import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Calendar,
  CheckSquare,
  Clock,
  MessageSquare,
  Shield,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const ToastItem = ({ toast, onDismiss }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const duration = 5000; // 5 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast.id, onDismiss, isPaused]);

  const handleClick = () => {
    onDismiss(toast.id);
    if (toast.relatedEntityType === 'LEAVE') {
      navigate('/leaves');
    } else if (toast.relatedEntityType === 'TASK') {
      navigate('/tasks');
    } else if (toast.relatedEntityType === 'CHAT' || toast.type === 'DIRECT_MESSAGE' || toast.type === 'GROUP_MESSAGE') {
      navigate('/chat');
    } else if (toast.relatedEntityType === 'ATTENDANCE') {
      navigate('/attendance');
    } else {
      navigate('/notifications');
    }
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return {
          icon: <Calendar className="w-4 h-4 text-amber-500" />,
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          border: 'border-amber-500/30',
        };
      case 'LEAVE_APPROVED':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          border: 'border-emerald-500/30',
        };
      case 'LEAVE_REJECTED':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-500" />,
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          border: 'border-rose-500/30',
        };
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
        return {
          icon: <CheckSquare className="w-4 h-4 text-blue-500" />,
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          border: 'border-blue-500/30',
        };
      case 'TASK_COMPLETED':
        return {
          icon: <CheckCircle className="w-4 h-4 text-teal-500" />,
          bg: 'bg-teal-500/10 dark:bg-teal-500/20',
          border: 'border-teal-500/30',
        };
      case 'DIRECT_MESSAGE':
      case 'GROUP_MESSAGE':
        return {
          icon: <MessageSquare className="w-4 h-4 text-violet-500" />,
          bg: 'bg-violet-500/10 dark:bg-violet-500/20',
          border: 'border-violet-500/30',
        };
      case 'ATTENDANCE_REMINDER':
      case 'ATTENDANCE_CHECKIN':
      case 'ATTENDANCE_CHECKOUT':
        return {
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          border: 'border-blue-500/30',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-blue-500" />,
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          border: 'border-blue-500/30',
        };
    }
  };

  const config = getIconConfig(toast.type);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto w-full bg-white/95 dark:bg-[#111C2E]/95 backdrop-blur-md border border-slate-200 dark:border-[#263449] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer"
      onClick={handleClick}
      role="alert"
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0 mt-0.5`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {toast.title}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">Just now</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {toast.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-[#0B1220] h-1 overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const NotificationToast = () => {
  const { toasts, removeToast } = useNotifications();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.slice(0, 3).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default NotificationToast;
