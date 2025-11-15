import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassBadge from '../components/ui/GlassBadge';
import GlassButton from '../components/ui/GlassButton';
import Icon from '../components/ui/Icon';
import SEO from '../components/SEO';

export default function Features() {
  const coreFeatures = [
    {
      icon: 'campaign',
      title: 'Campaign Builder',
      description: 'Create SMS campaigns with real-time iPhone preview. See exactly how your message will look before sending.',
      highlight: 'Real-time preview',
    },
    {
      icon: 'segment',
      title: 'Audience Segmentation',
      description: 'Target specific customer groups. Send personalized messages to the right people at the right time.',
      highlight: 'Smart targeting',
    },
    {
      icon: 'workflow',
      title: 'Automation Workflows',
      description: 'Set up automated SMS flows that work 24/7. Recover abandoned carts, confirm orders, and more.',
      highlight: '24/7 automation',
      badge: 'New',
    },
    {
      icon: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Track delivery rates, opens, and conversions in real-time. Make data-driven decisions.',
      highlight: 'Real-time tracking',
    },
    {
      icon: 'integration',
      title: 'Shopify Integration',
      description: 'Seamlessly sync with your Shopify store. Customer data, orders, and products—all automatic.',
      highlight: 'One-click sync',
    },
    {
      icon: 'template',
      title: 'Message Templates',
      description: 'Use pre-built templates or create your own. Save time and stay consistent with your brand.',
      highlight: '50+ templates',
    },
  ];

  const advancedFeatures = [
    {
      icon: 'schedule',
      title: 'Scheduling',
      description: 'Schedule campaigns for optimal send times. Set it and forget it.',
    },
    {
      icon: 'test',
      title: 'A/B Testing',
      description: 'Test different messages to find what works best for your audience.',
      badge: 'Pro',
    },
    {
      icon: 'compliance',
      title: 'GDPR Compliant',
      description: 'Full compliance with GDPR and international data protection regulations.',
    },
    {
      icon: 'link',
      title: 'Link Shortening',
      description: 'Track clicks with built-in link shortening and analytics.',
    },
    {
      icon: 'import',
      title: 'Bulk Import',
      description: 'Import contacts from CSV files. Fast, easy, and validated.',
    },
    {
      icon: 'webhook',
      title: 'Webhook Integration',
      description: 'Connect Sendly with your favorite tools via webhooks.',
    },
  ];

  return (
    <>
      <SEO
        title="Features - Sendly SMS Marketing"
        description="Powerful features to help you create, send, and track SMS campaigns that convert."
        path="/features"
      />
      <div className="min-h-screen pt-24 pb-20 px-4 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Features</h1>
            <p className="text-xl text-border-subtle max-w-2xl mx-auto">
              Everything you need to create, send, and track SMS campaigns that drive results.
            </p>
          </div>

          {/* Core Features */}
          <section className="mb-20">
            <h2 className="text-h2 font-bold text-center mb-12">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <GlassCard key={index} className="p-6 group relative">
                  {feature.badge && (
                    <div className="absolute top-4 right-4">
                      <GlassBadge variant="ice">{feature.badge}</GlassBadge>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors flex-shrink-0">
                      <Icon name={feature.icon} size="lg" variant="ice" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h3 font-semibold pr-12">{feature.title}</h3>
                      <p className="text-xs text-zoom-fuchsia font-medium mt-1">{feature.highlight}</p>
                    </div>
                  </div>
                  <p className="text-body text-border-subtle leading-relaxed">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Advanced Features */}
          <section className="mb-20">
            <h2 className="text-h2 font-bold text-center mb-4">Advanced Features</h2>
            <p className="text-center text-border-subtle mb-12 max-w-2xl mx-auto">
              Additional tools to help you scale and optimize your SMS marketing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advancedFeatures.map((feature, index) => (
                <GlassCard key={index} className="p-6 group relative">
                  {feature.badge && (
                    <div className="absolute top-4 right-4">
                      <GlassBadge variant={feature.badge === 'Pro' ? 'fuchsia' : 'ice'}>
                        {feature.badge}
                      </GlassBadge>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-ice-accent/20 group-hover:bg-ice-accent/30 transition-colors">
                      <Icon name={feature.icon} size="md" variant="ice" />
                    </div>
                    <h3 className="text-h3 font-semibold pr-12">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-border-subtle leading-relaxed">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <GlassCard variant="ice" className="max-w-2xl mx-auto p-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-xl bg-ice-accent/20">
                  <Icon name="growth" size="xl" variant="ice" />
                </div>
              </div>
              <h2 className="text-h2 font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-body text-border-subtle mb-6">
                Start using these features today with a free 14-day trial. No credit card required.
              </p>
              <GlassButton variant="primary" size="lg" as={Link} to="/install" className="group">
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
            </GlassCard>
          </section>
        </div>
      </div>
    </>
  );
}
