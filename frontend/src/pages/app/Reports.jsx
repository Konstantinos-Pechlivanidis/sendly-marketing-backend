import { useState, useMemo } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import PageHeader from '../../components/ui/PageHeader';
import DateRangePicker from '../../components/ui/DateRangePicker';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import GlassTable, {
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHeaderCell,
  GlassTableCell,
} from '../../components/ui/GlassTable';
import Icon from '../../components/ui/Icon';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import {
  useReportsOverview,
  useReportsKPIs,
  useCampaignReports,
  useMessagingReports,
  useCreditsReports,
  useContactsReports,
  useAutomationReports,
} from '../../services/queries';
import SEO from '../../components/SEO';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());

  // Format dates for API
  const dateParams = useMemo(() => ({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }), [startDate, endDate]);

  // Fetch all report data
  const { data: overviewData, isLoading: isLoadingOverview, error: overviewError } = useReportsOverview(dateParams);
  const { data: kpisData, isLoading: isLoadingKPIs, error: kpisError } = useReportsKPIs();
  const { data: campaignsData, isLoading: isLoadingCampaigns, error: campaignsError } = useCampaignReports(dateParams);
  const { data: messagingData, isLoading: isLoadingMessaging, error: messagingError } = useMessagingReports(dateParams);
  const { data: creditsData, isLoading: isLoadingCredits, error: creditsError } = useCreditsReports(dateParams);
  const { data: contactsData, isLoading: isLoadingContacts, error: contactsError } = useContactsReports(dateParams);
  const { data: automationsData, isLoading: isLoadingAutomations, error: automationsError } = useAutomationReports(dateParams);

  // Normalize API responses - memoize to prevent unnecessary re-renders
  const overview = useMemo(() => overviewData?.data || overviewData || {}, [overviewData]);
  const kpis = useMemo(() => kpisData?.data || kpisData || {}, [kpisData]);
  const campaigns = useMemo(() => campaignsData?.data || campaignsData || {}, [campaignsData]);
  const messaging = useMemo(() => messagingData?.data || messagingData || {}, [messagingData]);
  const credits = useMemo(() => creditsData?.data || creditsData || {}, [creditsData]);
  const contacts = useMemo(() => contactsData?.data || contactsData || {}, [contactsData]);
  const automations = useMemo(() => automationsData?.data || automationsData || {}, [automationsData]);

  // Check for errors
  const error = overviewError || kpisError || campaignsError || messagingError || creditsError || contactsError || automationsError;

  // Check if we have any data
  const hasData = useMemo(() => {
    if (activeTab === 'overview') {
      return !!(overview.overview?.totalSmsSent || overview.campaignPerformance?.summary?.totalMessages);
    }
    if (activeTab === 'campaigns') {
      return !!(campaigns.campaigns?.length || campaigns.campaignStats);
    }
    if (activeTab === 'messaging') {
      return !!(messaging.totalMessages || messaging.byStatus);
    }
    if (activeTab === 'credits') {
      return !!(credits.summary?.totalCredits || credits.usageBreakdown);
    }
    if (activeTab === 'contacts') {
      return !!(contacts.summary?.totalContacts || contacts.genderDistribution);
    }
    if (activeTab === 'automations') {
      return !!(automations.summary?.totalTriggered || automations.activeAutomations);
    }
    return false;
  }, [activeTab, overview, campaigns, messaging, credits, contacts, automations]);

  // Loading state
  const isLoading = useMemo(() => {
    if (activeTab === 'overview') return isLoadingOverview || isLoadingKPIs;
    if (activeTab === 'campaigns') return isLoadingCampaigns;
    if (activeTab === 'messaging') return isLoadingMessaging;
    if (activeTab === 'credits') return isLoadingCredits;
    if (activeTab === 'contacts') return isLoadingContacts;
    if (activeTab === 'automations') return isLoadingAutomations;
    return false;
  }, [activeTab, isLoadingOverview, isLoadingKPIs, isLoadingCampaigns, isLoadingMessaging, isLoadingCredits, isLoadingContacts, isLoadingAutomations]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: 'campaign' },
    { id: 'messaging', label: 'Messaging', icon: 'sms' },
    { id: 'credits', label: 'Credits', icon: 'billing' },
    { id: 'contacts', label: 'Contacts', icon: 'personal' },
    { id: 'automations', label: 'Automations', icon: 'automation' },
  ];

  // Prepare chart data - ALL HOOKS MUST BE BEFORE EARLY RETURN
  const campaignTrends = useMemo(() => {
    const trends = overview.campaignPerformance?.trends || campaigns.trends || [];
    return trends
      .filter(t => t.date)
      .map(t => {
        try {
          return {
            name: format(new Date(t.date), 'MMM d'),
            messages: t.messages || 0,
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }, [overview.campaignPerformance?.trends, campaigns.trends]);

  const messagingTrends = useMemo(() => {
    const trends = messaging.trends || [];
    return trends
      .filter(t => t.date)
      .map(t => {
        try {
          return {
            name: format(new Date(t.date), 'MMM d'),
            messages: t.messages || 0,
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }, [messaging.trends]);

  const creditsTrends = useMemo(() => {
    const trends = credits.trends || [];
    return trends
      .filter(t => t.date)
      .map(t => {
        try {
          return {
            name: format(new Date(t.date), 'MMM d'),
            creditsUsed: t.creditsUsed || 0,
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }, [credits.trends]);

  const deliveryStatusData = useMemo(() => {
    const summary = overview.campaignPerformance?.summary || campaigns.campaignStats || {};
    const sent = summary.totalSent || summary.totalMessages || 0;
    const delivered = summary.totalDelivered || summary.delivered || 0;
    const failed = summary.totalFailed || summary.failed || 0;
    
    return [
      { name: 'Delivered', value: delivered },
      { name: 'Failed', value: failed },
      { name: 'Pending', value: Math.max(0, sent - delivered - failed) },
    ].filter(item => item.value > 0);
  }, [overview.campaignPerformance?.summary, campaigns.campaignStats]);

  // Campaign status breakdown data for pie chart
  // Maps backend campaign statuses to display names (aligned with campaign status handling)
  const campaignStatusData = useMemo(() => {
    const breakdown = campaigns.statusBreakdown || [];
    if (!Array.isArray(breakdown) || breakdown.length === 0) {
      return [];
    }
    // Status mapping: matches backend CampaignStatus enum (draft, scheduled, sending, sent, failed, cancelled)
    const statusMap = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      sending: 'Sending',
      sent: 'Sent',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return breakdown
      .map(item => ({
        name: statusMap[item.status] || item.status,
        value: item.count || 0,
      }))
      .filter(item => item.value > 0);
  }, [campaigns.statusBreakdown]);

  const messagingStatusData = useMemo(() => {
    const byStatus = messaging.byStatus || {};
    return [
      { name: 'Sent', value: byStatus.sent || 0 },
      { name: 'Delivered', value: byStatus.delivered || 0 },
      { name: 'Failed', value: byStatus.failed || 0 },
    ].filter(item => item.value > 0);
  }, [messaging.byStatus]);

  const messagingDirectionData = useMemo(() => {
    const byDirection = messaging.byDirection || {};
    return [
      { name: 'Outbound', value: byDirection.outbound || 0 },
      { name: 'Inbound', value: byDirection.inbound || 0 },
    ].filter(item => item.value > 0);
  }, [messaging.byDirection]);

  const creditsUsageData = useMemo(() => {
    const breakdown = credits.usageBreakdown || [];
    return breakdown.map(item => ({
      name: item.type === 'campaign' ? 'Campaigns' : 'Manual',
      value: item.count || 0,
    })).filter(item => item.value > 0);
  }, [credits.usageBreakdown]);

  const genderDistributionData = useMemo(() => {
    const distribution = contacts.genderDistribution || [];
    return distribution.map(item => ({
      name: item.gender === 'male' ? 'Male' : item.gender === 'female' ? 'Female' : item.gender === 'other' ? 'Other' : 'Unknown',
      value: item.count || 0,
    })).filter(item => item.value > 0);
  }, [contacts.genderDistribution]);

  const consentBreakdownData = useMemo(() => {
    const breakdown = contacts.consentBreakdown || {};
    return [
      { name: 'Opted In', value: breakdown.opted_in || 0 },
      { name: 'Opted Out', value: breakdown.opted_out || 0 },
      { name: 'Unknown', value: breakdown.unknown || 0 },
    ].filter(item => item.value > 0);
  }, [contacts.consentBreakdown]);

  const automationStatusData = useMemo(() => {
    const breakdown = automations.statusBreakdown || [];
    return breakdown.map(item => ({
      name: item.status === 'sent' ? 'Sent' : item.status === 'failed' ? 'Failed' : item.status === 'skipped' ? 'Skipped' : item.status,
      value: item.count || 0,
    })).filter(item => item.value > 0);
  }, [automations.statusBreakdown]);

  const isInitialLoad = isLoading && !hasData;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading reports..." />;
  }

  return (
    <>
      <SEO
        title="Reports - Sendly SMS Marketing"
        description="View analytics and performance reports"
        path="/app/reports"
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <PageHeader
            title="Reports"
            subtitle="Analytics and performance insights"
          >
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
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

          {/* Tabs */}
          {!error && (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 min-h-[44px]
                      ${activeTab === tab.id
                        ? 'bg-ice-primary text-primary-dark shadow-glow-ice'
                        : 'bg-neutral-surface-secondary text-neutral-text-primary hover:bg-neutral-surface-primary hover:text-ice-primary'
                      }
                    `}
                    aria-label={`View ${tab.label} reports`}
                  >
                    <Icon name={tab.icon} size="sm" variant={activeTab === tab.id ? 'default' : 'default'} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content */}
          {!error && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <GlassCard variant="ice" className="p-5 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="send" size="md" variant="ice" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                        {(overview.overview?.totalSmsSent || overview.campaignPerformance?.summary?.totalMessages || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Messages Sent</p>
                    </GlassCard>

                    <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="check" size="md" variant="ice" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                        {overview.overview?.deliveryRate || overview.campaignPerformance?.summary?.deliveryRate
                          ? `${(overview.overview.deliveryRate || overview.campaignPerformance.summary.deliveryRate).toFixed(1)}%`
                          : '0%'}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Delivery Rate</p>
                    </GlassCard>

                    <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="campaign" size="md" variant="ice" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                        {(overview.overview?.totalCampaigns || kpis.overview?.totalCampaigns || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Campaigns</p>
                    </GlassCard>

                    <GlassCard className="p-5 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="personal" size="md" variant="ice" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                        {(overview.overview?.totalContacts || kpis.overview?.totalContacts || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Contacts</p>
                    </GlassCard>

                    <GlassCard variant="fuchsia" className="p-5 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-fuchsia-soft/80">
                          <Icon name="billing" size="md" variant="fuchsia" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-fuchsia-primary mb-1">
                        {(overview.overview?.creditsRemaining || kpis.overview?.creditsRemaining || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Credits</p>
                    </GlassCard>
                  </div>

                  {/* Charts */}
                  {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {campaignTrends.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Messages Over Time</h3>
                          <LineChart
                            data={campaignTrends}
                            dataKey="messages"
                            name="Messages"
                            stroke="#4E8FB8"
                          />
                        </GlassCard>
                      )}

                      {deliveryStatusData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Delivery Status</h3>
                          <PieChart
                            data={deliveryStatusData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="chart"
                      title="No report data available"
                      message="There's no data to display for the selected date range. Try adjusting your date filters or create your first campaign to start generating reports."
                      actionTo="/app/campaigns/new"
                      actionLabel="Create Campaign"
                      actionIcon="campaign"
                    />
                  )}
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Campaign Stats */}
                  {campaigns.campaignStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(campaigns.campaignStats.totalSent || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Total Sent</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {(campaigns.campaignStats.totalDelivered || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Delivered</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-red-500 mb-1">
                          {(campaigns.campaignStats.totalFailed || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Failed</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {campaigns.campaignStats.avgDeliveryRate
                            ? `${campaigns.campaignStats.avgDeliveryRate.toFixed(1)}%`
                            : '0%'}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Avg Delivery Rate</p>
                      </GlassCard>
                    </div>
                  )}

                  {/* Charts */}
                  {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {campaignTrends.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Campaign Messages Over Time</h3>
                          <LineChart
                            data={campaignTrends}
                            dataKey="messages"
                            name="Messages"
                            stroke="#4E8FB8"
                          />
                        </GlassCard>
                      )}

                      {campaignStatusData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Campaign Status Breakdown</h3>
                          <PieChart
                            data={campaignStatusData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Top Performers */}
                  {campaigns.topPerformers && campaigns.topPerformers.length > 0 && (
                    <GlassCard className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Top Performing Campaigns</h3>
                      <div className="overflow-x-auto">
                        <GlassTable>
                          <GlassTableHeader>
                            <GlassTableRow>
                              <GlassTableHeaderCell>Campaign</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Delivered</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Date</GlassTableHeaderCell>
                            </GlassTableRow>
                          </GlassTableHeader>
                          <GlassTableBody>
                            {campaigns.topPerformers.map((campaign) => (
                              <GlassTableRow key={campaign.id}>
                                <GlassTableCell>
                                  <Link
                                    to={`/app/campaigns/${campaign.id}`}
                                    className="font-semibold text-ice-primary hover:underline"
                                  >
                                    {campaign.name}
                                  </Link>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <StatusBadge status={campaign.status} />
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-neutral-text-primary font-medium">{campaign.delivered || 0}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-sm text-neutral-text-secondary">
                                    {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : '-'}
                                  </span>
                                </GlassTableCell>
                              </GlassTableRow>
                            ))}
                          </GlassTableBody>
                        </GlassTable>
                      </div>
                    </GlassCard>
                  )}

                  {/* Campaigns List */}
                  {campaigns.campaigns && campaigns.campaigns.length > 0 && (
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-neutral-border/60">
                        <h3 className="text-lg sm:text-xl font-semibold text-neutral-text-primary">All Campaigns</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <GlassTable>
                          <GlassTableHeader>
                            <GlassTableRow>
                              <GlassTableHeaderCell>Campaign</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Messages</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Created</GlassTableHeaderCell>
                            </GlassTableRow>
                          </GlassTableHeader>
                          <GlassTableBody>
                            {campaigns.campaigns.map((campaign) => (
                              <GlassTableRow key={campaign.id}>
                                <GlassTableCell>
                                  <Link
                                    to={`/app/campaigns/${campaign.id}`}
                                    className="font-semibold text-ice-primary hover:underline"
                                  >
                                    {campaign.name}
                                  </Link>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <StatusBadge status={campaign.status} />
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-neutral-text-primary font-medium">{campaign.messageCount || 0}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-sm text-neutral-text-secondary">
                                    {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : '-'}
                                  </span>
                                </GlassTableCell>
                              </GlassTableRow>
                            ))}
                          </GlassTableBody>
                        </GlassTable>
                      </div>
                    </GlassCard>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="campaign"
                      title="No campaign data available"
                      message="There's no campaign data for the selected date range."
                    />
                  )}
                </div>
              )}

              {/* Messaging Tab */}
              {activeTab === 'messaging' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <GlassCard className="p-5">
                      <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                        {(messaging.totalMessages || 0).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Total Messages</p>
                    </GlassCard>
                    {messaging.byDirection && (
                      <>
                        <GlassCard className="p-5">
                          <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                            {(messaging.byDirection.outbound || 0).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Outbound</p>
                        </GlassCard>
                        <GlassCard className="p-5">
                          <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                            {(messaging.byDirection.inbound || 0).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Inbound</p>
                        </GlassCard>
                      </>
                    )}
                    {messaging.byStatus && (
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {(messaging.byStatus.delivered || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Delivered</p>
                      </GlassCard>
                    )}
                  </div>

                  {/* Charts */}
                  {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {messagingTrends.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Messages Over Time</h3>
                          <LineChart
                            data={messagingTrends}
                            dataKey="messages"
                            name="Messages"
                            stroke="#4E8FB8"
                          />
                        </GlassCard>
                      )}

                      {messagingStatusData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Status Breakdown</h3>
                          <PieChart
                            data={messagingStatusData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}

                      {messagingDirectionData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Direction Breakdown</h3>
                          <PieChart
                            data={messagingDirectionData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="sms"
                      title="No messaging data available"
                      message="There's no messaging data for the selected date range."
                    />
                  )}
                </div>
              )}

              {/* Credits Tab */}
              {activeTab === 'credits' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Summary Cards */}
                  {credits.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(credits.summary.totalCredits || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Total Credits</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-fuchsia-primary mb-1">
                          {(credits.summary.usedCredits || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Used</p>
                      </GlassCard>
                      <GlassCard variant="ice" className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {(credits.summary.remainingCredits || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Remaining</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(credits.summary.avgDailyUsage || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Avg Daily</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(credits.summary.totalPurchases || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Purchases</p>
                      </GlassCard>
                    </div>
                  )}

                  {/* Charts */}
                  {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {creditsTrends.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Credits Usage Over Time</h3>
                          <LineChart
                            data={creditsTrends}
                            dataKey="creditsUsed"
                            name="Credits Used"
                            stroke="#C09DAE"
                          />
                        </GlassCard>
                      )}

                      {creditsUsageData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Usage Breakdown</h3>
                          <PieChart
                            data={creditsUsageData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Recent Purchases */}
                  {credits.recentPurchases && credits.recentPurchases.length > 0 && (
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-neutral-border/60">
                        <h3 className="text-lg sm:text-xl font-semibold text-neutral-text-primary">Recent Purchases</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <GlassTable>
                          <GlassTableHeader>
                            <GlassTableRow>
                              <GlassTableHeaderCell>Package</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Credits</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Amount</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Date</GlassTableHeaderCell>
                            </GlassTableRow>
                          </GlassTableHeader>
                          <GlassTableBody>
                            {credits.recentPurchases.map((purchase) => (
                              <GlassTableRow key={purchase.id}>
                                <GlassTableCell>
                                  <span className="text-neutral-text-primary font-medium">{purchase.packageType || 'N/A'}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-neutral-text-primary font-medium">{(purchase.creditsAdded || 0).toLocaleString()}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-neutral-text-primary font-medium">
                                    {purchase.currency || 'USD'} {(purchase.amount || 0).toLocaleString()}
                                  </span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-sm text-neutral-text-secondary">
                                    {purchase.createdAt ? format(new Date(purchase.createdAt), 'MMM d, yyyy') : '-'}
                                  </span>
                                </GlassTableCell>
                              </GlassTableRow>
                            ))}
                          </GlassTableBody>
                        </GlassTable>
                      </div>
                    </GlassCard>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="billing"
                      title="No credit data available"
                      message="There's no credit usage data for the selected date range."
                    />
                  )}
                </div>
              )}

              {/* Contacts Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Summary Cards */}
                  {contacts.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(contacts.summary.totalContacts || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Total Contacts</p>
                      </GlassCard>
                      <GlassCard variant="ice" className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {(contacts.summary.optedInContacts || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Opted In</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {contacts.summary.consentRate
                            ? `${contacts.summary.consentRate}%`
                            : '0%'}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Consent Rate</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(contacts.summary.recentContacts || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Recent (30d)</p>
                      </GlassCard>
                    </div>
                  )}

                  {/* Charts */}
                  {hasData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {genderDistributionData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Gender Distribution</h3>
                          <PieChart
                            data={genderDistributionData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}

                      {consentBreakdownData.length > 0 && (
                        <GlassCard className="p-4 sm:p-6">
                          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-neutral-text-primary">Consent Breakdown</h3>
                          <PieChart
                            data={consentBreakdownData}
                            dataKey="value"
                            nameKey="name"
                          />
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Additional Metrics */}
                  {contacts.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {contacts.summary.birthdayContacts !== undefined && (
                        <GlassCard className="p-5">
                          <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                            {(contacts.summary.birthdayContacts || 0).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">With Birthday</p>
                        </GlassCard>
                      )}
                      {contacts.summary.engagedContacts !== undefined && (
                        <GlassCard className="p-5">
                          <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                            {(contacts.summary.engagedContacts || 0).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Engaged</p>
                        </GlassCard>
                      )}
                      {contacts.summary.engagementRate !== undefined && (
                        <GlassCard className="p-5">
                          <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                            {contacts.summary.engagementRate}%
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Engagement Rate</p>
                        </GlassCard>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="personal"
                      title="No contact data available"
                      message="There's no contact data for the selected date range."
                    />
                  )}
                </div>
              )}

              {/* Automations Tab */}
              {activeTab === 'automations' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Summary Cards */}
                  {automations.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(automations.summary.totalTriggered || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Total Triggered</p>
                      </GlassCard>
                      <GlassCard variant="ice" className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {(automations.summary.totalActive || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Active</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-neutral-text-primary mb-1">
                          {(automations.summary.totalInactive || 0).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Inactive</p>
                      </GlassCard>
                      <GlassCard className="p-5">
                        <p className="text-2xl sm:text-3xl font-bold text-ice-primary mb-1">
                          {automations.summary.completionRate
                            ? `${automations.summary.completionRate}%`
                            : '0%'}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-neutral-text-secondary uppercase tracking-wider">Completion Rate</p>
                      </GlassCard>
                    </div>
                  )}

                  {/* Active Automations List */}
                  {automations.activeAutomations && automations.activeAutomations.length > 0 && (
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-neutral-border/60">
                        <h3 className="text-lg sm:text-xl font-semibold text-neutral-text-primary">Active Automations</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <GlassTable>
                          <GlassTableHeader>
                            <GlassTableRow>
                              <GlassTableHeaderCell>Automation</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Trigger</GlassTableHeaderCell>
                              <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                            </GlassTableRow>
                          </GlassTableHeader>
                          <GlassTableBody>
                            {automations.activeAutomations.map((automation) => (
                              <GlassTableRow key={automation.id}>
                                <GlassTableCell>
                                  <span className="font-semibold text-neutral-text-primary">{automation.title}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className="text-sm text-neutral-text-secondary">{automation.triggerEvent}</span>
                                </GlassTableCell>
                                <GlassTableCell>
                                  <span className={`text-sm ${automation.isActive ? 'text-ice-primary' : 'text-neutral-text-secondary'}`}>
                                    {automation.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </GlassTableCell>
                              </GlassTableRow>
                            ))}
                          </GlassTableBody>
                        </GlassTable>
                      </div>
                    </GlassCard>
                  )}

                  {/* Charts */}
                  {hasData && automationStatusData.length > 0 && (
                    <GlassCard className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Status Breakdown</h3>
                      <PieChart
                        data={automationStatusData}
                        dataKey="value"
                        nameKey="name"
                      />
                    </GlassCard>
                  )}

                  {/* Empty State */}
                  {!hasData && !isLoading && (
                    <EmptyState
                      icon="automation"
                      title="No automation data available"
                      message="There's no automation data for the selected date range."
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
