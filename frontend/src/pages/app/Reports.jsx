import { useState } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import DateRangePicker from '../../components/ui/DateRangePicker';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { useReportsOverview, useReportsKPIs, useExportData } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format, subDays } from 'date-fns';

export default function Reports() {
  const toast = useToastContext();
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());

  const { data: overviewData, isLoading: isLoadingOverview, error: overviewError } = useReportsOverview({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const { data: kpisData, isLoading: isLoadingKPIs, error: kpisError } = useReportsKPIs({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const exportData = useExportData();

  const handleExport = async () => {
    try {
      const result = await exportData.mutateAsync({
        type: 'reports',
        format: 'csv',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      toast.success('Report exported successfully');
      // In a real app, you'd trigger a download here
    } catch (error) {
      toast.error(error?.message || 'Failed to export report');
    }
  };

  const kpis = kpisData || {};
  const overview = overviewData || {};

  // Check if we have any data
  const hasData = 
    (kpis.totalMessagesSent && kpis.totalMessagesSent > 0) ||
    (overview.overview && overview.overview.totalSmsSent > 0) ||
    (overview.campaignPerformance && Object.keys(overview.campaignPerformance).length > 0);

  // Prepare chart data - use actual data or empty arrays
  const messagesOverTime = overview.messagesOverTime || [];
  const deliveryStatusData = [
    { name: 'Delivered', value: kpis.delivered || 0 },
    { name: 'Failed', value: kpis.failed || 0 },
    { name: 'Pending', value: kpis.pending || 0 },
  ].filter(item => item.value > 0); // Only show non-zero values

  const campaignPerformance = overview.campaignPerformance || [];

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = (isLoadingOverview && !overviewData) || (isLoadingKPIs && !kpisData);

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading reports..." />;
  }

  const error = overviewError || kpisError;

  return (
    <>
      <SEO
        title="Reports - Sendly SMS Marketing"
        description="View analytics and performance reports"
        path="/app/reports"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 bg-neutral-bg-base">
        {/* Header */}
        <PageHeader
          title="Reports"
          subtitle="Analytics and performance insights"
        >
          <div className="flex gap-3 mt-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <GlassButton
              variant="ghost"
              size="lg"
              onClick={handleExport}
              disabled={exportData.isPending}
            >
              <span className="flex items-center gap-2">
                <Icon name="export" size="sm" variant="ice" />
                Export
              </span>
            </GlassButton>
          </div>
        </PageHeader>

        {/* Error State */}
        {error && (
          <ErrorState
            title="Error Loading Reports"
            message={error.message || 'Failed to load reports. Please try refreshing the page.'}
            onAction={() => window.location.reload()}
            actionLabel="Refresh Page"
          />
        )}

        {/* Empty State */}
        {!error && !hasData && (
          <EmptyState
            icon="chart"
            title="No report data available"
            message="There's no data to display for the selected date range. Try adjusting your date filters or create your first campaign to start generating reports."
            actionTo="/app/campaigns/new"
            actionLabel="Create Campaign"
            actionIcon="campaign"
          />
        )}

        {/* KPIs */}
        {!error && hasData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <GlassCard variant="ice" className="p-5 hover:shadow-glass-light-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-ice-soft/80">
                <Icon name="send" size="md" variant="ice" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-text-primary mb-1">
              {kpis.totalMessagesSent?.toLocaleString() || 0}
            </p>
            <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Messages Sent</p>
          </GlassCard>

          <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-ice-soft/80">
                <Icon name="check" size="md" variant="ice" />
              </div>
            </div>
            <p className="text-2xl font-bold text-ice-primary mb-1">
              {kpis.deliveryRate ? `${kpis.deliveryRate.toFixed(1)}%` : '0%'}
            </p>
            <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Delivery Rate</p>
          </GlassCard>

          <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-ice-soft/80">
                <Icon name="view" size="md" variant="ice" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-text-primary mb-1">
              {kpis.openRate ? `${kpis.openRate.toFixed(1)}%` : '0%'}
            </p>
            <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Open Rate</p>
          </GlassCard>

          <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-ice-soft/80">
                <Icon name="chart" size="md" variant="ice" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-text-primary mb-1">
              {kpis.conversionRate ? `${kpis.conversionRate.toFixed(1)}%` : '0%'}
            </p>
            <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Conversion Rate</p>
          </GlassCard>

          <GlassCard variant="fuchsia" className="p-5 hover:shadow-glass-light-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-fuchsia-soft/80">
                <Icon name="billing" size="md" variant="fuchsia" />
              </div>
            </div>
            <p className="text-2xl font-bold text-fuchsia-primary mb-1">
              ${kpis.revenueGenerated?.toLocaleString() || 0}
            </p>
            <p className="text-xs font-medium text-neutral-text-secondary uppercase tracking-wider">Revenue</p>
          </GlassCard>
        </div>
        )}

        {/* Charts */}
        {!error && hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Messages Over Time */}
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Messages Sent Over Time</h3>
            <LineChart
              data={messagesOverTime}
              dataKey="messages"
              name="Messages"
              stroke="#4E8FB8"
            />
          </GlassCard>

          {/* Delivery Status */}
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Delivery Status Breakdown</h3>
            <PieChart
              data={deliveryStatusData}
              dataKey="value"
              nameKey="name"
            />
          </GlassCard>
        </div>
        )}

        {/* Campaign Performance */}
        {!error && hasData && campaignPerformance.length > 0 && (
          <GlassCard className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Campaign Performance</h3>
          <BarChart
            data={campaignPerformance}
            dataKey="delivered"
            name="Delivered"
            fill="#4E8FB8"
          />
        </GlassCard>
        )}
      </div>
    </>
  );
}

