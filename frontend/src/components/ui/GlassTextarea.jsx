import { clsx } from 'clsx';
import { forwardRef } from 'react';

const GlassTextarea = forwardRef(({
  label,
  error,
  className,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-light mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full px-4 py-3 rounded-md',
          'bg-glass-white backdrop-blur-[24px]',
          'border border-glass-border',
          'text-primary-light placeholder:text-border-subtle',
          'focus-ring focus:border-ice-accent focus:shadow-glow-ice',
          'transition-button resize-none',
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

GlassTextarea.displayName = 'GlassTextarea';

export default GlassTextarea;

