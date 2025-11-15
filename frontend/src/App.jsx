import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
const Campaigns = lazy(() => import('./pages/app/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/app/CampaignDetail'));
const CampaignCreate = lazy(() => import('./pages/app/CampaignCreate'));
const Contacts = lazy(() => import('./pages/app/Contacts'));
const ContactDetail = lazy(() => import('./pages/app/ContactDetail'));
const Automations = lazy(() => import('./pages/app/Automations'));
const AutomationForm = lazy(() => import('./pages/app/AutomationForm'));
const Templates = lazy(() => import('./pages/app/Templates'));
const Reports = lazy(() => import('./pages/app/Reports'));
const CampaignReports = lazy(() => import('./pages/app/CampaignReports'));
const Billing = lazy(() => import('./pages/app/Billing'));
const Settings = lazy(() => import('./pages/app/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create a client with optimized retry logic and caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus - use cached data
      refetchOnMount: false, // Use cached data if fresh - don't refetch on mount
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 1 time for network errors and 5xx errors (reduced from 2)
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s delay (reduced from 30s)
      staleTime: 2 * 60 * 1000, // 2 minutes default (reduced from 5 minutes for faster updates)
      gcTime: 10 * 60 * 1000, // 10 minutes default cache time (React Query v5)
      placeholderData: (previousData) => previousData, // Show cached data while fetching by default
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

// Scroll to top on route change with smooth animation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  return null;
}

// Loading component with iOS 26 style
// Detects if we're on an app route and uses light mode accordingly
function Loading() {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${isAppRoute ? 'bg-neutral-bg-base' : 'bg-bg-dark'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`w-12 h-12 border-2 ${isAppRoute ? 'border-ice-primary/40 border-t-ice-primary' : 'border-ice-accent/30 border-t-ice-accent'} rounded-full animate-spin`}
             style={{ animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
             role="status"
             aria-label="Loading" />
        <p className={`text-sm ${isAppRoute ? 'text-neutral-text-secondary' : 'text-primary-light'}`}>Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const toast = useToastContext();
  const location = useLocation();
  
  // Check if current route is an app route
  const isAppRoute = location.pathname.startsWith('/app');
  
  // Apply light mode class to body for logged-in pages
  useEffect(() => {
    if (isAppRoute) {
      document.body.classList.add('app-light-mode');
    } else {
      document.body.classList.remove('app-light-mode');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('app-light-mode');
    };
  }, [isAppRoute]);

  return (
    <>
      <ScrollToTop />
      {!isAppRoute && <Navbar />}
      <Suspense fallback={<Loading />}>
        <div className="page-enter">
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
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Campaigns />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/campaigns/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignCreate />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/campaigns/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/campaigns/:id/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignCreate />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/contacts"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Contacts />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/contacts/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContactDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/contacts/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContactDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/contacts/:id/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContactDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/automations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Automations />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/automations/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AutomationForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/automations/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AutomationForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/templates"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Templates />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports/campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/billing"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Billing />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Suspense>
      {!isAppRoute && <Footer />}
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

