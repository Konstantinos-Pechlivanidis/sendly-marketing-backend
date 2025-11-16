export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} border-2 border-ice-primary/40 border-t-ice-primary rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
      style={{
        animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }}
    />
  );
}

