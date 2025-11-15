import { clsx } from 'clsx';
import { forwardRef } from 'react';

const GlassTextarea = forwardRef(({
  label,
  error,
  className,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = props.id || props.name || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-text-primary mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        className={clsx(
          'w-full px-4 py-3 rounded-xl',
          'bg-neutral-surface-primary backdrop-blur-[24px]',
          'border border-neutral-border/60',
          'text-neutral-text-primary placeholder:text-neutral-text-secondary/70',
          'focus-ring focus:border-ice-primary focus:shadow-glow-ice-light',
          'spring-smooth shadow-sm resize-none',
          'hover:border-neutral-border hover:shadow-md',
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

GlassTextarea.displayName = 'GlassTextarea';

export default GlassTextarea;

