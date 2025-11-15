import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassBadge from '../components/ui/GlassBadge';
import Icon from '../components/ui/Icon';
import SEO from '../components/SEO';
import { usePublicPackages } from '../services/queries';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Fallback packages in case backend is not available
const FALLBACK_PACKAGES = [
  {
    id: 'package_1000',
    name: '1,000 SMS Credits',
    credits: 1000,
    price: 29.99,
    currency: 'EUR',
    description: 'Perfect for small businesses getting started',
    popular: false,
    features: ['1,000 SMS messages', 'No expiration', 'Priority support'],
  },
  {
    id: 'package_5000',
    name: '5,000 SMS Credits',
    credits: 5000,
    price: 129.99,
    currency: 'EUR',
    description: 'Great value for growing businesses',
    popular: true,
    features: ['5,000 SMS messages', 'No expiration', 'Priority support', '13% savings'],
  },
  {
    id: 'package_10000',
    name: '10,000 SMS Credits',
    credits: 10000,
    price: 229.99,
    currency: 'EUR',
    description: 'Best value for high-volume senders',
    popular: false,
    features: ['10,000 SMS messages', 'No expiration', 'Priority support', '23% savings'],
  },
  {
    id: 'package_25000',
    name: '25,000 SMS Credits',
    credits: 25000,
    price: 499.99,
    currency: 'EUR',
    description: 'Enterprise solution for maximum reach',
    popular: false,
    features: ['25,000 SMS messages', 'No expiration', 'Dedicated support', '33% savings'],
  },
];

export default function Pricing() {
  // Detect user's currency preference (default to EUR)
  const userCurrency = navigator.language?.includes('US') ? 'USD' : 'EUR';
  const { data: packagesData, isLoading, error } = usePublicPackages(userCurrency);
  
  // Use fallback packages if API fails or no data
  // If we have packages from API, use them; otherwise use fallback
  const packages = (packagesData?.packages && packagesData.packages.length > 0)
    ? packagesData.packages 
    : FALLBACK_PACKAGES;

  // Free features that are included with all packages
  const freeFeatures = [
    'All features included',
    'Campaign builder',
    'Automation workflows',
    'Analytics dashboard',
    'Shopify integration',
    'Message templates',
    'A/B testing',
    'Link shortening',
    'Webhook integration',
    'Unlimited contacts',
    'Priority support',
  ];

  return (
    <>
      <SEO
        title="Pricing - Sendly SMS Marketing"
        description="Simple, pay-as-you-go pricing. Pay only for SMS credits you use. All features included free."
        path="/pricing"
      />
      <div className="min-h-screen pt-24 pb-20 px-4 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-border-subtle mb-4">
              Pay only for SMS credits you use. All features are included free.
            </p>
            <p className="text-body text-border-subtle max-w-2xl mx-auto mb-6">
              No monthly subscriptions. No hidden fees. Buy SMS credits and use them whenever you need them. Credits never expire.
            </p>
            
            {/* User Journey CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GlassButton variant="primary" size="lg" as={Link} to="/install" className="group">
                <span className="flex items-center gap-2">
                  Install on Shopify
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
              <p className="text-sm text-border-subtle">
                Free 14-day trial • No credit card required
              </p>
            </div>
          </div>

          {/* Free Features Banner */}
          <GlassCard variant="ice" className="mb-12 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-ice-accent/20 flex-shrink-0">
                <Icon name="check" size="xl" variant="ice" />
              </div>
              <div>
                <h2 className="text-h2 font-bold mb-2">All Features Included Free</h2>
                <p className="text-body text-border-subtle mb-4">
                  Every feature is available to all users. Campaign builder, automations, analytics, integrations—everything is free.
                  You only pay for the SMS messages you send.
                </p>
                <div className="flex flex-wrap gap-2">
                  {freeFeatures.slice(0, 6).map((feature, i) => (
                    <GlassBadge key={i} variant="ice" className="text-xs">
                      {feature}
                    </GlassBadge>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* How It Works Section */}
          <GlassCard variant="dark" className="mb-12 p-8">
            <div className="text-center mb-6">
              <h2 className="text-h2 font-bold mb-4">How to Get Started</h2>
              <p className="text-body text-border-subtle max-w-2xl mx-auto">
                Getting started with Sendly is simple. Follow these steps to begin sending SMS campaigns.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-glow-ice">
                  1
                </div>
                <h3 className="text-h3 font-semibold mb-2">Install Extension</h3>
                <p className="text-sm text-border-subtle">
                  Install Sendly from the Shopify App Store. One-click installation, takes less than 2 minutes.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-glow-ice">
                  2
                </div>
                <h3 className="text-h3 font-semibold mb-2">Connect Your Store</h3>
                <p className="text-sm text-border-subtle">
                  Connect your Shopify store. Your customer data syncs automatically. No manual setup required.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-glow-ice">
                  3
                </div>
                <h3 className="text-h3 font-semibold mb-2">Start Sending</h3>
                <p className="text-sm text-border-subtle">
                  Create your first campaign and start sending. All features are free—you only pay for SMS credits.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <GlassButton variant="primary" size="lg" as={Link} to="/install" className="group">
                <span className="flex items-center gap-2">
                  Get Started Now
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
            </div>
          </GlassCard>

          {/* Pricing Cards */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {packages.map((pkg) => (
                <GlassCard
                  key={pkg.id}
                  variant={pkg.popular ? 'fuchsia' : 'default'}
                  className={`relative ${pkg.popular ? 'shadow-glow-fuchsia' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <GlassBadge variant="fuchsia">Most Popular</GlassBadge>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-xl bg-ice-accent/20">
                        <Icon name="sms" size="xl" variant={pkg.popular ? 'fuchsia' : 'ice'} />
                      </div>
                    </div>
                    <h3 className="text-h3 font-bold mb-2">{pkg.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {pkg.currency === 'USD' ? '$' : '€'}{pkg.price}
                      </span>
                    </div>
                    <p className="text-sm text-border-subtle mb-1">{pkg.credits.toLocaleString()} SMS Credits</p>
                    <p className="text-xs text-ice-accent">
                      {pkg.currency === 'USD' ? '$' : '€'}
                      {(pkg.price / pkg.credits * 1000).toFixed(2)} per 1,000 SMS
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-border-subtle text-center mb-4">{pkg.description}</p>
                    <ul className="space-y-2">
                      {pkg.features?.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Icon name="check" size="sm" variant={pkg.popular ? 'fuchsia' : 'ice'} className="mt-0.5 flex-shrink-0" />
                          <span className="text-primary-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <GlassButton
                    variant={pkg.popular ? 'fuchsia' : 'primary'}
                    size="lg"
                    className="w-full"
                    as={Link}
                    to="/install"
                  >
                    Get Started
                  </GlassButton>
                  <p className="text-xs text-center text-border-subtle mt-2">
                    Install app to purchase credits
                  </p>
                </GlassCard>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          <section className="max-w-2xl mx-auto">
            <h2 className="text-h2 font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <GlassCard hover={false} className="p-6">
                <div className="flex items-start gap-3">
                  <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="text-h3 font-semibold mb-2">Do I need to pay a monthly subscription?</h3>
                    <p className="text-body text-border-subtle">
                      No! There are no monthly subscriptions. You only pay for SMS credits when you need them. All features are included free.
                    </p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard hover={false} className="p-6">
                <div className="flex items-start gap-3">
                  <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="text-h3 font-semibold mb-2">Do credits expire?</h3>
                    <p className="text-body text-border-subtle">
                      No, your SMS credits never expire. Buy credits once and use them whenever you need them.
                    </p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard hover={false} className="p-6">
                <div className="flex items-start gap-3">
                  <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="text-h3 font-semibold mb-2">What happens if I run out of credits?</h3>
                    <p className="text-body text-border-subtle">
                      We'll notify you when your balance is low. Simply purchase more credits to continue sending SMS messages. All your features remain available.
                    </p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard hover={false} className="p-6">
                <div className="flex items-start gap-3">
                  <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="text-h3 font-semibold mb-2">Are all features really free?</h3>
                    <p className="text-body text-border-subtle">
                      Yes! Campaign builder, automations, analytics, integrations, A/B testing—everything is free. You only pay for the SMS messages you send.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
