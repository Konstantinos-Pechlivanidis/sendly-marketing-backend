import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Icon from '../../components/ui/Icon';
import { API_URL, TOKEN_KEY, STORE_KEY } from '../../utils/constants';
import api from '../../services/api';

/**
 * Auth Callback Page
 * Handles OAuth callback from backend, saves token, and redirects to dashboard
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

        // Save token to localStorage
        localStorage.setItem(TOKEN_KEY, token);

        // Verify token and get store info
        try {
          // Set token temporarily for this request
          const response = await api.get('/auth/verify');
          
          if (response && response.store) {
            // Save store info
            localStorage.setItem(STORE_KEY, JSON.stringify(response.store));
            
            setStatus('success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
              navigate('/app/dashboard', { replace: true });
            }, 1500);
          } else {
            throw new Error('Invalid token response');
          }
        } catch (verifyError) {
          // Token verification failed
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(STORE_KEY);
          
          setStatus('error');
          setError(verifyError.message || 'Token verification failed');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { error: 'Authentication failed. Please try again.' } 
            });
          }, 3000);
        }
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

