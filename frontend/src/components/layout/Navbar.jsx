import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlassButton from '../ui/GlassButton';

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

  const navLinks = [
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-gradient-to-r from-primary-dark/90 to-surface-dark/90 shadow-glass-lg'
          : 'bg-gradient-to-r from-primary-dark/85 to-surface-dark/85'
      } backdrop-blur-[20px] border-b border-glass-border`}
      style={{ height: '64px' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ice-accent flex items-center justify-center">
            <span className="text-primary-dark font-bold text-lg">S</span>
          </div>
          <span className="text-h3 font-semibold text-primary-light">Sendly</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-base font-medium transition-colors hover:text-ice-accent ${
                isActive(link.path)
                  ? 'text-ice-accent underline decoration-ice-accent underline-offset-4'
                  : 'text-primary-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <GlassButton variant="ghost" size="sm" as={Link} to="/login">
            Log in
          </GlassButton>
          <GlassButton variant="primary" size="sm" as={Link} to="/install">
            Install on Shopify
          </GlassButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-primary-light focus-ring rounded-md"
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
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 glass-dark backdrop-blur-[24px] z-40">
          <div className="flex flex-col p-8 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-xl font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-ice-accent'
                    : 'text-primary-light hover:text-ice-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-4">
              <GlassButton
                variant="ghost"
                size="md"
                className="w-full"
                as={Link}
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </GlassButton>
              <GlassButton
                variant="primary"
                size="md"
                className="w-full"
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
    </nav>
  );
}

