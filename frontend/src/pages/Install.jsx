import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import Icon from '../components/ui/Icon';
import SEO from '../components/SEO';
import { API_URL } from '../utils/constants';

export default function Install() {
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOAuthInstall = (e) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      setError('Please enter your Shopify store domain.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    const normalizedDomain = shopDomain.includes('.myshopify.com')
      ? shopDomain
      : `${shopDomain}.myshopify.com`;
    
    // Redirect to OAuth flow
    window.location.href = `${API_URL}/auth/shopify?shop=${normalizedDomain}`;
  };

  const handleAppStoreInstall = () => {
    // Redirect to Shopify App Store
    const shopifyAppStoreUrl = import.meta.env.VITE_SHOPIFY_APP_STORE_URL || 
      'https://apps.shopify.com/sendly-sms-marketing';
    
    window.open(shopifyAppStoreUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <SEO
        title="Install Sendly - SMS Marketing for Shopify"
        description="Install Sendly on your Shopify store. Free 14-day trial. No credit card required."
        path="/install"
      />
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-[800px] mx-auto">
          <GlassCard variant="ice" className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-xl bg-ice-accent/20">
                <Icon name="connect" size="2xl" variant="ice" />
              </div>
            </div>
            
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Install Sendly</h1>
            <p className="text-xl text-border-subtle mb-8">
              Get started with SMS marketing for your Shopify store in minutes.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4 text-left">
                <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold mb-1">Free 14-Day Trial</h3>
                  <p className="text-body text-border-subtle">Try all features free for 14 days. No credit card required.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 text-left">
                <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold mb-1">One-Click Installation</h3>
                  <p className="text-body text-border-subtle">Install from Shopify App Store. Connect your store automatically.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 text-left">
                <Icon name="check" size="md" variant="ice" className="flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold mb-1">All Features Included</h3>
                  <p className="text-body text-border-subtle">Campaign builder, automations, analytics—everything is free. Pay only for SMS credits.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <GlassButton variant="primary" size="lg" onClick={handleAppStoreInstall} className="group">
                <span className="flex items-center gap-2">
                  Install from Shopify App Store
                  <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                </span>
              </GlassButton>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-dark text-border-subtle">Or</span>
              </div>
            </div>

            <div>
              <h2 className="text-h2 font-bold mb-2">Install via OAuth</h2>
              <p className="text-body text-border-subtle mb-6">
                Enter your Shopify store domain to connect directly via OAuth.
              </p>
              
              <form onSubmit={handleOAuthInstall} className="space-y-4">
                <GlassInput
                  label="Shopify Store Domain"
                  name="shop"
                  type="text"
                  value={shopDomain}
                  onChange={(e) => {
                    setShopDomain(e.target.value);
                    if (error) setError('');
                  }}
                  error={error}
                  placeholder="your-store.myshopify.com"
                  required
                />
                <GlassButton 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-full group"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="clock" size="sm" variant="ice" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Connect Store
                      <Icon name="arrowRight" size="sm" className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </GlassButton>
              </form>
            </div>

            <div className="mt-8 pt-8 border-t border-glass-border">
              <Link to="/" className="text-ice-accent hover:text-ice-light hover:underline">
                ← Back to Home
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

