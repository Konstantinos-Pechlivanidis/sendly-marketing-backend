import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { useAutomations, useAutomationStats, useUpdateAutomation, useDeleteCampaign } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { normalizeArrayResponse } from '../../utils/apiHelpers';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function Automations() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: automationsData, isLoading, error } = useAutomations();
  const { data: stats, error: statsError } = useAutomationStats();
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteCampaign(); // Reuse delete campaign mutation

  const automations = normalizeArrayResponse(automationsData, 'automations');

  const filteredAutomations = statusFilter
    ? automations.filter((a) => a.status === statusFilter)
    : automations;

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateAutomation.mutateAsync({ id, status: newStatus });
      toast.success(`Automation ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error(error?.message || 'Failed to update automation');
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAutomation.mutateAsync(deleteTarget.id);
      toast.success('Automation deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to delete automation');
      setDeleteTarget(null);
    }
  };

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = isLoading && !automationsData;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading automations..." />;
  }

  const hasError = error || statsError;

  return (
    <>
      <SEO
        title="Automations - Sendly SMS Marketing"
        description="Manage your SMS marketing automations"
        path="/app/automations"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 bg-neutral-bg-base">
        {/* Header */}
        <PageHeader
          title="Automations"
          subtitle="Set up automated SMS workflows for your store"
          actionLabel="Create Automation"
          actionIcon="automation"
          actionTo="/app/automations/new"
        />

        {/* Error State */}
        {hasError && (
          <ErrorState
            title="Error Loading Automations"
            message={error?.message || statsError?.message || 'Failed to load automations. Please try refreshing the page.'}
            onAction={() => window.location.reload()}
            actionLabel="Refresh Page"
          />
        )}

        {/* Stats */}
        {!hasError && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            <GlassCard variant="ice" className="p-5 hover:shadow-glass-light-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-ice-soft/80">
                  <Icon name="automation" size="md" variant="ice" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-text-primary mb-1">
                {stats.total || automations.length}
              </p>
              <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Total Automations</p>
            </GlassCard>
            <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-ice-soft/80">
                  <Icon name="send" size="md" variant="ice" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-text-primary mb-1">
                {stats.messagesSent || 0}
              </p>
              <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Messages Sent</p>
            </GlassCard>
            <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-ice-soft/80">
                  <Icon name="check" size="md" variant="ice" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-text-primary mb-1">
                {stats.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Success Rate</p>
            </GlassCard>
          </div>
        )}

        {/* Filter */}
        {!hasError && (
          <GlassCard className="p-4 sm:p-6 mb-6 sm:mb-8">
          <GlassSelectCustom
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </GlassCard>
        )}

        {/* Automations Grid */}
        {!hasError && filteredAutomations.length === 0 ? (
          <EmptyState
            icon="automation"
            title="No automations found"
            message={statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first automation to get started'}
            actionLabel={!statusFilter ? "Create Automation" : undefined}
            actionIcon={!statusFilter ? "automation" : undefined}
            actionTo={!statusFilter ? "/app/automations/new" : undefined}
          />
        ) : !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAutomations.map((automation) => (
              <GlassCard key={automation.id} className="p-6 hover:shadow-glass-light-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-neutral-text-primary">{automation.name}</h3>
                    <StatusBadge status={automation.status} />
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {automation.trigger && (
                    <div>
                      <p className="text-xs text-neutral-text-secondary mb-1 uppercase tracking-wider">Trigger</p>
                      <p className="text-sm text-neutral-text-primary font-medium">{automation.trigger}</p>
                    </div>
                  )}
                  {automation.message && (
                    <div>
                      <p className="text-xs text-neutral-text-secondary mb-1 uppercase tracking-wider">Message</p>
                      <p className="text-sm text-neutral-text-primary line-clamp-2">
                        {automation.message}
                      </p>
                    </div>
                  )}
                  {automation.messagesSent !== undefined && (
                    <div>
                      <p className="text-xs text-neutral-text-secondary mb-1 uppercase tracking-wider">Messages Sent</p>
                      <p className="text-sm text-neutral-text-primary font-medium">{automation.messagesSent || 0}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-neutral-border/60">
                  <button
                    onClick={() => navigate(`/app/automations/${automation.id}`)}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg bg-neutral-surface-secondary border border-neutral-border hover:border-ice-primary hover:text-ice-primary transition-colors text-neutral-text-primary font-medium focus-ring min-h-[44px]"
                    aria-label="View automation"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleToggleStatus(automation.id, automation.status)}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg bg-neutral-surface-secondary border border-neutral-border hover:border-ice-primary hover:text-ice-primary transition-colors text-neutral-text-primary font-medium focus-ring min-h-[44px]"
                    aria-label={automation.status === 'active' ? 'Pause automation' : 'Activate automation'}
                  >
                    {automation.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(automation.id, automation.name)}
                    className="px-3 py-2.5 text-sm rounded-lg bg-neutral-surface-secondary border border-red-200 hover:border-red-500 hover:bg-red-50 transition-colors text-red-500 focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Delete automation"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Automation"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
      />
    </>
  );
}

