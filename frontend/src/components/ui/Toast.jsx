import { useEffect } from 'react';
import { clsx } from 'clsx';

export default function Toast({ toast, onRemove }) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const typeStyles = {
    success: 'bg-ice-soft/60 border-ice-primary text-ice-primary',
    error: 'bg-red-50/80 border-red-500 text-red-500',
    warning: 'bg-yellow-50/80 border-yellow-500 text-yellow-600',
    info: 'bg-ice-soft/60 border-ice-primary text-ice-primary',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={clsx(
        'glass rounded-lg border px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-up shadow-glass',
        typeStyles[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg font-bold flex-shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 focus-ring rounded"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
