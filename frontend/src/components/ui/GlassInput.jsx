import { clsx } from 'clsx';
import { forwardRef } from 'react';

const GlassInput = forwardRef(({
  label,
  error,
  className,
  ...props
}, ref) => {
  const inputId = props.id || props.name || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-text-primary mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        className={clsx(
          'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-base sm:text-sm',
          'bg-neutral-surface-primary backdrop-blur-[24px]',
          'border border-neutral-border/60',
          'text-neutral-text-primary placeholder:text-neutral-text-secondary/70',
          'focus-ring focus:border-ice-primary focus:shadow-glow-ice-light',
          'spring-smooth shadow-sm',
          'hover:border-neutral-border hover:shadow-md',
          'min-h-[44px]',
          error && 'border-red-500 focus:border-red-500 focus:shadow-none',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;

