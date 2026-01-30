'use client';

import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string | ReactNode;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: boolean;
}

export function Tooltip({ content, children, position = 'top', icon = false }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-900',
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help inline-flex items-center"
      >
        {icon ? (
          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        ) : (
          children
        )}
      </div>

      {show && (
        <div className={`absolute z-[9999] ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs whitespace-normal">
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}

export function InfoTooltip({ content }: { content: string | ReactNode }) {
  return <Tooltip content={content} icon />;
}
