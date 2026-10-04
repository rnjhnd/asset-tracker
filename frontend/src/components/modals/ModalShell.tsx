import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  variant?: 'default' | 'danger';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

const maxWidthMap: Record<NonNullable<ModalShellProps['maxWidth']>, string> = {
  sm: 'max-w-[95%] sm:max-w-sm',
  md: 'max-w-[95%] sm:max-w-md',
  lg: 'max-w-[95%] sm:max-w-lg',
  xl: 'max-w-[95%] sm:max-w-xl',
  '2xl': 'max-w-[95%] sm:max-w-2xl',
  '3xl': 'max-w-[95%] sm:max-w-3xl',
  '4xl': 'max-w-[95%] sm:max-w-4xl',
};

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const variantStyles =
    variant === 'danger'
      ? 'border-2 border-red-600 shadow-[8px_8px_0_0_#dc2626]'
      : 'border-2 border-gray-900 shadow-[8px_8px_0_0_#111827]';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white ${variantStyles} p-6 sm:p-8 w-full ${maxWidthMap[maxWidth]} relative max-h-[90vh] overflow-y-auto flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        )}

        {title && (
          <div className="mb-6 border-b pb-4">
            <h3 className="text-xl font-bold uppercase tracking-tight">{title}</h3>
            {subtitle && (
              <div className="font-mono text-xs text-gray-500 mt-1 uppercase">{subtitle}</div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
