import { clsx } from 'clsx';

export default function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  as,
  ...props
}) {
  const baseClasses = 'spring-animation focus-ring font-medium rounded-lg inline-flex items-center justify-center active-scale';
  
  const variantClasses = {
    primary: 'glass-button-primary shadow-glow-ice-light hover:shadow-glow-ice-light-lg',
    ghost: 'glass-button-ghost bg-transparent',
    fuchsia: 'glass-button-fuchsia shadow-glow-fuchsia-light',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'active:scale-95';

  // Handle 'as' prop for Link components
  const Component = as || 'button';
  const buttonProps = Component === 'button' 
    ? { 
        type: 'button', 
        disabled,
        'aria-disabled': disabled,
      } 
    : {};
  
  return (
    <Component
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  );
}

