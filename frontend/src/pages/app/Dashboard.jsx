import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useDashboard } from '../../services/queries';
import { TOKEN_KEY, STORE_KEY } from '../../utils/constants';
import SEO from '../../components/SEO';

/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const { data: dashboardData, isLoading, error } = useDashboard();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem(TOKEN_KEY);
    const storedStoreInfo = localStorage.getItem(STORE_KEY);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (storedStoreInfo) {
      try {
        setStoreInfo(JSON.parse(storedStoreInfo));
      } catch (e) {
        console.error('Error parsing store info:', e);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard - Sendly SMS Marketing"
        description="Manage your SMS marketing campaigns and grow your Shopify store."
        path="/app/dashboard"
      />
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-h1 md:text-4xl font-bold mb-2">Dashboard</h1>
              {storeInfo && (
                <p className="text-body text-border-subtle">
                  Welcome back, {storeInfo.shopName || storeInfo.shopDomain}
                </p>
              )}
            </div>
            <GlassButton variant="ghost" size="md" onClick={handleLogout}>
              <span className="flex items-center gap-2">
                <Icon name="logout" size="sm" variant="ice" />
                Log out
              </span>
            </GlassButton>
          </div>

          {/* Error State */}
          {error && (
            <GlassCard variant="dark" className="p-6 mb-6 border border-red-500/30">
              <div className="flex items-start gap-3">
                <Icon name="error" size="md" variant="ice" className="text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-h3 font-semibold mb-2 text-red-400">Error Loading Dashboard</h3>
                  <p className="text-body text-border-subtle">
                    {error.message || 'Failed to load dashboard data. Please try refreshing the page.'}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Dashboard Content */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Credits Balance */}
              <GlassCard variant="ice" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-accent/20">
                    <Icon name="sms" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h3 font-semibold mb-1">SMS Credits</h3>
                <p className="text-3xl font-bold text-ice-accent mb-2">
                  {dashboardData.credits?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-border-subtle">Available credits</p>
              </GlassCard>

              {/* Total Campaigns */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-accent/20">
                    <Icon name="campaign" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h3 font-semibold mb-1">Campaigns</h3>
                <p className="text-3xl font-bold text-primary-light mb-2">
                  {dashboardData.totalCampaigns || 0}
                </p>
                <p className="text-sm text-border-subtle">Total campaigns</p>
              </GlassCard>

              {/* Total Contacts */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-accent/20">
                    <Icon name="segment" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h3 font-semibold mb-1">Contacts</h3>
                <p className="text-3xl font-bold text-primary-light mb-2">
                  {dashboardData.totalContacts?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-border-subtle">Total contacts</p>
              </GlassCard>

              {/* Messages Sent */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-ice-accent/20">
                    <Icon name="send" size="lg" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h3 font-semibold mb-1">Messages Sent</h3>
                <p className="text-3xl font-bold text-primary-light mb-2">
                  {dashboardData.totalMessagesSent?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-border-subtle">All time</p>
              </GlassCard>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard variant="ice" className="p-6 group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => navigate('/app/campaigns/new')}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors">
                  <Icon name="campaign" size="xl" variant="ice" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-semibold mb-1">Create Campaign</h3>
                  <p className="text-sm text-border-subtle">Start a new SMS campaign</p>
                </div>
                <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </GlassCard>

            <GlassCard className="p-6 group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => navigate('/app/contacts')}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors">
                  <Icon name="segment" size="xl" variant="ice" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-semibold mb-1">Manage Contacts</h3>
                  <p className="text-sm text-border-subtle">View and manage your contacts</p>
                </div>
                <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </GlassCard>

            <GlassCard className="p-6 group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => navigate('/app/automations')}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors">
                  <Icon name="automation" size="xl" variant="ice" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-semibold mb-1">Automations</h3>
                  <p className="text-sm text-border-subtle">Set up automated workflows</p>
                </div>
                <Icon name="arrowRight" size="sm" variant="ice" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}

