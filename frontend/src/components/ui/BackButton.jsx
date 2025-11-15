import { useNavigate } from 'react-router-dom';
import GlassButton from './GlassButton';
import Icon from './Icon';
import { clsx } from 'clsx';

/**
 * BackButton Component
 * Standardized back button with consistent styling across all detail/edit pages
 * Supports both browser history navigation and specific route navigation
 */
export default function BackButton({
  to,
  label = 'Back',
  onClick,
  className,
  variant = 'ghost',
  size = 'md',
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <GlassButton
      variant={variant}
      size={size}
      onClick={handleClick}
      className={clsx('group', className)}
      aria-label={label}
    >
      <span className="flex items-center gap-2">
        <Icon 
          name="arrowRight" 
          size="sm" 
          className="rotate-180 group-hover:-translate-x-1 transition-transform" 
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    </GlassButton>
  );
}

