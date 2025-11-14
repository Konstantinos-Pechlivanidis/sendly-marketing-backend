export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} border-2 border-ice-accent/30 border-t-ice-accent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

