'use client';

import { HelpCircle, Info, AlertCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface HelpTextProps {
  children: ReactNode;
  type?: 'info' | 'help' | 'warning';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function HelpText({ 
  children, 
  type = 'help',
  position = 'top',
  className = '' 
}: HelpTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  const icons = {
    help: HelpCircle,
    info: Info,
    warning: AlertCircle
  };

  const Icon = icons[type];

  const colors = {
    help: 'text-blue-500 hover:text-blue-600',
    info: 'text-slate-500 hover:text-slate-600',
    warning: 'text-amber-500 hover:text-amber-600'
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className={`p-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${colors[type]}`}
        aria-label="Help information"
      >
        <Icon size={16} className="inline-block" />
      </button>

      {isVisible && (
        <div 
          className={`absolute z-50 ${positions[position]} w-64 max-w-xs`}
          role="tooltip"
        >
          <div className="px-3 py-2 text-sm text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-xl border border-slate-700">
            <div className="relative">
              {children}
              {/* Arrow */}
              <div 
                className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-800 border-slate-700 rotate-45 ${
                  position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
                  position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
                  position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
                  'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline help text component
export function InlineHelp({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1 ${className}`}>
      <Info size={12} className="mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// Field label with help text
export function FieldLabel({ 
  label, 
  required, 
  helpText, 
  htmlFor 
}: { 
  label: string; 
  required?: boolean; 
  helpText?: ReactNode; 
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
      {label}
      {required && <span className="text-red-500">*</span>}
      {helpText && (
        <HelpText type="info" position="top">
          {helpText}
        </HelpText>
      )}
    </label>
  );
}
