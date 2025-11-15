import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import BackButton from '../../components/ui/BackButton';
import PageHeader from '../../components/ui/PageHeader';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import GlassTable, {
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHeaderCell,
  GlassTableCell,
} from '../../components/ui/GlassTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { useCampaignReports, useCampaigns } from '../../services/queries';
import { normalizeArrayResponse } from '../../utils/apiHelpers';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function CampaignReports() {
  const toast = useToastContext();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const { data: campaignsData } = useCampaigns();
  const { data: reportsData, isLoading, error } = useCampaignReports({
    campaignId: selectedCampaignId || undefined,
  });

  const campaigns = campaignsData?.campaigns || [];
  const reports = normalizeArrayResponse(reportsData, 'reports');

  return (
    <>
      <SEO
        title="Campaign Reports - Sendly SMS Marketing"
        description="Detailed campaign performance reports"
        path="/app/reports/campaigns"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BackButton to="/app/reports" label="Back" />
            </div>
            <PageHeader
              title="Campaign Reports"
              subtitle="Detailed performance metrics for your campaigns"
            />
          </div>

          {/* Filter */}
          <GlassCard className="p-6 mb-6">
            <GlassSelectCustom
              label="Filter by Campaign"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              options={[
                { value: '', label: 'All Campaigns' },
                ...campaigns.map((campaign) => ({
                  value: campaign.id,
                  label: campaign.name,
                })),
              ]}
            />
          </GlassCard>

          {/* Error State */}
          {error && (
            <ErrorState
              title="Error Loading Reports"
              message={error.message || 'Failed to load campaign reports. Please try refreshing the page.'}
              onAction={() => window.location.reload()}
              actionLabel="Refresh Page"
            />
          )}

          {/* Reports Table */}
          {!error && isLoading && !reportsData ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !error && reports.length === 0 ? (
            <EmptyState
              icon="report"
              title="No reports found"
              message={selectedCampaignId
                ? 'No reports available for this campaign'
                : 'No campaign reports available'}
            />
          ) : !error && (
            <GlassCard className="p-0 overflow-hidden">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHeaderCell>Campaign</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Sent</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Delivered</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Failed</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Delivery Rate</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Date</GlassTableHeaderCell>
                    <GlassTableHeaderCell>Actions</GlassTableHeaderCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {reports.map((report) => (
                    <GlassTableRow key={report.id || report.campaignId}>
                      <GlassTableCell>
                        <Link
                          to={`/app/campaigns/${report.campaignId || report.id}`}
                          className="font-semibold text-ice-primary hover:underline"
                        >
                          {report.campaignName || report.name || 'Unknown Campaign'}
                        </Link>
                      </GlassTableCell>
                      <GlassTableCell>
                        <StatusBadge status={report.status} />
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-neutral-text-primary font-medium">{report.sent || 0}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-ice-primary font-medium">{report.delivered || 0}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-red-500 font-medium">{report.failed || 0}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-neutral-text-primary font-medium">
                          {report.deliveryRate ? `${report.deliveryRate.toFixed(1)}%` : '0%'}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-neutral-text-secondary text-sm">
                          {report.date ? format(new Date(report.date), 'MMM d, yyyy') : '-'}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <Link
                          to={`/app/campaigns/${report.campaignId || report.id}`}
                          className="p-2.5 rounded-lg hover:bg-neutral-surface-secondary transition-colors inline-block focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Icon name="view" size="sm" variant="ice" />
                        </Link>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </GlassTableBody>
              </GlassTable>
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}

