import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassBadge from '../components/ui/GlassBadge';
import GradientText from '../components/ui/GradientText';
import Icon from '../components/ui/Icon';
import IPhonePreviewWithDiscount from '../components/iphone/IPhonePreviewWithDiscount';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function Landing() {
  const features = [
    {
      icon: 'sms',
      title: 'Send SMS Campaigns',
      description: 'Reach customers instantly with targeted SMS messages that convert.',
    },
    {
      icon: 'automation',
      title: 'Automate Workflows',
      description: 'Set up automated messages for abandoned carts, orders, and more.',
    },
    {
      icon: 'analytics',
      title: 'Track Results',
      description: 'See delivery rates, opens, and conversions in real-time.',
    },
  ];

  const results = [
    {
      number: '98%',
      label: 'Open Rate',
      description: 'SMS messages are read within minutes',
    },
    {
      number: '10x',
      label: 'Better ROI',
      description: 'Compared to email marketing',
    },
    {
      number: '3 min',
      label: 'Average Read Time',
      description: 'Customers read SMS instantly',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sendly',
    applicationCategory: 'MarketingApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free 14-day trial',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
    },
  };

  return (
    <>
      <SEO
        title="SMS Marketing for Shopify - Sendly"
        description="Grow your store with SMS marketing that converts. Free 14-day trial, 98% open rates, 24/7 support."
        path="/"
      />
      <StructuredData data={structuredData} />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-4 lg:px-8 overflow-hidden">
          {/* Background gradient with blobs */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-surface-dark to-bg-dark">
            <div className="absolute top-20 right-20 w-96 h-96 bg-ice-accent/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-zoom-fuchsia/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <GlassBadge variant="ice" className="mb-6 inline-flex items-center gap-2">
                <Icon name="sms" size="sm" variant="ice" />
                <span>SMS Marketing for Shopify</span>
              </GlassBadge>
              
              <h1 className="text-hero md:text-7xl font-bold mb-6 leading-tight">
                <span className="block mb-2">Turn Your Shopify Store Into</span>
                <GradientText>A Sales Machine</GradientText>
              </h1>
              
              <p className="text-xl md:text-2xl text-border-subtle max-w-3xl mx-auto mb-4 leading-relaxed">
                <strong className="text-primary-light">Sendly</strong> helps Shopify stores 
                <span className="text-ice-accent"> reach customers instantly</span>, 
                <span className="text-zoom-fuchsia"> drive more sales</span>, and 
                <span className="text-ice-accent"> grow faster</span> with SMS marketing.
              </p>

              <p className="text-lg text-border-subtle max-w-2xl mx-auto mb-10">
                Connect with customers where they spend most of their time—their phones. 
                98% open rates. Instant delivery. Better conversions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <GlassButton variant="primary" size="lg" as={Link} to="/install" className="group">
                  <span className="flex items-center gap-2">
                    Install on Shopify
                    <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </GlassButton>
                <GlassButton variant="ghost" size="lg" as={Link} to="/how-it-works">
                  How it works
                </GlassButton>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm text-border-subtle">
                <div className="flex items-center gap-2">
                  <Icon name="check" size="sm" variant="ice" />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zoom-fuchsia font-bold">98%</span>
                  <span>open rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check" size="sm" variant="ice" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* iPhone Preview with Discount Code */}
            <div className="mt-20">
              <GlassCard variant="dark" className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-h2 font-bold mb-3">See It In Action</h3>
                  <p className="text-body text-border-subtle max-w-2xl mx-auto">
                    Here's how your SMS campaigns will look to customers. Real-time preview with discount codes and unsubscribe links included.
                  </p>
                </div>
                <div className="flex justify-center">
                  <IPhonePreviewWithDiscount
                    message="Hi {{first_name}}! Get 20% off your next order with code {{discount_code}}. Shop now at yourstore.com\n\nReply STOP to unsubscribe"
                    discountCode="SUMMER20"
                    firstName="Sarah"
                    unsubscribeToken="demo-token-123"
                  />
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-20 px-4 lg:px-8 bg-surface-dark/30">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-h1 font-bold mb-4">Why SMS Marketing Works</h2>
              <p className="text-lg text-border-subtle max-w-2xl mx-auto">
                SMS delivers results that email can't match. Here's what you can expect.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {results.map((result, index) => (
                <GlassCard key={index} className="text-center p-8">
                  <div className="text-5xl font-bold text-zoom-fuchsia mb-3">{result.number}</div>
                  <h3 className="text-h3 font-semibold mb-2">{result.label}</h3>
                  <p className="text-body text-border-subtle">{result.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 lg:px-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-h1 font-bold mb-4">Everything You Need</h2>
              <p className="text-lg text-border-subtle max-w-2xl mx-auto">
                Powerful features to help you create, send, and track SMS campaigns that convert.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <GlassCard key={index} className="p-8 text-center group">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-xl bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors">
                      <Icon name={feature.icon} size="xl" variant="ice" />
                    </div>
                  </div>
                  <h3 className="text-h2 font-semibold mb-3">{feature.title}</h3>
                  <p className="text-body text-border-subtle leading-relaxed">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Simple 3 Steps */}
        <section className="py-20 px-4 lg:px-8 bg-surface-dark/30">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-h1 font-bold mb-4">Get Started in 3 Steps</h2>
              <p className="text-lg text-border-subtle max-w-2xl mx-auto">
                Start sending SMS campaigns in minutes. No technical knowledge required.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <GlassCard className="text-center p-8">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-lg shadow-glow-ice">
                  1
                </div>
                <div className="mt-4 mb-6 flex justify-center">
                  <div className="p-4 rounded-xl bg-ice-accent/20">
                    <Icon name="connect" size="xl" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h2 font-semibold mb-3">Install & Connect</h3>
                <p className="text-body text-border-subtle leading-relaxed">
                  Install Sendly from Shopify App Store. Connect your store in one click.
                </p>
              </GlassCard>

              <GlassCard className="text-center p-8">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-lg shadow-glow-ice">
                  2
                </div>
                <div className="mt-4 mb-6 flex justify-center">
                  <div className="p-4 rounded-xl bg-ice-accent/20">
                    <Icon name="campaign" size="xl" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h2 font-semibold mb-3">Create Campaign</h3>
                <p className="text-body text-border-subtle leading-relaxed">
                  Write your message, preview it on iPhone, and add discount codes.
                </p>
              </GlassCard>

              <GlassCard className="text-center p-8">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-lg shadow-glow-ice">
                  3
                </div>
                <div className="mt-4 mb-6 flex justify-center">
                  <div className="p-4 rounded-xl bg-ice-accent/20">
                    <Icon name="send" size="xl" variant="ice" />
                  </div>
                </div>
                <h3 className="text-h2 font-semibold mb-3">Send & Track</h3>
                <p className="text-body text-border-subtle leading-relaxed">
                  Send immediately or schedule for later. Track opens and conversions.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* GDPR Compliance Section */}
        <section className="py-20 px-4 lg:px-8">
          <div className="max-w-[1200px] mx-auto">
            <GlassCard variant="ice" className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="p-4 rounded-xl bg-ice-accent/20">
                    <Icon name="compliance" size="xl" variant="ice" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon name="check" size="md" variant="ice" />
                    <h2 className="text-h1 font-bold">GDPR Compliant</h2>
                  </div>
                  <p className="text-xl text-border-subtle mb-6 leading-relaxed">
                    Sendly is fully compliant with GDPR and all international data protection regulations. 
                    Your customers' data is secure, and you can market with confidence.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Icon name="check" size="sm" variant="ice" className="mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary-light mb-1">Opt-in Management</h4>
                        <p className="text-sm text-border-subtle">Customers must explicitly consent to receive SMS messages</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="check" size="sm" variant="ice" className="mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary-light mb-1">Easy Unsubscribe</h4>
                        <p className="text-sm text-border-subtle">One-click unsubscribe in every message</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="check" size="sm" variant="ice" className="mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary-light mb-1">Data Protection</h4>
                        <p className="text-sm text-border-subtle">All customer data is encrypted and securely stored</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="check" size="sm" variant="ice" className="mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary-light mb-1">Compliance Reporting</h4>
                        <p className="text-sm text-border-subtle">Track consent and opt-out rates automatically</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Social Proof / Metrics */}
        <section className="py-20 px-4 lg:px-8 bg-surface-dark/30">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-zoom-fuchsia mb-2">10K+</div>
                <p className="text-body text-border-subtle">Active Stores</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-zoom-fuchsia mb-2">50M+</div>
                <p className="text-body text-border-subtle">Messages Sent</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-zoom-fuchsia mb-2">98%</div>
                <p className="text-body text-border-subtle">Average Open Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-b from-surface-dark to-bg-dark">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-h1 font-bold mb-4">Ready to Grow Your Store?</h2>
            <p className="text-xl text-border-subtle mb-8 leading-relaxed">
              Join thousands of stores using Sendly to increase sales with SMS marketing.
            </p>
            <GlassButton variant="primary" size="lg" as={Link} to="/install" className="group">
              <span className="flex items-center gap-2">
                Start Free Trial
                <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
              </span>
            </GlassButton>
            <p className="text-sm text-border-subtle mt-4">No credit card required • 14-day free trial</p>
          </div>
        </section>
      </div>
    </>
  );
}
