import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import BackButton from '../../components/ui/BackButton';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  useCampaign,
  useDeleteCampaign,
  useSendCampaign,
  useCampaignMetrics,
} from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: campaign, isLoading, error } = useCampaign(id);
  const { data: metrics } = useCampaignMetrics(id);
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success('Campaign deleted successfully');
      navigate('/app/campaigns');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete campaign');
    }
  };

  const handleSend = async () => {
    try {
      await sendCampaign.mutateAsync(id);
      toast.success('Campaign queued for sending');
    } catch (error) {
      toast.error(error?.message || 'Failed to send campaign');
    }
  };

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = isLoading && !campaign;

  if (isInitialLoad) {
    return <LoadingState size="lg" />;
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1200px] mx-auto w-full">
          <ErrorState
            title="Campaign Not Found"
            message={error?.message || 'The campaign you are looking for does not exist.'}
            actionLabel="Back to Campaigns"
            onAction={() => navigate('/app/campaigns')}
          />
        </div>
      </div>
    );
  }

  const canEdit = campaign.status === 'draft' || campaign.status === 'scheduled';
  const canDelete = campaign.status === 'draft' || campaign.status === 'cancelled';
  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <>
      <SEO
        title={`${campaign.name} - Campaign Details`}
        description="View campaign details and metrics"
        path={`/app/campaigns/${id}`}
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1200px] mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BackButton to="/app/campaigns" label="Back" />
            </div>
            <PageHeader
              title={campaign.name}
              subtitle={
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={campaign.status} />
                  {campaign.createdAt && (
                    <span className="text-sm text-neutral-text-secondary">
                      Created {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              }
              action={
                <div className="flex gap-2">
                  {canSend && (
                    <GlassButton variant="primary" size="md" onClick={handleSend}>
                      <span className="flex items-center gap-2">
                        <Icon name="send" size="sm" variant="ice" />
                        Send Now
                      </span>
                    </GlassButton>
                  )}
                  {canEdit && (
                    <GlassButton
                      variant="ghost"
                      size="md"
                      as={Link}
                      to={`/app/campaigns/${id}/edit`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="edit" size="sm" variant="ice" />
                        Edit
                      </span>
                    </GlassButton>
                  )}
                  {canDelete && (
                    <GlassButton variant="ghost" size="md" onClick={() => setShowDeleteDialog(true)}>
                      <span className="flex items-center gap-2">
                        <Icon name="delete" size="sm" className="text-red-500" />
                        Delete
                      </span>
                    </GlassButton>
                  )}
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Details */}
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-neutral-text-primary">Campaign Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-text-secondary mb-1">Message</label>
                    <p className="text-neutral-text-primary mt-1 whitespace-pre-wrap">{campaign.message}</p>
                  </div>
                  {campaign.audience && (
                    <div>
                      <label className="text-sm font-medium text-neutral-text-secondary mb-1">Audience</label>
                      <p className="text-neutral-text-primary mt-1">{campaign.audience}</p>
                    </div>
                  )}
                  {campaign.scheduleAt && (
                    <div>
                      <label className="text-sm font-medium text-neutral-text-secondary mb-1">Scheduled For</label>
                      <p className="text-neutral-text-primary mt-1">
                        {format(new Date(campaign.scheduleAt), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Metrics */}
              {metrics && (
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-neutral-text-primary">Performance Metrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Sent</p>
                      <p className="text-2xl font-bold text-neutral-text-primary">
                        {metrics.sent || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Delivered</p>
                      <p className="text-2xl font-bold text-ice-primary">
                        {metrics.delivered || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Failed</p>
                      <p className="text-2xl font-bold text-red-500">
                        {metrics.failed || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Delivery Rate</p>
                      <p className="text-2xl font-bold text-ice-primary">
                        {metrics.deliveryRate ? `${metrics.deliveryRate.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <GlassCard variant="ice" className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-neutral-text-primary">Quick Info</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Recipients</p>
                    <p className="text-lg font-semibold text-neutral-text-primary">
                      {campaign.recipientCount || campaign.totalRecipients || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Status</p>
                    <StatusBadge status={campaign.status} />
                  </div>
                  {campaign.createdAt && (
                    <div>
                      <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Created</p>
                      <p className="text-sm text-neutral-text-primary">
                        {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
      />
    </>
  );
}

