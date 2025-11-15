import { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassBadge from '../components/ui/GlassBadge';
import GlassInput from '../components/ui/GlassInput';
import GlassTextarea from '../components/ui/GlassTextarea';
import Icon from '../components/ui/Icon';
import { useToastContext } from '../contexts/ToastContext';
import SEO from '../components/SEO';
import { API_URL } from '../utils/constants';

export default function Contact() {
  const toast = useToastContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactMethods = [
    {
      icon: 'sms',
      title: 'Email Support',
      description: 'Get help with your account, technical issues, or general questions',
      contact: 'support@sendly.com',
      action: 'mailto:support@sendly.com?subject=Sendly Support Request',
      badge: '24/7',
      color: 'ice',
    },
    {
      icon: 'schedule',
      title: 'Book a Demo',
      description: 'Schedule a personalized demo to see how Sendly can grow your business',
      contact: 'Use the form below',
      action: '#contact-form',
      badge: 'Free',
      color: 'fuchsia',
      scroll: true,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/public/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      toast.success(data.data?.message || 'Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch (error) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact Us - Sendly SMS Marketing"
        description="Get in touch with the Sendly team. We're here to help you succeed with SMS marketing."
        path="/contact"
      />
      <div className="min-h-screen pt-24 pb-20 px-4 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-border-subtle max-w-2xl mx-auto">
              Have questions about Sendly? We're here to help. Reach out and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Contact Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-h2 font-bold mb-2">Quick Contact</h2>
                <p className="text-body text-border-subtle">
                  Choose the best way to reach us. We're here to help.
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                {contactMethods.map((method, index) => {
                  const handleClick = (e) => {
                    if (method.scroll) {
                      e.preventDefault();
                      const formElement = document.getElementById('contact-form');
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTimeout(() => {
                          const firstInput = formElement.querySelector('input, textarea');
                          if (firstInput) firstInput.focus();
                        }, 500);
                      }
                    }
                  };

                  return (
                  <GlassCard 
                    key={index} 
                    variant={method.color === 'fuchsia' ? 'fuchsia' : 'default'}
                    className="p-5 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-glass-lg" 
                    as="a" 
                    href={method.action} 
                    onClick={handleClick}
                    target={method.action.startsWith('mailto:') ? undefined : '_self'} 
                  >
                    {/* Hover gradient effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      method.color === 'fuchsia' 
                        ? 'bg-gradient-to-r from-zoom-fuchsia/10 to-transparent' 
                        : 'bg-gradient-to-r from-ice-accent/10 to-transparent'
                    }`} />
                    
                    <div className="relative flex items-center gap-4">
                      <div className={`p-3 rounded-xl flex-shrink-0 transition-all duration-300 ${
                        method.color === 'fuchsia'
                          ? 'bg-zoom-fuchsia/20 group-hover:bg-zoom-fuchsia/30'
                          : 'bg-ice-accent/20 group-hover:bg-ice-accent/30'
                      }`}>
                        <Icon name={method.icon} size="lg" variant={method.color} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-h3 font-semibold truncate">{method.title}</h3>
                          {method.badge && (
                            <GlassBadge variant={method.color === 'fuchsia' ? 'fuchsia' : 'ice'} className="text-xs">
                              {method.badge}
                            </GlassBadge>
                          )}
                        </div>
                        <p className="text-sm text-border-subtle mb-1 truncate">{method.description}</p>
                        <p className={`text-sm font-medium truncate ${
                          method.color === 'fuchsia' ? 'text-zoom-fuchsia' : 'text-ice-accent'
                        }`}>
                          {method.contact}
                        </p>
                      </div>
                      
                      <Icon 
                        name="arrowRight" 
                        size="sm" 
                        variant={method.color} 
                        className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" 
                      />
                    </div>
                  </GlassCard>
                  );
                })}
              </div>

              {/* Response Time Info */}
              <GlassCard variant="ice" className="p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-ice-accent/20 flex-shrink-0">
                    <Icon name="clock" size="md" variant="ice" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-semibold mb-1">Response Time</h3>
                    <p className="text-sm text-border-subtle">
                      We typically respond within <strong className="text-ice-accent">24 hours</strong> during business days. 
                      For urgent matters, use email support.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Office Info */}
              <GlassCard variant="dark" className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-ice-accent/20 flex-shrink-0">
                    <Icon name="integration" size="md" variant="ice" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-semibold mb-1">Sendly HQ</h3>
                    <p className="text-sm text-border-subtle">
                      We're a remote-first company, but you can always reach us online.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Contact Form */}
            <div id="contact-form">
              <GlassCard variant="ice" className="p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-ice-accent/20">
                      <Icon name="sms" size="md" variant="ice" />
                    </div>
                    <h2 className="text-h2 font-bold">Send Us a Message</h2>
                  </div>
                  <p className="text-sm text-border-subtle">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <GlassInput
                    label="Your Name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="John Doe"
                    required
                  />

                  <GlassInput
                    label="Your Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="john@example.com"
                    required
                  />

                  <GlassTextarea
                    label="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    error={errors.message}
                    rows={6}
                    placeholder="Tell us how we can help..."
                    required
                  />

                  <div className="pt-4">
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
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send Message
                          <Icon name="send" size="sm" variant="ice" className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </GlassButton>
                    <div className="pt-2">
                      <p className="text-xs text-center text-border-subtle mt-3">
                        By submitting this form, you agree to our{' '}
                        <Link to="/privacy" className="text-ice-accent hover:underline">Privacy Policy</Link>
                        {' '}and{' '}
                        <Link to="/terms" className="text-ice-accent hover:underline">Terms of Service</Link>.
                      </p>
                    </div>
                  </div>
                </form>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
