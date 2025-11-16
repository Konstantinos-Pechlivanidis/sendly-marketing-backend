import Toast from './Toast';

export default function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto z-70 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
