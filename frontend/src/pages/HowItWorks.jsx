import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Icon from '../components/ui/Icon';
import IPhonePreviewWithDiscount from '../components/iphone/IPhonePreviewWithDiscount';
import SEO from '../components/SEO';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      icon: 'connect',
      title: 'Install & Connect',
      description: 'Install Sendly from the Shopify App Store. Connect your store in one click—takes less than 2 minutes.',
    },
    {
      number: '2',
      icon: 'campaign',
      title: 'Create Your First Campaign',
      description: 'Write your message, preview it on iPhone, add discount codes. See exactly how it will look to customers.',
    },
    {
      number: '3',
      icon: 'send',
      title: 'Send & Track Results',
      description: 'Send immediately or schedule for later. Track opens, deliveries, and conversions in real-time.',
    },
  ];

  const automations = [
    {
      icon: 'workflow',
      title: 'Abandoned Cart Recovery',
      description: 'Automatically send SMS when customers leave items in cart.',
      trigger: 'Cart abandoned for 1 hour',
    },
    {
      icon: 'sms',
      title: 'Order Confirmation',
      description: 'Send order confirmation with tracking information.',
      trigger: 'New order placed',
    },
    {
      icon: 'send',
      title: 'Shipping Updates',
      description: 'Notify customers when their order ships.',
      trigger: 'Order fulfilled',
    },
    {
      icon: 'personal',
      title: 'Birthday Messages',
      description: 'Send personalized birthday wishes with discount codes.',
      trigger: 'Customer birthday',
    },
  ];

  return (
    <>
      <SEO
        title="How It Works - Sendly SMS Marketing"
        description="Get started with Sendly in minutes. Simple 3-step process to start sending SMS campaigns."
        path="/how-it-works"
      />
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">How It Works</h1>
            <p className="text-xl text-border-subtle max-w-2xl mx-auto">
              Get started with SMS marketing in 3 simple steps. No technical knowledge required.
            </p>
          </div>

          {/* 3-Step Process */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <GlassCard key={index} className="text-center p-8 relative">
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-ice-accent text-primary-dark flex items-center justify-center font-bold text-lg shadow-glow-ice">
                    {step.number}
                  </div>
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="p-4 rounded-xl bg-ice-accent/20">
                      <Icon name={step.icon} size="xl" variant="ice" />
                    </div>
                  </div>
                  <h3 className="text-h2 font-semibold mb-3">{step.title}</h3>
                  <p className="text-body text-border-subtle leading-relaxed">{step.description}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Live Preview Section */}
          <section className="mb-20">
            <GlassCard variant="dark" className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-h2 font-bold mb-3">See It In Action</h2>
                <p className="text-body text-border-subtle max-w-2xl mx-auto">
                  Here's how your SMS campaigns will look to customers. Real-time preview with discount codes and unsubscribe links.
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
          </section>

          {/* Automation Examples */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-bold mb-4">Automation Examples</h2>
              <p className="text-lg text-border-subtle max-w-2xl mx-auto">
                Set up automated SMS flows that work 24/7. Here are some examples.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automations.map((automation, index) => (
                <GlassCard key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-ice-accent/20 flex-shrink-0">
                      <Icon name={automation.icon} size="lg" variant="ice" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs text-ice-accent font-medium">{automation.trigger}</span>
                      </div>
                      <h3 className="text-h3 font-semibold mb-2">{automation.title}</h3>
                      <p className="text-body text-border-subtle">{automation.description}</p>
                    </div>
                  </div>
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
                Join thousands of stores using Sendly to grow their business with SMS marketing.
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
