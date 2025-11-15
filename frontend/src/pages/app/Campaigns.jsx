import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
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
import { useCampaigns, useDeleteCampaign, useSendCampaign, useScheduleCampaign } from '../../services/queries';
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

  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();
  const scheduleCampaign = useScheduleCampaign();

  const campaigns = data?.campaigns || [];
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

  const stats = [
    {
      label: 'Total',
      value: pagination.total || 0,
      icon: 'campaign',
      variant: 'default',
    },
    {
      label: 'Active',
      value: campaigns.filter((c) => c.status === 'active').length,
      icon: 'send',
      variant: 'ice',
    },
    {
      label: 'Scheduled',
      value: campaigns.filter((c) => c.status === 'scheduled').length,
      icon: 'schedule',
      variant: 'ice',
    },
    {
      label: 'Completed',
      value: campaigns.filter((c) => c.status === 'completed').length,
      icon: 'check',
      variant: 'default',
    },
  ];

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
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {stats.map((stat) => (
                <GlassCard key={stat.label} variant={stat.variant} className="p-5 hover:shadow-glass-light-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-ice-soft/80">
                      <Icon name={stat.icon} size="md" variant="ice" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-neutral-text-primary mb-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">{stat.label}</p>
                </GlassCard>
              ))}
            </div>

            {/* Filters and Search */}
        <GlassCard className="p-4 sm:p-6 mb-6 sm:mb-8">
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
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
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

