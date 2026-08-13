'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">عذراً، تعذر عرض هذا الجزء</h2>
          <p className="text-gray-500 text-sm mb-4">حدثت مشكلة مؤقتة في هذا الجزء من الصفحة.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            إعادة محاولة التحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
