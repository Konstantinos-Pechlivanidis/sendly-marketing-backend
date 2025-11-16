import { useState, useEffect, useMemo } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import GlassInput from '../../components/ui/GlassInput';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { useSettings, useAccountInfo, useUpdateSettings } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { useStoreInfo } from '../../hooks/useStoreInfo';
import SEO from '../../components/SEO';
import { TOKEN_KEY } from '../../utils/constants';
import { format } from 'date-fns';

export default function Settings() {
  const toast = useToastContext();
  const storeInfo = useStoreInfo();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    senderId: '',
    timezone: 'UTC',
    currency: 'EUR',
  });

  const { data: settingsData, isLoading: isLoadingSettings, error: settingsError } = useSettings();
  const { data: accountData, isLoading: isLoadingAccount, error: accountError } = useAccountInfo();
  const updateSettings = useUpdateSettings();

  // Normalize response data
  const settings = useMemo(() => settingsData?.data || settingsData || {}, [settingsData]);
  const account = accountData?.data || accountData || {};

  useEffect(() => {
    if (settings) {
      setFormData({
        senderId: settings.senderId || '',
        timezone: settings.timezone || 'UTC',
        currency: settings.currency || 'EUR',
      });
    }
  }, [settings]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate senderId if provided
    if (formData.senderId && formData.senderId.trim()) {
      const senderId = formData.senderId.trim();
      // Check if it's E.164 format (phone number) or alphanumeric (sender name)
      const isE164 = /^\+[1-9]\d{1,14}$/.test(senderId);
      const isAlphanumeric = /^[a-zA-Z0-9]{3,11}$/.test(senderId);
      
      if (!isE164 && !isAlphanumeric) {
        newErrors.senderId = 'Sender ID must be either a valid E.164 phone number (e.g., +1234567890) or 3-11 alphanumeric characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      // Check if anything has changed
      const hasChanges = 
        formData.senderId !== (settings?.senderId || '') ||
        formData.timezone !== (settings?.timezone || 'UTC') ||
        formData.currency !== (settings?.currency || 'EUR');

      if (!hasChanges) {
        toast.info('No changes to save');
        return;
      }

      // Prepare update data
      const updateData = {};
      if (formData.senderId !== (settings?.senderId || '')) {
        updateData.senderId = formData.senderId;
      }
      if (formData.timezone !== (settings?.timezone || 'UTC')) {
        updateData.timezone = formData.timezone;
      }
      if (formData.currency !== (settings?.currency || 'EUR')) {
        updateData.currency = formData.currency;
      }

      await updateSettings.mutateAsync(updateData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error?.message || 'Failed to save settings');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'sms', label: 'SMS Settings', icon: 'sms' },
    { id: 'integrations', label: 'Integrations', icon: 'integration' },
    { id: 'account', label: 'Account', icon: 'personal' },
  ];

  // Loading state
  const isInitialLoad = (isLoadingSettings && !settingsData) || (isLoadingAccount && !accountData);
  const hasError = settingsError || accountError;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading settings..." />;
  }

  return (
    <>
      <SEO
        title="Settings - Sendly SMS Marketing"
        description="Manage your account and SMS settings"
        path="/app/settings"
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <PageHeader
            title="Settings"
            subtitle="Manage your account and SMS settings"
          />

          {/* Error State */}
          {hasError && (
            <ErrorState
              title="Error Loading Settings"
              message={settingsError?.message || accountError?.message || 'Failed to load settings. Please try refreshing the page.'}
              onAction={() => window.location.reload()}
              actionLabel="Refresh Page"
            />
          )}

          {!hasError && (
            <>
              {/* Tabs - Horizontal on mobile, vertical on desktop */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2 lg:hidden">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 min-h-[44px]
                        ${activeTab === tab.id
                          ? 'bg-ice-primary text-primary-dark shadow-glow-ice'
                          : 'bg-neutral-surface-secondary text-neutral-text-primary hover:bg-neutral-surface-primary hover:text-ice-primary'
                        }
                      `}
                      aria-label={`View ${tab.label} settings`}
                    >
                      <Icon name={tab.icon} size="sm" variant={activeTab === tab.id ? 'default' : 'default'} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                  <GlassCard className="p-0 overflow-hidden">
                    <nav className="space-y-1 p-2 sm:p-3">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all focus-ring min-h-[44px] ${
                            activeTab === tab.id
                              ? 'bg-ice-soft text-ice-primary shadow-sm border border-ice-primary/20'
                              : 'text-neutral-text-primary hover:bg-neutral-surface-secondary hover:text-ice-primary'
                          }`}
                          aria-label={tab.label}
                          aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                          <Icon name={tab.icon} size="md" variant={activeTab === tab.id ? 'ice' : 'default'} />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                  </GlassCard>
                </div>
              </div>

              {/* Content */}
              <div className="lg:grid lg:grid-cols-4 lg:gap-6">
                {/* Desktop: Content takes 3 columns, Sidebar is separate */}
                <div className="lg:col-span-3">
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <GlassCard className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="settings" size="md" variant="ice" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-text-primary">General Settings</h2>
                          <p className="text-sm text-neutral-text-secondary mt-1">Configure your store preferences</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Sender ID */}
                        <div>
                          <GlassInput
                            label="Sender ID / Name"
                            name="senderId"
                            value={formData.senderId}
                            onChange={handleChange}
                            onBlur={() => {
                              // Validate on blur
                              if (formData.senderId && formData.senderId.trim()) {
                                const senderId = formData.senderId.trim();
                                const isE164 = /^\+[1-9]\d{1,14}$/.test(senderId);
                                const isAlphanumeric = /^[a-zA-Z0-9]{3,11}$/.test(senderId);
                                if (!isE164 && !isAlphanumeric) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    senderId: 'Sender ID must be either a valid E.164 phone number (e.g., +1234567890) or 3-11 alphanumeric characters',
                                  }));
                                } else {
                                  setErrors((prev) => ({ ...prev, senderId: '' }));
                                }
                              }
                            }}
                            placeholder="Your Store Name or +1234567890"
                            error={errors.senderId}
                            helperText="Use a phone number (E.164 format) or 3-11 character alphanumeric name"
                          />
                        </div>

                        {/* Timezone & Currency Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <GlassSelectCustom
                            label="Default Timezone"
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            options={[
                              { value: 'UTC', label: 'UTC' },
                              { value: 'America/New_York', label: 'Eastern Time' },
                              { value: 'America/Chicago', label: 'Central Time' },
                              { value: 'America/Denver', label: 'Mountain Time' },
                              { value: 'America/Los_Angeles', label: 'Pacific Time' },
                              { value: 'Europe/London', label: 'London' },
                              { value: 'Europe/Paris', label: 'Paris' },
                              { value: 'Europe/Athens', label: 'Athens' },
                              { value: 'Asia/Tokyo', label: 'Tokyo' },
                            ]}
                          />
                          <GlassSelectCustom
                            label="Currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            options={[
                              { value: 'EUR', label: 'EUR (€)' },
                              { value: 'USD', label: 'USD ($)' },
                            ]}
                          />
                        </div>

                        {/* Store Information */}
                        {storeInfo && (
                          <div className="pt-4">
                            <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                              Store Information
                            </label>
                            <GlassCard variant="ice" className="p-4 border border-ice-primary/20">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-neutral-text-secondary">Store Name</span>
                                  <span className="text-sm font-medium text-neutral-text-primary">
                                    {storeInfo.shopName || storeInfo.shopDomain || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-neutral-text-secondary">Domain</span>
                                  <span className="text-sm font-medium text-neutral-text-primary">
                                    {storeInfo.shopDomain || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t border-neutral-border/60">
                          <GlassButton 
                            variant="primary" 
                            size="lg" 
                            onClick={handleSave}
                            disabled={updateSettings.isPending}
                            className="min-w-[140px] min-h-[44px]"
                          >
                            {updateSettings.isPending ? (
                              <span className="flex items-center gap-2">
                                <Icon name="check" size="sm" variant="ice" />
                                Saving...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Icon name="check" size="sm" variant="ice" />
                                Save Changes
                              </span>
                            )}
                          </GlassButton>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* SMS Settings */}
                  {activeTab === 'sms' && (
                    <GlassCard className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="sms" size="md" variant="ice" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-text-primary">SMS Settings</h2>
                          <p className="text-sm text-neutral-text-secondary mt-1">Configure your SMS messaging preferences</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <GlassCard variant="ice" className="p-4 sm:p-6 border border-ice-primary/20">
                          <div className="flex items-start gap-3">
                            <Icon name="info" size="md" variant="ice" className="flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-base font-semibold text-neutral-text-primary mb-2">Sender Configuration</h3>
                              <p className="text-sm text-neutral-text-secondary">
                                SMS settings are managed through the General tab. Use the Sender ID field to set your SMS sender number or name. 
                                This will be used for all campaigns and automations.
                              </p>
                            </div>
                          </div>
                        </GlassCard>

                        {settings.senderId && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                              Current Sender ID
                            </label>
                            <GlassCard className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-medium text-neutral-text-primary">
                                  {settings.senderId}
                                </span>
                                <StatusBadge status="active" />
                              </div>
                            </GlassCard>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )}

                  {/* Integrations */}
                  {activeTab === 'integrations' && (
                    <GlassCard className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="integration" size="md" variant="ice" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-text-primary">Integrations</h2>
                          <p className="text-sm text-neutral-text-secondary mt-1">Manage your third-party integrations</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Shopify Connection */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                            Shopify Connection
                          </label>
                          <GlassCard className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-neutral-surface-secondary">
                                  <Icon name="integration" size="md" variant="ice" />
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-neutral-text-primary">
                                    {storeInfo?.shopName || storeInfo?.shopDomain || 'Not connected'}
                                  </p>
                                  <p className="text-xs text-neutral-text-secondary mt-0.5">
                                    {storeInfo ? 'Connected' : 'Not connected'}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge status={storeInfo ? 'active' : 'pending'} />
                            </div>
                            {storeInfo?.shopDomain && (
                              <div className="pt-4 border-t border-neutral-border/60">
                                <p className="text-xs text-neutral-text-secondary mb-2">Shop Domain</p>
                                <code className="text-sm text-neutral-text-primary font-mono break-all">
                                  {storeInfo.shopDomain}
                                </code>
                              </div>
                            )}
                          </GlassCard>
                        </div>

                        {/* Webhook URL */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                            Webhook URL
                          </label>
                          <GlassCard className="p-4 sm:p-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Icon name="webhook" size="md" variant="ice" className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-neutral-text-secondary mb-2">Use this URL in your Shopify webhook settings</p>
                                  <code className="block text-sm text-neutral-text-primary break-all font-mono bg-neutral-surface-secondary p-3 rounded-lg border border-neutral-border/60">
                                    {window.location.origin}/webhooks/shopify
                                  </code>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/webhooks/shopify`);
                                  toast.success('Webhook URL copied to clipboard');
                                }}
                                className="flex items-center gap-2 text-sm text-ice-primary hover:text-ice-primary/80 transition-colors"
                              >
                                <Icon name="copy" size="sm" variant="ice" />
                                Copy URL
                              </button>
                            </div>
                          </GlassCard>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Account */}
                  {activeTab === 'account' && (
                    <GlassCard className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-ice-soft/80">
                          <Icon name="personal" size="md" variant="ice" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-text-primary">Account Information</h2>
                          <p className="text-sm text-neutral-text-secondary mt-1">View your account details and usage statistics</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Account Details */}
                        {storeInfo && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                              Store Details
                            </label>
                            <GlassCard className="p-4 sm:p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-neutral-text-secondary mb-1">Store Name</p>
                                  <p className="text-sm font-medium text-neutral-text-primary">
                                    {storeInfo.shopName || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-neutral-text-secondary mb-1">Domain</p>
                                  <p className="text-sm font-medium text-neutral-text-primary">
                                    {storeInfo.shopDomain || 'N/A'}
                                  </p>
                                </div>
                                {account?.account?.createdAt && (
                                  <div>
                                    <p className="text-xs text-neutral-text-secondary mb-1">Created</p>
                                    <p className="text-sm font-medium text-neutral-text-primary">
                                      {format(new Date(account.account.createdAt), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                                {settings?.credits !== undefined && (
                                  <div>
                                    <p className="text-xs text-neutral-text-secondary mb-1">Credits</p>
                                    <p className="text-sm font-medium text-ice-primary">
                                      {settings.credits?.toLocaleString() || 0}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </GlassCard>
                          </div>
                        )}

                        {/* Usage Statistics */}
                        {account?.usage && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                              Usage Statistics
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                              <GlassCard variant="ice" className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name="personal" size="sm" variant="ice" />
                                  <p className="text-xs text-neutral-text-secondary">Contacts</p>
                                </div>
                                <p className="text-xl font-bold text-neutral-text-primary">
                                  {(account.usage.totalContacts || 0).toLocaleString()}
                                </p>
                              </GlassCard>
                              <GlassCard className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name="campaign" size="sm" variant="ice" />
                                  <p className="text-xs text-neutral-text-secondary">Campaigns</p>
                                </div>
                                <p className="text-xl font-bold text-neutral-text-primary">
                                  {(account.usage.totalCampaigns || 0).toLocaleString()}
                                </p>
                              </GlassCard>
                              <GlassCard className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name="automation" size="sm" variant="ice" />
                                  <p className="text-xs text-neutral-text-secondary">Automations</p>
                                </div>
                                <p className="text-xl font-bold text-neutral-text-primary">
                                  {(account.usage.totalAutomations || 0).toLocaleString()}
                                </p>
                              </GlassCard>
                              <GlassCard className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name="send" size="sm" variant="ice" />
                                  <p className="text-xs text-neutral-text-secondary">Messages</p>
                                </div>
                                <p className="text-xl font-bold text-neutral-text-primary">
                                  {(account.usage.totalMessages || 0).toLocaleString()}
                                </p>
                              </GlassCard>
                            </div>
                          </div>
                        )}

                        {/* API Token */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-text-secondary mb-3">
                            API Token
                          </label>
                          <GlassCard className="p-4 sm:p-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Icon name="settings" size="md" variant="ice" className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-neutral-text-secondary mb-2">Your API token is stored securely</p>
                                  <code className="block text-sm text-neutral-text-primary break-all font-mono bg-neutral-surface-secondary p-3 rounded-lg border border-neutral-border/60">
                                    {localStorage.getItem(TOKEN_KEY) ? '••••••••••••••••' : 'No token'}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </GlassCard>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
