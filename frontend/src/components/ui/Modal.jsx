import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  customHeader,
  children, 
  maxWidth = 'max-w-2xl',
  className = ''
}) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);

  // Focus restoration & initial focus placement
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Focus close button or first focusable element
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
    }
  }, [isOpen]);

  // Handle Escape key and Tab/Shift+Tab focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden ${className}`}
      >
        {/* Header */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            {title && (
              <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                {title}
              </h2>
            )}
            {!title && <div />}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className="overflow-y-auto grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
