import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ui/ToastContainer';
import { ToastProvider, useToastContext } from './contexts/ToastContext';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Install = lazy(() => import('./pages/Install'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const CampaignCreate = lazy(() => import('./pages/app/CampaignCreate'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create a client with retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for network errors and 5xx errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for network/server errors
        return failureCount < 1;
      },
    },
  },
});

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Loading component
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-ice-accent animate-pulse">Loading...</div>
    </div>
  );
}

function AppRoutes() {
  const toast = useToastContext();

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/install" element={<Install />} />
              <Route path="/login" element={<Login />} />
              
              {/* Auth Routes */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected App Routes */}
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/campaigns/new" element={<CampaignCreate />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
      </Suspense>
      <Footer />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ToastProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

