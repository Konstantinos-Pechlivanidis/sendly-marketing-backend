import { clsx } from 'clsx';

export default function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  as,
  ...props 
}) {
  const baseClasses = 'glass rounded-2xl p-6 transition-glass';
  
  const variantClasses = {
    default: '',
    ice: 'glass-ice',
    fuchsia: 'glass-fuchsia',
    dark: 'glass-dark',
  };
  
  const hoverClasses = hover 
    ? 'hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-glass-lg cursor-pointer' 
    : '';

  const Component = as || 'div';

  return (
    <Component
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
}
