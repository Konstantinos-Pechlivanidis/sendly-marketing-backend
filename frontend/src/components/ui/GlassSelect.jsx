import { clsx } from 'clsx';

/**
 * Glass Select Component
 * Select dropdown with glass styling
 */
export default function GlassSelect({
  label,
  name,
  value,
  onChange,
  error,
  options = [],
  placeholder,
  required,
  className,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-neutral-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        className={clsx(
          'w-full px-4 py-3 rounded-xl',
          'bg-neutral-surface-primary backdrop-blur-[24px]',
          'border',
          error ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-border/60 focus:border-ice-primary',
          'text-neutral-text-primary',
          'focus-ring focus:shadow-glow-ice-light',
          'spring-smooth shadow-sm',
          'hover:border-neutral-border hover:shadow-md',
          'appearance-none cursor-pointer',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234B505B\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")] bg-no-repeat bg-right-4 bg-[length:12px] pr-10',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value || option}
            value={option.value || option}
            className="bg-neutral-surface-primary text-neutral-text-primary"
          >
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

