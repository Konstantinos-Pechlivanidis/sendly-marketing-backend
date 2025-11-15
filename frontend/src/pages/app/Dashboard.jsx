import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { useDashboard } from '../../services/queries';
import { TOKEN_KEY, STORE_KEY } from '../../utils/constants';
import { useStoreInfo } from '../../hooks/useStoreInfo';
import SEO from '../../components/SEO';

/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const storeInfo = useStoreInfo();
  // Use cached data when available - only show loading on initial load
  const { data: dashboardData, isLoading, isFetching, error } = useDashboard({
    refetchInterval: false, // Disable auto-refetch - data is cached and fresh for 2 minutes
  });

  // Authentication is handled by ProtectedRoute component
  // No need for redundant check here

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
    navigate('/login', { replace: true });
  };

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = isLoading && !dashboardData;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading dashboard..." />;
  }

  return (
    <>
      <SEO
        title="Dashboard - Sendly SMS Marketing"
        description="Manage your SMS marketing campaigns and grow your Shopify store."
        path="/app/dashboard"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        {/* Header */}
        <PageHeader
          title="Dashboard"
          subtitle={storeInfo ? `Welcome back, ${storeInfo.shopName || storeInfo.shopDomain}` : undefined}
        />

        {/* Error State */}
        {error && (
          <ErrorState
            title="Error Loading Dashboard"
            message={error.message || 'Failed to load dashboard data. Please try refreshing the page.'}
            onAction={() => window.location.reload()}
            actionLabel="Refresh Page"
          />
        )}

        {/* Dashboard Content - Show cached data immediately, update in background */}
        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
              {/* Credits Balance */}
              <GlassCard variant="ice" className="p-6 hover:shadow-glass-light-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-soft/80">
                    <Icon name="sms" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-neutral-text-primary">SMS Credits</h3>
                <p className="text-3xl font-bold text-ice-primary mb-1">
                  {dashboardData.credits?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-neutral-text-secondary">Available credits</p>
              </GlassCard>

              {/* Total Campaigns */}
              <GlassCard className="p-6 hover:shadow-glass-light-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-soft/80">
                    <Icon name="campaign" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-neutral-text-primary">Campaigns</h3>
                <p className="text-3xl font-bold text-neutral-text-primary mb-1">
                  {dashboardData.totalCampaigns || 0}
                </p>
                <p className="text-sm text-neutral-text-secondary">Total campaigns</p>
              </GlassCard>

              {/* Total Contacts */}
              <GlassCard className="p-6 hover:shadow-glass-light-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-soft/80">
                    <Icon name="segment" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-neutral-text-primary">Contacts</h3>
                <p className="text-3xl font-bold text-neutral-text-primary mb-1">
                  {dashboardData.totalContacts?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-neutral-text-secondary">Total contacts</p>
              </GlassCard>

              {/* Messages Sent */}
              <GlassCard className="p-6 hover:shadow-glass-light-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-soft/80">
                    <Icon name="send" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2 text-neutral-text-primary">Messages Sent</h3>
                <p className="text-3xl font-bold text-neutral-text-primary mb-1">
                  {dashboardData.totalMessagesSent?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-neutral-text-secondary">All time</p>
              </GlassCard>
            </div>
          )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <GlassCard 
            variant="ice" 
            className="p-6 group hover:scale-[1.02] hover:shadow-glass-light-lg transition-all cursor-pointer focus-ring" 
            onClick={() => navigate('/app/campaigns/new')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/app/campaigns/new');
              }
            }}
            aria-label="Create Campaign - Start a new SMS campaign"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-ice-soft/80 group-hover:bg-ice-primary/20 transition-colors">
                <Icon name="campaign" size="xl" variant="ice" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 text-neutral-text-primary">Create Campaign</h3>
                <p className="text-sm text-neutral-text-secondary">Start a new SMS campaign</p>
              </div>
              <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </GlassCard>

          <GlassCard 
            className="p-6 group hover:scale-[1.02] hover:shadow-glass-light-lg transition-all cursor-pointer focus-ring" 
            onClick={() => navigate('/app/contacts')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/app/contacts');
              }
            }}
            aria-label="Manage Contacts - View and manage your contacts"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-ice-soft/80 group-hover:bg-ice-primary/20 transition-colors">
                <Icon name="segment" size="xl" variant="ice" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 text-neutral-text-primary">Manage Contacts</h3>
                <p className="text-sm text-neutral-text-secondary">View and manage your contacts</p>
              </div>
              <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </GlassCard>

          <GlassCard 
            className="p-6 group hover:scale-[1.02] hover:shadow-glass-light-lg transition-all cursor-pointer focus-ring" 
            onClick={() => navigate('/app/automations')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/app/automations');
              }
            }}
            aria-label="Automations - Set up automated workflows"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-ice-soft/80 group-hover:bg-ice-primary/20 transition-colors">
                <Icon name="automation" size="xl" variant="ice" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 text-neutral-text-primary">Automations</h3>
                <p className="text-sm text-neutral-text-secondary">Set up automated workflows</p>
              </div>
              <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

