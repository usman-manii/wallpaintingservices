// frontend/components/ui/Button.tsx
'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  ariaLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ariaLabel, ...props }, ref) => {
    
    // WCAG 2.1 AA compliant color combinations with 4.5:1 contrast minimum
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground shadow-elevation-1 hover:shadow-elevation-2",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 disabled:bg-muted disabled:text-muted-foreground",
      outline: "border-2 border-border bg-background hover:bg-accent hover:border-accent-foreground/20 active:bg-accent/80 text-foreground disabled:border-muted disabled:text-muted-foreground disabled:bg-muted/30",
      ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground active:bg-accent/80 text-foreground disabled:text-muted-foreground disabled:bg-transparent",
      danger: "bg-error text-error-foreground hover:bg-error/90 active:bg-error/80 disabled:bg-muted disabled:text-muted-foreground shadow-elevation-1 hover:shadow-elevation-2",
      success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 disabled:bg-muted disabled:text-muted-foreground shadow-elevation-1",
      warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/80 disabled:bg-muted disabled:text-muted-foreground shadow-elevation-1",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm min-w-[64px]",
      md: "h-10 px-4 text-base min-w-[80px]",
      lg: "h-12 px-8 text-lg min-w-[100px]",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={isLoading}
        aria-disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
            role="status"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isLoading && <span className="sr-only">Loading...</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
