'use client';

import { ReactNode } from 'react';
import { Inbox, Search, FileX, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'search' | 'error';
}

export function EmptyState({ icon, title, description, action, actionLabel, onAction, variant = 'default' }: EmptyStateProps) {
  const defaultIcons = {
    default: <Inbox className="w-16 h-16" />,
    search: <Search className="w-16 h-16" />,
    error: <AlertCircle className="w-16 h-16" />,
  };

  const effectiveAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-slate-400 dark:text-slate-600 mb-4">
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {effectiveAction && (
        <Button onClick={effectiveAction.onClick} className="flex items-center gap-2">
          {effectiveAction.icon}
          {effectiveAction.label}
        </Button>
      )}
    </div>
  );
}
