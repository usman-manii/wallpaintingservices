'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface InlineMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
  icon?: ReactNode;
}

export function InlineMessage({ type, children, onDismiss, icon }: InlineMessageProps) {
  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: <CheckCircle className="w-5 h-5" />,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: <AlertCircle className="w-5 h-5" />,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5" />,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const style = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg} ${style.text}`}>
      <div className={`flex-shrink-0 ${style.iconColor}`}>
        {icon || style.icon}
      </div>
      <div className="flex-1 text-sm">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ${style.iconColor} hover:opacity-70`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
