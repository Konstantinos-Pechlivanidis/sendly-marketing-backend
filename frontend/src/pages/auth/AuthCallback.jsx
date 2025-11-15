import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Icon from '../../components/ui/Icon';
import { API_URL, TOKEN_KEY, STORE_KEY } from '../../utils/constants';
import api from '../../services/api';

/**
 * Auth Callback Page
 * 
 * OAuth Flow:
 * 1. User clicks "Log in" → Frontend redirects to Backend /auth/shopify
 * 2. Backend redirects to Shopify OAuth page
 * 3. Shopify redirects back to Backend /auth/callback (configured in Shopify Partners)
 * 4. Backend processes OAuth and redirects to Frontend /auth/callback?token=...
 * 5. This page saves the token and redirects to dashboard
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        // Handle error from backend
        if (errorParam) {
          setStatus('error');
          setError(decodeURIComponent(errorParam));
          setTimeout(() => {
            navigate('/login', { state: { error: errorParam } });
          }, 3000);
          return;
        }

        // Check if token exists
        if (!token) {
          setStatus('error');
          setError('No token received from authentication server');
          setTimeout(() => {
            navigate('/login', { state: { error: 'No token received' } });
          }, 3000);
          return;
        }

        // Save token to localStorage first
        localStorage.setItem(TOKEN_KEY, token);

        // Try to decode token to get basic info (JWT structure: header.payload.signature)
        let storeInfo = null;
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            // Extract store info from token payload
            if (payload.storeId && payload.shopDomain) {
              storeInfo = {
                id: payload.storeId,
                shopDomain: payload.shopDomain,
              };
              // Save basic store info from token
              localStorage.setItem(STORE_KEY, JSON.stringify(storeInfo));
            }
          }
        } catch (decodeError) {
          console.warn('Could not decode token:', decodeError);
        }

        // Try to verify token and get full store info from backend
        try {
          const response = await api.get('/auth/verify');
          
          if (response && response.store) {
            // Save full store info from backend
            localStorage.setItem(STORE_KEY, JSON.stringify(response.store));
            storeInfo = response.store;
          }
        } catch (verifyError) {
          // If verify fails but we have basic info from token, continue anyway
          // The token will be validated on the next API call
          if (!storeInfo) {
            // No store info at all - this is a problem
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(STORE_KEY);
            
            setStatus('error');
            setError('Token verification failed. Please try logging in again.');
            
            setTimeout(() => {
              navigate('/login', { 
                replace: true,
                state: { error: 'Token verification failed. Please try again.' } 
              });
            }, 2000);
            return;
          }
          // We have basic info from token, continue with redirect
          console.warn('Token verify failed, but using token payload info:', verifyError);
        }

        // Success - redirect to dashboard
        setStatus('success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/app/dashboard', { replace: true });
        }, 1500);
      } catch (err) {
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { error: 'Authentication failed. Please try again.' } 
          });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <GlassCard variant="ice" className="p-8 md:p-12 text-center max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h1 className="text-h2 font-bold mb-4">Completing Authentication</h1>
            <p className="text-body text-border-subtle">
              Please wait while we verify your connection...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-xl bg-ice-accent/20">
                <Icon name="check" size="xl" variant="ice" />
              </div>
            </div>
            <h1 className="text-h2 font-bold mb-4 text-ice-accent">Successfully Connected!</h1>
            <p className="text-body text-border-subtle mb-6">
              Your Shopify store has been connected. Redirecting to dashboard...
            </p>
            <LoadingSpinner size="md" />
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-xl bg-red-500/20">
                <Icon name="error" size="xl" variant="ice" />
              </div>
            </div>
            <h1 className="text-h2 font-bold mb-4 text-red-400">Authentication Failed</h1>
            <p className="text-body text-border-subtle mb-6">
              {error || 'An error occurred during authentication'}
            </p>
            <p className="text-sm text-border-subtle">
              Redirecting to login page...
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}

