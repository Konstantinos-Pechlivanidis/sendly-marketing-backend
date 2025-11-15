import { useState } from 'react';
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
import GlassPagination from '../../components/ui/GlassPagination';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useBillingBalance, useBillingPackages, useBillingHistory, useCreatePurchase } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format } from 'date-fns';
import LineChart from '../../components/charts/LineChart';

export default function Billing() {
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: balanceData, isLoading: isLoadingBalance, error: balanceError } = useBillingBalance();
  const { data: packagesData, isLoading: isLoadingPackages, error: packagesError } = useBillingPackages();
  const { data: historyData, isLoading: isLoadingHistory, error: historyError } = useBillingHistory({
    page,
    pageSize,
  });
  const createPurchase = useCreatePurchase();

  const balance = balanceData?.credits || balanceData?.balance || 0;
  const currency = balanceData?.currency || 'EUR';
  const packages = packagesData?.packages || (Array.isArray(packagesData) ? packagesData : []);
  const history = historyData?.transactions || historyData?.items || [];
  const pagination = historyData?.pagination || {};

  const handlePurchase = async (packageId) => {
    try {
      // Build success and cancel URLs based on current location
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/app/billing?success=true`;
      const cancelUrl = `${baseUrl}/app/billing?canceled=true`;
      
      const result = await createPurchase.mutateAsync({ 
        packageId,
        successUrl,
        cancelUrl,
      });
      
      // Redirect to Stripe checkout
      if (result?.sessionUrl) {
        toast.success('Redirecting to payment...');
        window.location.href = result.sessionUrl;
      } else if (result?.checkoutUrl) {
        toast.success('Redirecting to payment...');
        window.location.href = result.checkoutUrl;
      } else {
        toast.error('Failed to get checkout URL. Please try again.');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to initiate purchase');
    }
  };

  // Credit usage data for chart
  const creditUsageData = [
    { name: 'Week 1', credits: 100 },
    { name: 'Week 2', credits: 150 },
    { name: 'Week 3', credits: 120 },
    { name: 'Week 4', credits: 180 },
  ];

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = (isLoadingBalance && !balanceData) || (isLoadingPackages && !packagesData);
  const hasError = balanceError || packagesError || historyError;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading billing information..." />;
  }

  const isLowBalance = balance < 100;

  return (
    <>
      <SEO
        title="Billing - Sendly SMS Marketing"
        description="Manage your SMS credits and billing"
        path="/app/billing"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 bg-neutral-bg-base">
        {/* Header */}
        <PageHeader
          title="Billing"
          subtitle="Manage your SMS credits and purchase history"
        />

        {/* Error State */}
        {hasError && (
          <ErrorState
            title="Error Loading Billing Information"
            message={balanceError?.message || packagesError?.message || historyError?.message || 'Failed to load billing information. Please try refreshing the page.'}
            onAction={() => window.location.reload()}
            actionLabel="Refresh Page"
          />
        )}

        {/* Current Balance */}
        {!hasError && (
          <>
        <GlassCard variant={isLowBalance ? 'default' : 'ice'} className={`p-4 sm:p-6 mb-6 sm:mb-8 ${isLowBalance ? 'border-2 border-red-300 bg-red-50/60' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-text-secondary mb-2 uppercase tracking-wider">Current Balance</p>
              <p className={`text-3xl sm:text-4xl font-bold ${isLowBalance ? 'text-red-600' : 'text-ice-primary'}`}>
                {balance.toLocaleString()} credits
              </p>
              {isLowBalance && (
                <p className="text-sm text-red-600 mt-2 font-semibold">
                  ⚠️ Low balance. Consider purchasing more credits.
                </p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-ice-soft/80">
              <Icon name="sms" size="xl" variant="ice" />
            </div>
          </div>
        </GlassCard>

        {/* Credit Usage Chart */}
        <GlassCard className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-neutral-text-primary">Credit Usage</h3>
          <LineChart
            data={creditUsageData}
            dataKey="credits"
            name="Credits Used"
            stroke="#4E8FB8"
          />
        </GlassCard>

        {/* Purchase Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-text-primary">Purchase Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <GlassCard
                key={pkg.id}
                variant={pkg.popular || pkg.mostPopular ? 'fuchsia' : 'default'}
                className={`p-6 relative hover:shadow-glass-light-lg transition-shadow ${pkg.popular || pkg.mostPopular ? 'border-2 border-fuchsia-primary' : ''}`}
              >
                {(pkg.popular || pkg.mostPopular) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-fuchsia-primary text-white shadow-glow-fuchsia-light">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-neutral-text-primary">{pkg.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-neutral-text-primary">
                      {pkg.price} {currency}
                    </span>
                    {pkg.originalPrice && (
                      <span className="text-sm text-neutral-text-secondary line-through">
                        {pkg.originalPrice} {currency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-text-secondary mt-2 font-medium">
                    {pkg.credits} SMS credits
                  </p>
                </div>
                {pkg.features && (
                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-neutral-text-primary">
                        <Icon name="check" size="sm" variant="ice" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <GlassButton
                  variant={pkg.popular || pkg.mostPopular ? 'fuchsia' : 'ghost'}
                  size="lg"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={createPurchase.isPending}
                  className="w-full"
                >
                  {createPurchase.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Processing...
                    </span>
                  ) : (
                    'Purchase'
                  )}
                </GlassButton>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Purchase History */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-neutral-text-primary">Purchase History</h2>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon="billing"
              title="No purchase history"
              message="Your purchase history will appear here once you make your first credit purchase."
            />
          ) : (
            <>
              <GlassCard className="p-0 overflow-hidden">
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHeaderCell>Date</GlassTableHeaderCell>
                      <GlassTableHeaderCell>Package</GlassTableHeaderCell>
                      <GlassTableHeaderCell>Credits</GlassTableHeaderCell>
                      <GlassTableHeaderCell>Amount</GlassTableHeaderCell>
                      <GlassTableHeaderCell>Status</GlassTableHeaderCell>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {history.map((transaction) => (
                      <GlassTableRow key={transaction.id}>
                        <GlassTableCell>
                          <span className="text-neutral-text-secondary text-sm">
                            {transaction.createdAt
                              ? format(new Date(transaction.createdAt), 'MMM d, yyyy')
                              : '-'}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className="text-neutral-text-primary font-medium">
                            {transaction.packageName || transaction.package?.name || transaction.packageType || 'N/A'}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className="text-neutral-text-primary font-medium">
                            {transaction.credits || transaction.creditsAdded || transaction.package?.credits || 0}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className="text-neutral-text-primary font-medium">
                            {transaction.amount !== undefined ? transaction.amount.toFixed(2) : transaction.price !== undefined ? transaction.price.toFixed(2) : '0.00'} {transaction.currency || currency}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <StatusBadge status={transaction.status || 'completed'} />
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
        </div>
          </>
        )}
      </div>
    </>
  );
}

