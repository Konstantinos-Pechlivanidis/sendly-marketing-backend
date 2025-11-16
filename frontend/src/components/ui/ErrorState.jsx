import { clsx } from 'clsx';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * ErrorState Component
 * Standardized error display component with consistent styling
 * iOS 26 style with proper spacing and visual hierarchy
 * 
 * Supports both page reload and React Query refetch for retry
 */
export default function ErrorState({
  title = 'Error',
  message,
  action,
  actionLabel,
  onAction,
  onRetry, // React Query refetch function
  className,
  variant = 'default',
  showRetry = true,
}) {
  const handleRetry = () => {
    if (onRetry) {
      // Use React Query refetch if provided
      onRetry();
    } else if (onAction) {
      // Use custom action if provided
      onAction();
    } else {
      // Fallback to page reload
      window.location.reload();
    }
  };

  return (
    <GlassCard 
      variant={variant} 
      className={clsx('p-4 sm:p-6 border border-red-200 bg-red-50/50', className)}
    >
      <div className="flex items-start gap-3">
        <Icon 
          name="error" 
          size="md" 
          variant="default" 
          className="text-red-500 flex-shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 text-red-500">{title}</h3>
          <p className="text-sm text-neutral-text-secondary mb-3 sm:mb-4">
            {message || 'An error occurred. Please try again.'}
          </p>
          {showRetry && (action || actionLabel || onAction || onRetry) && (
            <div className="flex gap-2">
              {action || (
                <GlassButton 
                  variant="primary" 
                  size="md" 
                  onClick={handleRetry}
                >
                  {actionLabel || 'Try Again'}
                </GlassButton>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

