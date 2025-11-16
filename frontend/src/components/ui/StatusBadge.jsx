import { memo } from 'react';
import { clsx } from 'clsx';
import GlassBadge from './GlassBadge';

/**
 * Status Badge Component
 * Displays status with appropriate color coding
 */
const StatusBadge = memo(function StatusBadge({ status, className }) {
  const statusConfig = {
    // Campaign statuses
    draft: { label: 'Draft', variant: 'default', color: 'neutral-text-secondary' },
    scheduled: { label: 'Scheduled', variant: 'ice', color: 'ice-deep' },
    sending: { label: 'Sending', variant: 'ice', color: 'ice-deep' },
    sent: { label: 'Sent', variant: 'ice', color: 'ice-deep' },
    failed: { label: 'Failed', variant: 'default', color: 'red-600' },
    cancelled: { label: 'Cancelled', variant: 'default', color: 'red-600' },
    // Legacy/backward compatibility
    active: { label: 'Active', variant: 'ice', color: 'ice-deep' },
    completed: { label: 'Completed', variant: 'default', color: 'neutral-text-secondary' },
    
    // Contact consent statuses
    opted_in: { label: 'Opted In', variant: 'ice', color: 'ice-deep' },
    opted_out: { label: 'Opted Out', variant: 'default', color: 'red-600' },
    pending: { label: 'Pending', variant: 'default', color: 'neutral-text-secondary' },
    unknown: { label: 'Unknown', variant: 'default', color: 'neutral-text-secondary' },
    
    // Automation statuses
    paused: { label: 'Paused', variant: 'default', color: 'neutral-text-secondary' },
    
    // Message statuses (sent and failed already defined above for campaigns)
    delivered: { label: 'Delivered', variant: 'ice', color: 'ice-deep' },
  };

  const config = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    variant: 'default',
    color: 'neutral-text-secondary',
  };

  return (
    <GlassBadge
      variant={config.variant}
      className={clsx(
        config.color === 'red-600' && 'text-red-600 bg-red-50 border-red-300 font-semibold',
        config.color === 'red-500' && 'text-red-600 bg-red-50 border-red-300 font-semibold',
        className
      )}
    >
      {config.label}
    </GlassBadge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;

