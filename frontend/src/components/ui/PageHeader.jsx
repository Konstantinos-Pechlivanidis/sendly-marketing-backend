import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Page Header Component
 * Consistent header styling across all app pages
 * iOS 26 style with proper spacing and typography
 */
export default function PageHeader({
  title,
  subtitle,
  action,
  actionLabel,
  actionIcon,
  actionVariant = 'primary',
  onAction,
  actionTo,
  className,
  children,
}) {
  return (
    <div className={clsx('mb-4 sm:mb-6 lg:mb-8', className)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1.5 sm:mb-2 text-neutral-text-primary tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-neutral-text-secondary leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {(action || actionLabel) && (
          <div className="flex-shrink-0">
            {actionTo ? (
              <GlassButton
                variant={actionVariant}
                size="lg"
                as={Link}
                to={actionTo}
                className="group"
              >
                <span className="flex items-center gap-2">
                  {actionIcon && <Icon name={actionIcon} size="sm" variant="ice" />}
                  {actionLabel}
                  {actionVariant === 'primary' && (
                    <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              </GlassButton>
            ) : action ? (
              action
            ) : (
              <GlassButton
                variant={actionVariant}
                size="lg"
                onClick={onAction}
                className="group"
              >
                <span className="flex items-center gap-2">
                  {actionIcon && <Icon name={actionIcon} size="sm" variant="ice" />}
                  {actionLabel}
                  {actionVariant === 'primary' && (
                    <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              </GlassButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

