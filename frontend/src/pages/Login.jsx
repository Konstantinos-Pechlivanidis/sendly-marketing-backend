import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import Icon from '../components/ui/Icon';
import SEO from '../components/SEO';
import { API_URL } from '../utils/constants';
import { useToastContext } from '../contexts/ToastContext';

export default function Login() {
  const location = useLocation();
  const toast = useToastContext();
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for error from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    const stateError = location.state?.error;

    if (errorParam) {
      const errorMessage = decodeURIComponent(errorParam);
      setError(errorMessage);
      toast.error(errorMessage);
    } else if (stateError) {
      setError(stateError);
      toast.error(stateError);
    }
  }, [location, toast]);

  const handleLogin = (e) => {
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
    
    // Redirect to OAuth flow on backend
    // Backend will handle Shopify OAuth and redirect back to frontend /auth/callback
    window.location.href = `${API_URL}/auth/shopify?shop=${normalizedDomain}`;
  };

  return (
    <>
      <SEO
        title="Log In - Sendly SMS Marketing"
        description="Log in to your Sendly account to manage your SMS campaigns."
        path="/login"
      />
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <GlassCard variant="ice" className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-xl bg-ice-accent/20">
                  <Icon name="connect" size="xl" variant="ice" />
                </div>
              </div>
              <h1 className="text-h1 font-bold mb-2">Log In</h1>
              <p className="text-body text-border-subtle">
                Connect your Shopify store to access Sendly
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <GlassInput
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
              <p className="text-xs text-border-subtle -mt-4">
                Enter your Shopify store domain (e.g., your-store.myshopify.com)
              </p>

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

            <div className="mt-6 pt-6 border-t border-glass-border text-center">
              <p className="text-sm text-border-subtle mb-4">
                Don't have an account?
              </p>
              <GlassButton variant="ghost" size="md" as={Link} to="/install" className="w-full">
                Install Sendly
              </GlassButton>
            </div>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-ice-accent hover:text-ice-light hover:underline">
                ← Back to Home
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

