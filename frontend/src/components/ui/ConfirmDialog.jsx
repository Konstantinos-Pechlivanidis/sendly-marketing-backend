import { useEffect } from 'react';
import { clsx } from 'clsx';
import GlassModal from './GlassModal';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * ConfirmDialog Component
 * iOS 26 style confirmation dialog with glass morphism
 * Replaces window.confirm with a modern, accessible alternative
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  destructive = false,
  className,
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleEnter = (e) => {
      if (e.key === 'Enter' && isOpen && !destructive && e.target.tagName !== 'TEXTAREA') {
        // Only auto-confirm on Enter for non-destructive actions
        // Don't trigger if user is typing in a textarea
        e.preventDefault();
        handleConfirm();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleEnter);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleEnter);
    };
  }, [isOpen, onClose, destructive, handleConfirm]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      className={className}
    >
      <div className="text-center">
        {destructive && (
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-50 border border-red-200">
              <Icon name="error" size="lg" variant="default" className="text-red-500" />
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-3 text-neutral-text-primary">{title}</h2>
        
        {message && (
          <p className="text-sm text-neutral-text-secondary mb-6">
            {message}
          </p>
        )}
        
        <div className="flex gap-3">
          <GlassButton
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="flex-1"
          >
            {cancelLabel}
          </GlassButton>
          <GlassButton
            variant={destructive ? 'fuchsia' : variant}
            size="lg"
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

