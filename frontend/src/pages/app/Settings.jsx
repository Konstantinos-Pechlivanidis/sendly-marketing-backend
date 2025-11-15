import { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import GlassInput from '../../components/ui/GlassInput';
import GlassTextarea from '../../components/ui/GlassTextarea';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { useSettings, useAccountInfo, useUpdateSettings } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { useStoreInfo } from '../../hooks/useStoreInfo';
import SEO from '../../components/SEO';
import { TOKEN_KEY } from '../../utils/constants';

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

  useEffect(() => {
    if (settingsData) {
      setFormData({
        senderId: settingsData.senderId || '',
        timezone: settingsData.timezone || 'UTC',
        currency: settingsData.currency || 'EUR',
      });
    }
  }, [settingsData]);

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
        formData.senderId !== (settingsData?.senderId || '') ||
        formData.timezone !== (settingsData?.timezone || 'UTC') ||
        formData.currency !== (settingsData?.currency || 'EUR');

      if (!hasChanges) {
        toast.info('No changes to save');
        return;
      }

      // Prepare update data
      const updateData = {};
      if (formData.senderId !== (settingsData?.senderId || '')) {
        updateData.senderId = formData.senderId;
      }
      if (formData.timezone !== (settingsData?.timezone || 'UTC')) {
        updateData.timezone = formData.timezone;
      }
      if (formData.currency !== (settingsData?.currency || 'EUR')) {
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

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = (isLoadingSettings && !settingsData) || (isLoadingAccount && !accountData);
  const hasError = settingsError || accountError;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg-base">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Settings - Sendly SMS Marketing"
        description="Manage your account settings"
        path="/app/settings"
      />
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 bg-neutral-bg-base">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
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

          {/* Content */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeTab === 'general' && (
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-neutral-text-primary">General Settings</h2>
                  <div className="space-y-4 sm:space-y-6">
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
                    />
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
                        { value: 'GBP', label: 'GBP (£)' },
                        { value: 'JPY', label: 'JPY (¥)' },
                      ]}
                    />
                {storeInfo && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
                      Store Information
                    </label>
                    <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                      <p className="text-sm text-neutral-text-primary">
                        <strong>Store:</strong> {storeInfo.shopName || storeInfo.shopDomain}
                      </p>
                      <p className="text-sm text-neutral-text-primary mt-1">
                        <strong>Domain:</strong> {storeInfo.shopDomain}
                      </p>
                    </div>
                  </div>
                )}
                    <div className="flex justify-end pt-4">
                      <GlassButton 
                        variant="primary" 
                        size="lg" 
                        onClick={handleSave}
                        disabled={updateSettings.isPending}
                      >
                        {updateSettings.isPending ? (
                          <span className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              )}

            {/* SMS Settings */}
            {activeTab === 'sms' && (
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-neutral-text-primary">SMS Settings</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                    <p className="text-sm text-neutral-text-primary">
                      SMS settings are managed through the General tab. Use the Sender ID field to set your SMS sender number or name.
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-neutral-text-primary">Integrations</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
                      Shopify Connection
                    </label>
                    <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-text-primary">
                            {storeInfo?.shopName || storeInfo?.shopDomain || 'Not connected'}
                          </p>
                          <p className="text-xs text-neutral-text-secondary mt-1">
                            {storeInfo ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                        <StatusBadge status={storeInfo ? 'active' : 'pending'} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
                      Webhook URL
                    </label>
                    <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                      <code className="text-sm text-neutral-text-primary break-all font-mono">
                        {window.location.origin}/webhooks/shopify
                      </code>
                      <p className="text-xs text-neutral-text-secondary mt-2">
                        Use this URL in your Shopify webhook settings
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-neutral-text-primary">Account</h2>
                <div className="space-y-4 sm:space-y-6">
                  {storeInfo && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
                        Store Details
                      </label>
                      <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border space-y-2">
                        <div>
                          <span className="text-xs text-neutral-text-secondary">Store Name:</span>
                          <p className="text-sm text-neutral-text-primary font-medium">{storeInfo.shopName || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-text-secondary">Domain:</span>
                          <p className="text-sm text-neutral-text-primary font-medium">{storeInfo.shopDomain || 'N/A'}</p>
                        </div>
                        {accountData && (
                          <>
                            {accountData.email && (
                              <div>
                                <span className="text-xs text-neutral-text-secondary">Email:</span>
                                <p className="text-sm text-neutral-text-primary font-medium">{accountData.email}</p>
                              </div>
                            )}
                            {accountData.createdAt && (
                              <div>
                                <span className="text-xs text-neutral-text-secondary">Created:</span>
                                <p className="text-sm text-neutral-text-primary font-medium">
                                  {new Date(accountData.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
                      API Token
                    </label>
                    <div className="p-4 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                      <code className="text-sm text-neutral-text-primary break-all font-mono">
                        {localStorage.getItem(TOKEN_KEY) ? '••••••••••••••••' : 'No token'}
                      </code>
                      <p className="text-xs text-neutral-text-secondary mt-2">
                        Your API token is stored securely
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
        )}
      </div>
    </>
  );
}

