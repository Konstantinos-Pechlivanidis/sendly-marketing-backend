import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Icon from '../ui/Icon';
import { TOKEN_KEY, STORE_KEY } from '../../utils/constants';
import { useStoreInfo } from '../../hooks/useStoreInfo';

/**
 * App Layout Component
 * Sidebar navigation for logged-in users
 * Desktop: Fixed sidebar on left
 * Mobile: Hamburger menu overlay
 */
export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const storeInfo = useStoreInfo();

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
    navigate('/login', { replace: true });
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/app/campaigns', label: 'Campaigns', icon: 'campaign' },
    { path: '/app/contacts', label: 'Contacts', icon: 'segment' },
    { path: '/app/automations', label: 'Automations', icon: 'automation' },
    { path: '/app/templates', label: 'Templates', icon: 'template' },
    { path: '/app/reports', label: 'Reports', icon: 'report' },
    { path: '/app/billing', label: 'Billing', icon: 'sms' },
    { path: '/app/settings', label: 'Settings', icon: 'integration' },
  ];

  const isActive = (path) => {
    if (path === '/app/dashboard') {
      return location.pathname === '/app/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-bg-base flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-30">
        <div className="flex-1 flex flex-col bg-neutral-surface-primary backdrop-blur-[24px] border-r border-neutral-border/60 shadow-glass-light">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-neutral-border/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ice-primary to-ice-deep flex items-center justify-center shadow-glow-ice-light">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-neutral-text-primary tracking-tight">Sendly</span>
          </div>

          {/* Store Info */}
          {storeInfo && (
            <div className="px-6 py-4 border-b border-neutral-border/60 bg-neutral-surface-secondary/50">
              <p className="text-xs font-medium text-neutral-text-secondary mb-1.5 uppercase tracking-wider">Store</p>
              <p className="text-sm font-semibold text-neutral-text-primary truncate">
                {storeInfo.shopName || storeInfo.shopDomain}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus-ring ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-ice-soft/80 to-ice-soft/40 text-ice-deep shadow-glow-ice-light border-l-4 border-ice-primary'
                    : 'text-neutral-text-primary hover:bg-neutral-surface-secondary hover:text-ice-primary'
                }`}
              >
                <Icon 
                  name={item.icon} 
                  size="md" 
                  variant={isActive(item.path) ? 'ice' : 'default'} 
                  className={isActive(item.path) ? 'text-ice-primary' : ''}
                  aria-hidden="true" 
                />
                <span className={`text-sm ${isActive(item.path) ? 'font-semibold text-ice-deep' : 'font-medium'}`}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-neutral-border/60">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
              aria-label="Log out"
            >
              <span className="flex items-center gap-3">
                <Icon name="logout" size="md" variant="default" aria-hidden="true" />
                <span>Log out</span>
              </span>
            </GlassButton>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-neutral-surface-primary backdrop-blur-[24px] border border-neutral-border/60 shadow-glass-light text-neutral-text-primary focus-ring hover:shadow-glass-light-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
          <span
            className={`block h-0.5 w-6 bg-current transition-all ${
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-all ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-all ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-text-primary/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-72 bg-neutral-surface-primary backdrop-blur-[24px] border-r border-neutral-border/60 shadow-glass-light-lg flex flex-col transform transition-transform duration-300 ease-out animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Logo */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ice-primary to-ice-deep flex items-center justify-center shadow-glow-ice-light" aria-hidden="true">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold text-neutral-text-primary tracking-tight">Sendly</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-ring"
                aria-label="Close menu"
              >
                <Icon name="arrowRight" size="md" className="rotate-180" />
              </button>
            </div>

            {/* Store Info */}
            {storeInfo && (
              <div className="px-6 py-4 border-b border-neutral-border/60 bg-neutral-surface-secondary/50">
                <p className="text-xs font-medium text-neutral-text-secondary mb-1.5 uppercase tracking-wider">Store</p>
                <p className="text-sm font-semibold text-neutral-text-primary truncate">
                  {storeInfo.shopName || storeInfo.shopDomain}
                </p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus-ring min-h-[44px] ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-ice-soft/80 to-ice-soft/40 text-ice-deep shadow-glow-ice-light border-l-4 border-ice-primary'
                      : 'text-neutral-text-primary hover:bg-neutral-surface-secondary hover:text-ice-primary'
                  }`}
                >
                  <Icon 
                    name={item.icon} 
                    size="md" 
                    variant={isActive(item.path) ? 'ice' : 'default'} 
                    className={isActive(item.path) ? 'text-ice-primary' : ''}
                    aria-hidden="true" 
                  />
                  <span className={`text-sm ${isActive(item.path) ? 'font-semibold text-ice-deep' : 'font-medium'}`}>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-neutral-border/60">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
                aria-label="Log out"
              >
                <span className="flex items-center gap-3">
                  <Icon name="logout" size="md" variant="default" aria-hidden="true" />
                  <span>Log out</span>
                </span>
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 bg-neutral-bg-base">
        <div className="min-h-screen">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

