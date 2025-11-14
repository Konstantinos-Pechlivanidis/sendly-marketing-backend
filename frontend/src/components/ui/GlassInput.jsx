import { clsx } from 'clsx';
import { forwardRef } from 'react';

const GlassInput = forwardRef(({
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-light mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 rounded-md',
          'bg-glass-white backdrop-blur-[24px]',
          'border border-glass-border',
          'text-primary-light placeholder:text-border-subtle',
          'focus-ring focus:border-ice-accent focus:shadow-glow-ice',
          'transition-button',
          error && 'border-red-500 focus:border-red-500 focus:shadow-none',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;

