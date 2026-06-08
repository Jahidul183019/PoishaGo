// frontend/src/components/ui/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to a logging service like Sentry
    console.error('[ErrorBoundary caught]:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center
                        bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
          <div className="max-w-md w-full bg-[var(--bg-secondary)] rounded-2xl
                          border border-red-500/20 p-8 text-center shadow-xl">

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-red-400 mb-2">
              Something went wrong
            </h2>

            {/* Error message */}
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              An unexpected error occurred. Please try again.
            </p>

            {/* Show error detail in dev only */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-black/30 rounded-lg p-3
                              text-red-300 overflow-auto max-h-32 mb-4">
                {this.state.error.message}
              </pre>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={this.handleReset}
                className="px-5 py-2 rounded-xl bg-[#00C9A7] text-white
                           font-semibold text-sm hover:opacity-90 transition"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-xl border border-white/10
                           text-sm font-semibold hover:bg-white/5 transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
