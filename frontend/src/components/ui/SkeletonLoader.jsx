import { clsx } from 'clsx';

/**
 * SkeletonLoader Component
 * iOS 26 style skeleton loader for content areas
 */
export default function SkeletonLoader({
  lines = 3,
  className,
  variant = 'default',
}) {
  const variants = {
    default: 'bg-neutral-surface-secondary',
    light: 'bg-neutral-surface-secondary/50',
  };

  return (
    <div className={clsx('space-y-2 sm:space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={clsx(
            'h-3 sm:h-4 rounded-lg',
            variants[variant],
            idx === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

