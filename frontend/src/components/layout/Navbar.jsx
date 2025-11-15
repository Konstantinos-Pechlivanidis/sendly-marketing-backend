import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlassButton from '../ui/GlassButton';
import Icon from '../ui/Icon';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const navLinks = [
    { path: '/features', label: 'Features', icon: 'target' },
    { path: '/pricing', label: 'Pricing', icon: 'sms' },
    { path: '/how-it-works', label: 'How It Works', icon: 'automation' },
    { path: '/contact', label: 'Contact', icon: 'segment' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-gradient-to-r from-primary-dark/95 via-surface-dark/95 to-primary-dark/95 shadow-glass-lg border-b border-glass-border/50'
            : 'bg-gradient-to-r from-primary-dark/80 via-surface-dark/80 to-primary-dark/80 border-b border-glass-border/30'
        } backdrop-blur-[30px] -webkit-backdrop-blur-[30px]`}
        style={{ height: '72px' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group transition-transform hover:scale-105"
            aria-label="Sendly Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ice-accent to-ice-dark flex items-center justify-center shadow-glow-ice transition-all group-hover:shadow-glow-ice-lg">
              <span className="text-primary-dark font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-primary-light tracking-tight">Sendly</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-ice-accent bg-ice-accent/10 shadow-glow-ice'
                    : 'text-primary-light/90 hover:text-ice-accent hover:bg-ice-accent/5'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ice-accent" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <GlassButton 
              variant="ghost" 
              size="sm" 
              as={Link} 
              to="/login"
              className="text-primary-light/90 hover:text-ice-accent"
            >
              Log in
            </GlassButton>
            <GlassButton 
              variant="primary" 
              size="sm" 
              as={Link} 
              to="/install"
              className="bg-gradient-to-r from-ice-accent to-ice-dark hover:from-ice-light hover:to-ice-accent shadow-glow-ice hover:shadow-glow-ice-lg"
            >
              Install on Shopify
            </GlassButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2.5 rounded-xl text-primary-light focus-ring transition-all hover:bg-ice-accent/10 hover:text-ice-accent min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-surface-dark/98 via-surface-mid/98 to-surface-dark/98 backdrop-blur-[40px] -webkit-backdrop-blur-[40px] border-l border-glass-border/50 shadow-glass-lg flex flex-col transform transition-transform duration-300 ease-out"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-glass-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ice-accent to-ice-dark flex items-center justify-center shadow-glow-ice">
                  <span className="text-primary-dark font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-primary-light tracking-tight">Sendly</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-ice-accent/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-ring text-primary-light hover:text-ice-accent"
                aria-label="Close menu"
              >
                <Icon name="arrowRight" size="md" className="rotate-180" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[52px] ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-ice-accent/20 to-ice-dark/20 text-ice-accent shadow-glow-ice border-l-4 border-ice-accent'
                      : 'text-primary-light/90 hover:bg-ice-accent/10 hover:text-ice-accent'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon 
                    name={link.icon} 
                    size="md" 
                    variant={isActive(link.path) ? 'ice' : 'default'}
                    className={isActive(link.path) ? 'text-ice-accent' : 'text-primary-light/70'}
                  />
                  <span className={`text-base font-medium ${isActive(link.path) ? 'font-semibold' : ''}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="px-4 py-6 space-y-3 border-t border-glass-border/30">
              <GlassButton
                variant="ghost"
                size="md"
                className="w-full justify-center text-primary-light/90 hover:text-ice-accent"
                as={Link}
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </GlassButton>
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center bg-gradient-to-r from-ice-accent to-ice-dark hover:from-ice-light hover:to-ice-accent shadow-glow-ice hover:shadow-glow-ice-lg"
                as={Link}
                to="/install"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Install on Shopify
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

