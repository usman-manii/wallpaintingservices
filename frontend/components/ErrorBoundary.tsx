/**
 * Enterprise Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs errors, and displays a fallback UI.
 * 
 * Features:
 * - Error tracking and logging
 * - User-friendly error UI
 * - Automatic error recovery attempts
 * - Development vs Production behavior
 * - Error context and stack traces
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to external service
    logger.error('React Error Boundary caught an error', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt automatic recovery after repeated errors
    if (this.state.errorCount >= 3) {
      logger.warn('Multiple errors detected, attempting page reload', {
        component: 'ErrorBoundary',
        errorCount: this.state.errorCount,
      });
      
      this.resetTimeout = setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if reset keys change
    if (this.props.resetKeys && this.state.hasError) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.reset();
      }
    }

    // Reset on prop changes if configured
    if (this.props.resetOnPropsChange && prevProps !== this.props && this.state.hasError) {
      this.reset();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  reset = (): void => {
    logger.info('Error Boundary reset', { component: 'ErrorBoundary' });
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI Component
 */
interface ErrorFallbackUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallbackUI({ error, errorInfo, onReset }: ErrorFallbackUIProps) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-elevation-3 p-8 border border-border">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-center text-foreground mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-center text-muted-foreground mb-8">
          We apologize for the inconvenience. An unexpected error occurred while loading this component.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Go Home
          </button>
        </div>

        {/* Development Mode: Show Error Details */}
        {isDevelopment && error && (
          <details className="bg-muted rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-foreground mb-2">
              Error Details (Development Only)
            </summary>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Error Message:</h3>
                <pre className="text-xs bg-destructive/10 p-3 rounded overflow-x-auto text-destructive font-mono">
                  {error.toString()}
                </pre>
              </div>

              {error.stack && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Stack Trace:</h3>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto text-foreground font-mono">
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Component Stack:</h3>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto text-foreground font-mono">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Production Mode: Report Option */}
        {!isDevelopment && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please{' '}
              <a
                href="/contact"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                contact support
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Higher-Order Component to wrap components with Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
