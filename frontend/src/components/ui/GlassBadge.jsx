import { clsx } from 'clsx';

export default function GlassBadge({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  
  const variantClasses = {
    default: 'bg-glass-ice text-ice-accent',
    fuchsia: 'bg-glass-fuchsia text-zoom-fuchsia shadow-glow-fuchsia',
    ice: 'bg-glass-ice text-ice-accent',
  };

  return (
    <span
      className={clsx(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

