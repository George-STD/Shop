import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiTrash2, FiInfo, FiX } from 'react-icons/fi';
import { ButtonLoader } from './LoadingSpinner';

/**
 * Accessible confirmation modal for destructive or critical actions
 * Pure React & Tailwind CSS implementation (Zero external animation dependencies)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الإجراء',
  message = 'هل أنت متأكد من رغبتك في متابعة هذا الإجراء؟ لا يمكن التراجع عنه.',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
}) => {
  const cancelBtnRef = useRef(null);

  // Close on Escape key and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Auto focus cancel button for destructive safety
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 100);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: FiTrash2,
      iconBg: 'bg-red-500/10 text-red-500 border border-red-500/20',
      confirmBtn: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/25',
    },
    warning: {
      icon: FiAlertTriangle,
      iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      confirmBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25',
    },
    info: {
      icon: FiInfo,
      iconBg: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
      confirmBtn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25',
    },
  };

  const currentType = typeConfig[type] || typeConfig.danger;
  const Icon = currentType.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 z-10 text-right overflow-hidden animate-fadeInUp">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="إغلاق نافذة التأكيد"
          className="absolute top-4 left-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center sm:items-start sm:text-right sm:flex-row gap-4 mb-5">
          <div className={`p-3.5 rounded-2xl shrink-0 ${currentType.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-gray-900 mb-1.5"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="text-sm text-gray-600 leading-relaxed"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${currentType.confirmBtn}`}
          >
            {isLoading && <ButtonLoader size="sm" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
