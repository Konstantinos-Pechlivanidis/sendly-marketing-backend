import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * EmptyState Component
 * Standardized empty state display component
 * iOS 26 style with consistent messaging and CTAs
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'No items found',
  message,
  action,
  actionLabel,
  actionIcon,
  onAction,
  actionTo,
  className,
  variant = 'default',
}) {
  return (
    <GlassCard className={clsx('p-12 text-center', className)}>
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-xl bg-ice-soft/80">
          <Icon name={icon} size="xl" variant="ice" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-neutral-text-primary">{title}</h3>
      {message && (
        <p className="text-sm text-neutral-text-secondary mb-6">
          {message}
        </p>
      )}
      {(action || actionLabel || onAction || actionTo) && (
        <div className="flex justify-center">
          {action || (
            actionTo ? (
              <GlassButton
                variant="primary"
                size="lg"
                as={Link}
                to={actionTo}
                className="group"
              >
                <span className="flex items-center gap-2">
                  {actionIcon && <Icon name={actionIcon} size="sm" variant="ice" />}
                  {actionLabel}
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
            ) : (
              <GlassButton
                variant="primary"
                size="lg"
                onClick={onAction}
                className="group"
              >
                <span className="flex items-center gap-2">
                  {actionIcon && <Icon name={actionIcon} size="sm" variant="ice" />}
                  {actionLabel}
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
            )
          )}
        </div>
      )}
    </GlassCard>
  );
}

