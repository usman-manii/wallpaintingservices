'use client';

import { ReactNode, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: <XCircle className="w-6 h-6" />,
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: <AlertTriangle className="w-6 h-6" />,
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: <Info className="w-6 h-6" />,
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle className="w-6 h-6" />,
      confirmBtn: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${style.bg} ${style.iconColor} p-3 rounded-full`}>
              {icon || style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title}
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {message}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 ${style.confirmBtn}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string | ReactNode;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = (
    title: string,
    message: string | ReactNode,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'warning'
  ) => {
    setDialogState({ isOpen: true, title, message, onConfirm, variant });
  };

  const close = () => {
    setDialogState({ ...dialogState, isOpen: false });
  };

  return {
    dialog: (
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={close}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
      />
    ),
    confirm,
  };
}
