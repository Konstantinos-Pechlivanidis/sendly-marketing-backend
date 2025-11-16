import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import PageHeader from '../../components/ui/PageHeader';
import GlassTable, {
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHeaderCell,
  GlassTableCell,
} from '../../components/ui/GlassTable';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import GlassInput from '../../components/ui/GlassInput';
import GlassPagination from '../../components/ui/GlassPagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { useCampaigns, useDeleteCampaign, useSendCampaign, useCampaignStats } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function Campaigns() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const pageSize = 20;

  const { data, isLoading, error } = useCampaigns({
    page,
    pageSize,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  // Fetch campaign stats for summary cards
  const { data: statsData } = useCampaignStats();

  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const campaigns = useMemo(() => data?.campaigns || [], [data?.campaigns]);
  const pagination = data?.pagination || {};

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCampaign.mutateAsync(deleteTarget.id);
      toast.success('Campaign deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to delete campaign');
      setDeleteTarget(null);
    }
  };

  const handleSend = async (id) => {
    try {
      await sendCampaign.mutateAsync(id);
      toast.success('Campaign queued for sending');
    } catch (error) {
      toast.error(error?.message || 'Failed to send campaign');
    }
  };

  // Calculate stats from API or fallback to current page data
  const stats = useMemo(() => {
    if (statsData) {
      // Use stats from API - handle both direct stats and nested stats structure
      const statsObj = statsData.stats || statsData;
      const byStatus = statsObj.byStatus || {};
      
      return [
        {
          label: 'Total',
          value: statsObj.total || statsObj.totalCampaigns || 0,
          icon: 'campaign',
          variant: 'default',
          color: 'neutral',
        },
        {
          label: 'Active',
          value: byStatus.sending || 0,
          icon: 'send',
          variant: 'ice',
          color: 'ice',
        },
        {
          label: 'Scheduled',
          value: byStatus.scheduled || 0,
          icon: 'schedule',
          variant: 'ice',
          color: 'ice',
        },
        {
          label: 'Completed',
          value: byStatus.sent || 0,
          icon: 'check',
          variant: 'default',
          color: 'neutral',
        },
      ];
    }
    
    // Fallback: calculate from current page data (less accurate but better than nothing)
    return [
      {
        label: 'Total',
        value: pagination.total || campaigns.length || 0,
        icon: 'campaign',
        variant: 'default',
        color: 'neutral',
      },
      {
        label: 'Active',
        value: campaigns.filter((c) => c.status === 'sending').length,
        icon: 'send',
        variant: 'ice',
        color: 'ice',
      },
      {
        label: 'Scheduled',
        value: campaigns.filter((c) => c.status === 'scheduled').length,
        icon: 'schedule',
        variant: 'ice',
        color: 'ice',
      },
      {
        label: 'Completed',
        value: campaigns.filter((c) => c.status === 'sent').length,
        icon: 'check',
        variant: 'default',
        color: 'neutral',
      },
    ];
  }, [statsData, pagination.total, campaigns]);

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = isLoading && !data;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading campaigns..." />;
  }

  return (
    <>
      <SEO
        title="Campaigns - Sendly SMS Marketing"
        description="Manage your SMS marketing campaigns"
        path="/app/campaigns"
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        {/* Header */}
        <PageHeader
          title="Campaigns"
          subtitle="Create and manage your SMS marketing campaigns"
          actionLabel="Create Campaign"
          actionIcon="campaign"
          actionVariant="primary"
          actionTo="/app/campaigns/new"
        />

        {/* Error State */}
        {error && (
          <ErrorState
            title="Error Loading Campaigns"
            message={error.message || 'Failed to load campaigns. Please try refreshing the page.'}
            onAction={() => window.location.reload()}
            actionLabel="Refresh Page"
          />
        )}

        {/* Stats Cards */}
        {!error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
              {stats.map((stat) => (
                <GlassCard 
                  key={stat.label} 
                  variant={stat.variant} 
                  className="p-5 sm:p-6 hover:shadow-glass-light-lg transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`p-2.5 sm:p-3 rounded-xl transition-colors ${
                      stat.color === 'ice' 
                        ? 'bg-ice-soft/80 group-hover:bg-ice-soft' 
                        : 'bg-neutral-surface-secondary/60 group-hover:bg-neutral-surface-secondary'
                    }`}>
                      <Icon 
                        name={stat.icon} 
                        size="md" 
                        variant={stat.color === 'ice' ? 'ice' : 'default'} 
                        className={stat.color === 'ice' ? 'text-ice-primary' : 'text-neutral-text-secondary'}
                      />
                    </div>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold mb-1 transition-colors ${
                    stat.color === 'ice' 
                      ? 'text-ice-primary' 
                      : 'text-neutral-text-primary'
                  }`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">
                    {stat.label}
                  </p>
                </GlassCard>
              ))}
            </div>

            {/* Filters and Search */}
            <GlassCard className="p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="filter" size="sm" variant="ice" />
                  <h3 className="text-lg font-semibold text-neutral-text-primary">Filters & Search</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput
                    label="Search Campaigns"
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  <GlassSelectCustom
                    label="Filter by Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'sending', label: 'Sending' },
                      { value: 'sent', label: 'Sent' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Campaigns Table */}
            {!error && campaigns.length === 0 ? (
              <EmptyState
                icon="campaign"
                title="No campaigns found"
                message={searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first SMS campaign to get started'}
                actionLabel={!searchQuery && !statusFilter ? "Create Campaign" : undefined}
                actionIcon={!searchQuery && !statusFilter ? "campaign" : undefined}
                actionTo={!searchQuery && !statusFilter ? "/app/campaigns/new" : undefined}
              />
            ) : !error && (
              <>
                <GlassCard className="p-0 overflow-hidden">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHeaderCell>Name</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Recipients</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Created</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Actions</GlassTableHeaderCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {campaigns.map((campaign) => (
                    <GlassTableRow key={campaign.id}>
                      <GlassTableCell>
                        <div>
                          <Link
                            to={`/app/campaigns/${campaign.id}`}
                            className="font-semibold text-ice-primary hover:underline"
                          >
                            {campaign.name}
                          </Link>
                          {campaign.message && (
                            <p className="text-xs text-neutral-text-secondary mt-1 truncate max-w-md">
                              {campaign.message}
                            </p>
                          )}
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <StatusBadge status={campaign.status} />
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-neutral-text-primary font-medium">
                          {campaign.recipientCount || campaign.totalRecipients || 0}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-neutral-text-secondary text-sm">
                          {campaign.createdAt
                            ? format(new Date(campaign.createdAt), 'MMM d, yyyy')
                            : '-'}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
                            className="p-2.5 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="View campaign"
                          >
                            <Icon name="view" size="sm" variant="ice" />
                          </button>
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleSend(campaign.id)}
                              className="p-2.5 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label="Send campaign"
                            >
                              <Icon name="send" size="sm" variant="ice" />
                            </button>
                          )}
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => navigate(`/app/campaigns/${campaign.id}/edit`)}
                              className="p-2.5 rounded-lg hover:bg-neutral-surface-secondary transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label="Edit campaign"
                            >
                              <Icon name="edit" size="sm" variant="ice" />
                            </button>
                          )}
                          {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                            <button
                              onClick={() => handleDeleteClick(campaign.id, campaign.name)}
                              className="p-2.5 rounded-lg hover:bg-red-50 transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label="Delete campaign"
                            >
                              <Icon name="delete" size="sm" className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </GlassTableBody>
              </GlassTable>
            </GlassCard>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <GlassPagination
                  currentPage={page}
                  totalPages={pagination.totalPages || 1}
                  onPageChange={setPage}
                />
              </div>
            )}
              </>
            )}
          </>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
      />
    </>
  );
}

