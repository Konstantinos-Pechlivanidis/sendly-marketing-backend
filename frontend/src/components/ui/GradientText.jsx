import { clsx } from 'clsx';

export default function GradientText({ 
  children, 
  className,
  as: Component = 'span',
  ...props 
}) {
  return (
    <Component
      className={clsx('gradient-text', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

