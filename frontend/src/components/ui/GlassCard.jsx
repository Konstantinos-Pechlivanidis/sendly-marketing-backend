import { forwardRef } from 'react';
import { clsx } from 'clsx';

const GlassCard = forwardRef(({
  children,
  className,
  variant = 'default',
  hover = true,
  as,
  ...props 
}, ref) => {
  const baseClasses = 'glass rounded-2xl p-4 sm:p-6 transition-glass hover-lift';
  
  const variantClasses = {
    default: 'glass-card-default',
    ice: 'glass-ice',
    fuchsia: 'glass-fuchsia',
    dark: 'glass-dark',
  };

  const hoverClasses = hover
    ? 'hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-glass-light-lg cursor-pointer'
    : '';

  const Component = as || 'div';

  return (
    <Component
      ref={ref}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
