import { memo } from 'react';
import { clsx } from 'clsx';

const GlassBadge = memo(function GlassBadge({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-sm border';
  
  const variantClasses = {
    default: 'glass-badge-default',
    fuchsia: 'glass-badge-fuchsia',
    ice: 'glass-badge-ice',
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
});

GlassBadge.displayName = 'GlassBadge';

export default GlassBadge;

