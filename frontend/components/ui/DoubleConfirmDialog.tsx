'use client';

import { ReactNode, useState } from 'react';
import { AlertTriangle, ShieldAlert, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface DoubleConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmationPhrase?: string;
  icon?: ReactNode;
}

export function DoubleConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmationPhrase = 'DELETE',
  icon,
}: DoubleConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setInputValue('');
    setError('');
    onClose();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    if (inputValue !== confirmationPhrase) {
      setError(`Please type "${confirmationPhrase}" exactly to confirm`);
      return;
    }
    onConfirm();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-full">
              {icon || <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title}
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {message}
              </div>

              {step === 2 && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Final Confirmation Required
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Type <span className="font-mono font-bold">{confirmationPhrase}</span> below to proceed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Input
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError('');
                      }}
                      placeholder={`Type ${confirmationPhrase} here`}
                      className="font-mono"
                      autoFocus
                    />
                    {error && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button
            onClick={handleClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
          >
            {cancelText}
          </Button>
          {step === 1 ? (
            <Button
              onClick={handleFirstConfirm}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleFinalConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!inputValue}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useDoubleConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string | ReactNode;
    onConfirm: () => void;
    confirmationPhrase?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmationPhrase: 'DELETE',
  });

  const confirm = (
    title: string,
    message: string | ReactNode,
    onConfirm: () => void,
    confirmationPhrase: string = 'DELETE'
  ) => {
    setDialogState({ isOpen: true, title, message, onConfirm, confirmationPhrase });
  };

  const close = () => {
    setDialogState({ ...dialogState, isOpen: false });
  };

  return {
    dialog: (
      <DoubleConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={close}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmationPhrase={dialogState.confirmationPhrase}
      />
    ),
    confirm,
  };
}
