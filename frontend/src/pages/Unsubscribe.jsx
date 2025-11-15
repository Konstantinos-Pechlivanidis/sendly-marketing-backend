import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassBadge from '../components/ui/GlassBadge';
import GradientText from '../components/ui/GradientText';
import Icon from '../components/ui/Icon';
import SEO from '../components/SEO';
import { API_URL } from '../utils/constants';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';

export default function Unsubscribe() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchUnsubscribeInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/unsubscribe/${token}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load unsubscribe page');
        }

        if (result.success && result.data) {
          setData(result.data);
          
          // If already unsubscribed, show success state
          if (result.data.contact.smsConsent === 'opted_out') {
            setUnsubscribed(true);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err.message || 'Failed to load unsubscribe page');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUnsubscribeInfo();
    } else {
      setError('Invalid unsubscribe link');
      setLoading(false);
    }
  }, [token]);

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/unsubscribe/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to unsubscribe');
      }

      if (result.success) {
        setUnsubscribed(true);
      } else {
        throw new Error(result.message || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError(err.message || 'Failed to unsubscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: 'sms',
      title: 'Exclusive Offers',
      description: 'Get first access to sales, discounts, and special promotions.',
    },
    {
      icon: 'target',
      title: 'Personalized Deals',
      description: 'Receive offers tailored to your preferences and shopping history.',
    },
    {
      icon: 'schedule',
      title: 'Early Access',
      description: 'Be the first to know about new products and limited-time deals.',
    },
    {
      icon: 'analytics',
      title: 'Order Updates',
      description: 'Stay informed about your orders, shipping, and delivery status.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <LoadingState size="lg" message="Loading..." />
      </div>
    );
  }

  if (error && !data) {
    return (
      <>
        <SEO
          title="Unsubscribe - Sendly"
          description="Unsubscribe from SMS messages"
          path="/unsubscribe"
        />
        <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4">
          <ErrorState
            title="Unable to Load Unsubscribe Page"
            message={error}
            actionLabel="Go to Home"
            onAction={() => navigate('/')}
          />
        </div>
      </>
    );
  }

  const shopName = data?.shop?.shopName || 'this store';

  return (
    <>
      <SEO
        title={`Unsubscribe from ${shopName} - Sendly`}
        description={`Manage your SMS preferences for ${shopName}`}
        path="/unsubscribe"
      />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-36 pb-24 px-4 lg:px-8 overflow-hidden">
          {/* Background gradient with blobs */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-surface-dark to-bg-dark">
            <div className="absolute top-20 right-20 w-96 h-96 bg-ice-accent/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-zoom-fuchsia/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative max-w-[1000px] mx-auto">
            {unsubscribed ? (
              <div className="text-center">
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-ice-accent/20 flex items-center justify-center">
                    <Icon name="check" size="xl" variant="ice" className="text-ice-accent" />
                  </div>
                </div>
                <h1 className="text-hero md:text-6xl font-bold mb-6 leading-tight">
                  <GradientText>You're Unsubscribed</GradientText>
                </h1>
                <p className="text-xl md:text-2xl text-border-subtle max-w-2xl mx-auto mb-8 leading-relaxed">
                  You have been successfully unsubscribed from SMS messages from <strong className="text-primary-light">{shopName}</strong>.
                </p>
                <p className="text-lg text-border-subtle max-w-xl mx-auto mb-10">
                  You will no longer receive promotional SMS messages. If you change your mind, you can always opt back in by contacting the store directly.
                </p>
                <GlassButton variant="primary" size="lg" onClick={() => navigate('/')}>
                  <span className="flex items-center gap-2">
                    Return to Home
                    <Icon name="arrowRight" size="sm" />
                  </span>
                </GlassButton>
              </div>
            ) : (
              <div className="text-center mb-16">
                <GlassBadge variant="ice" className="mb-6 inline-flex items-center gap-2">
                  <Icon name="sms" size="sm" variant="ice" />
                  <span>Manage SMS Preferences</span>
                </GlassBadge>
                
                <h1 className="text-hero md:text-6xl font-bold mb-6 leading-tight">
                  <span className="block mb-2">Stay Connected with</span>
                  <GradientText>{shopName}</GradientText>
                </h1>
                
                <p className="text-xl md:text-2xl text-border-subtle max-w-3xl mx-auto mb-4 leading-relaxed">
                  Before you go, here's what you'll miss:
                </p>
              </div>
            )}
          </div>
        </section>

        {!unsubscribed && (
          <>
            {/* Benefits Section */}
            <section className="py-20 px-4 lg:px-8 bg-surface-dark/30">
              <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {benefits.map((benefit, index) => (
                    <GlassCard key={index} className="p-6 hover:shadow-glass-light-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-ice-accent/20 flex-shrink-0">
                          <Icon name={benefit.icon} size="lg" variant="ice" />
                        </div>
                        <div>
                          <h3 className="text-h2 font-semibold mb-2 text-primary-light">{benefit.title}</h3>
                          <p className="text-body text-border-subtle leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>

                {/* Value Proposition */}
                <GlassCard variant="ice" className="p-8 md:p-12 mb-12">
                  <div className="text-center mb-8">
                    <h2 className="text-h1 font-bold mb-4">Why Stay Subscribed?</h2>
                    <p className="text-lg text-border-subtle max-w-2xl mx-auto">
                      SMS messages have a 98% open rate and deliver instant value. Don't miss out on exclusive deals and important updates.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-ice-accent mb-2">98%</div>
                      <p className="text-sm text-border-subtle">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-ice-accent mb-2">3 min</div>
                      <p className="text-sm text-border-subtle">Average Read Time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-ice-accent mb-2">10x</div>
                      <p className="text-sm text-border-subtle">Better ROI</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Unsubscribe Action */}
                <div className="text-center">
                  <GlassCard className="p-8 md:p-12">
                    <div className="mb-8">
                      <h2 className="text-h1 font-bold mb-4">Still Want to Unsubscribe?</h2>
                      <p className="text-lg text-border-subtle max-w-2xl mx-auto mb-6">
                        We're sorry to see you go. You can unsubscribe at any time, and you can always opt back in later.
                      </p>
                      {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <GlassButton
                        variant="primary"
                        size="lg"
                        onClick={handleUnsubscribe}
                        disabled={submitting}
                        className="bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400"
                      >
                        <span className="flex items-center gap-2">
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              Unsubscribing...
                            </>
                          ) : (
                            <>
                              <Icon name="delete" size="sm" />
                              Unsubscribe from SMS
                            </>
                          )}
                        </span>
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="lg"
                        onClick={() => navigate('/')}
                      >
                        <span className="flex items-center gap-2">
                          <Icon name="arrowRight" size="sm" />
                          Stay Subscribed
                        </span>
                      </GlassButton>
                    </div>
                    
                    <p className="mt-6 text-sm text-border-subtle">
                      Your phone number: <span className="text-primary-light font-medium">{data?.contact?.phoneE164 || '***'}</span>
                    </p>
                  </GlassCard>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

