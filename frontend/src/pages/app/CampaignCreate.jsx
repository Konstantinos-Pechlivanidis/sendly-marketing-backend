import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassTextarea from '../../components/ui/GlassTextarea';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import GlassDateTimePicker from '../../components/ui/GlassDateTimePicker';
import Icon from '../../components/ui/Icon';
import BackButton from '../../components/ui/BackButton';
import PageHeader from '../../components/ui/PageHeader';
import IPhonePreviewWithDiscount from '../../components/iphone/IPhonePreviewWithDiscount';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  useCreateCampaign, 
  useUpdateCampaign, 
  useSendCampaign,
  useScheduleCampaign,
  useCampaign,
  useAudiences,
  useDiscounts,
  useSettings,
} from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { countSMSCharacters } from '../../utils/smsParser';
import { normalizeArrayResponse } from '../../utils/apiHelpers';
import { format } from 'date-fns';
import SEO from '../../components/SEO';
import { convertShopTimeToUTC, convertUTCToShopTime } from '../../utils/timezone';

export default function CampaignCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const sendCampaign = useSendCampaign();
  const scheduleCampaign = useScheduleCampaign();
  const { data: existingCampaign, isLoading: isLoadingCampaign } = useCampaign(id);
  const { data: audiencesData } = useAudiences();
  const { data: discountsData } = useDiscounts();
  const { data: settingsData } = useSettings();
  const toast = useToastContext();
  
  // Get shop timezone from settings
  const settings = useMemo(() => settingsData?.data || settingsData || {}, [settingsData]);
  const shopTimezone = settings.timezone || 'UTC';
  
  // Check for template from Templates page
  const templateFromState = location.state?.template;

  // Close placeholder menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isPlaceholderMenuOpen && !event.target.closest('.placeholder-menu-container')) {
        setIsPlaceholderMenuOpen(false);
      }
    };
    if (isPlaceholderMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPlaceholderMenuOpen]);
  
  const [formData, setFormData] = useState({
    name: templateFromState?.name || '',
    message: templateFromState?.message || '',
    audience: 'all',
    scheduleType: 'immediate',
    scheduleAt: '',
    discountId: null,
    senderId: '',
  });
  const [isPlaceholderMenuOpen, setIsPlaceholderMenuOpen] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isScheduled, setIsScheduled] = useState(false);

  // Load existing campaign data if editing
  useEffect(() => {
    if (isEditMode && existingCampaign) {
      // Check if campaign can be edited
      const canEdit = existingCampaign.status === 'draft' || existingCampaign.status === 'scheduled';
      
      if (!canEdit) {
        toast.error('This campaign cannot be edited. Only draft and scheduled campaigns can be modified.');
        navigate('/app/campaigns');
        return;
      }
      
      const scheduleType = existingCampaign.scheduleType || 'immediate';
      const isScheduledCampaign = scheduleType === 'scheduled';
      
      setFormData({
        name: existingCampaign.name || '',
        message: existingCampaign.message || '',
        audience: existingCampaign.audience || 'all',
        scheduleType: scheduleType,
        scheduleAt: existingCampaign.scheduleAt ? new Date(existingCampaign.scheduleAt).toISOString() : '',
        discountId: existingCampaign.discountId || null,
        senderId: existingCampaign.senderId || '',
      });
      setIsScheduled(isScheduledCampaign);
    }
  }, [isEditMode, existingCampaign, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleScheduleToggle = () => {
    setIsScheduled(!isScheduled);
    if (!isScheduled) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setFormData((prev) => ({
        ...prev,
        scheduleType: 'scheduled',
        scheduleAt: tomorrow.toISOString(),
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        scheduleType: 'immediate',
        scheduleAt: '' 
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 1600) {
      newErrors.message = 'Message is too long (max 1600 characters)';
    }
    
    if (isScheduled) {
      if (!formData.scheduleAt || formData.scheduleAt.trim() === '') {
        newErrors.scheduleAt = 'Scheduled date and time is required';
      } else {
        try {
          const scheduleDate = new Date(formData.scheduleAt);
          if (isNaN(scheduleDate.getTime())) {
            newErrors.scheduleAt = 'Invalid date and time format';
          } else {
            const now = new Date();
            // Allow 1 minute buffer for scheduling
            const minScheduleTime = new Date(now.getTime() + 60 * 1000);
            if (scheduleDate <= minScheduleTime) {
              newErrors.scheduleAt = 'Schedule date must be at least 1 minute in the future';
            }
          }
        } catch (error) {
          newErrors.scheduleAt = 'Invalid date and time format';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    
    try {
      const campaignData = {
        name: formData.name.trim(),
        message: formData.message.trim(),
        audience: formData.audience,
        scheduleType: isScheduled ? 'scheduled' : 'immediate', // Preserve scheduleType
        discountId: formData.discountId || null,
        senderId: formData.senderId || undefined,
      };
      
      // Include scheduleAt if scheduled (convert to UTC using shop timezone)
      if (isScheduled && formData.scheduleAt) {
        campaignData.scheduleAt = convertShopTimeToUTC(formData.scheduleAt, shopTimezone);
      }
      
      let result;
      if (isEditMode) {
        result = await updateCampaign.mutateAsync({ id, ...campaignData });
      } else {
        result = await createCampaign.mutateAsync(campaignData);
      }
      
      if (result?.id) {
        toast.success(`Campaign ${isEditMode ? 'updated' : 'saved'} as draft successfully`);
        navigate('/app/campaigns');
      }
    } catch (error) {
      toast.error(error?.message || `Failed to ${isEditMode ? 'update' : 'save'} campaign draft. Please try again.`);
    }
  };

  const handleSend = async () => {
    if (!validate()) return;
    
    try {
      const campaignData = {
        name: formData.name.trim(),
        message: formData.message.trim(),
        audience: formData.audience,
        scheduleType: isScheduled ? 'scheduled' : 'immediate',
        discountId: formData.discountId || null,
        senderId: formData.senderId || undefined,
      };
      
      let result;
      if (isEditMode) {
        // For edit mode, update the campaign first
        result = await updateCampaign.mutateAsync({ id, ...campaignData });
        
        // If scheduled, use the schedule endpoint to properly set status
        if (isScheduled && formData.scheduleAt) {
          try {
            // Convert scheduled time from shop's timezone to UTC
            // The date picker gives us an ISO string, but we interpret the user's selection
            // as being in the shop's timezone, then convert to UTC for the backend
            const scheduleAtUTC = convertShopTimeToUTC(formData.scheduleAt, shopTimezone);
            
            await scheduleCampaign.mutateAsync({
              id,
              scheduleType: 'scheduled',
              scheduleAt: scheduleAtUTC,
            });
            toast.success('Campaign scheduled successfully!');
            setTimeout(() => navigate('/app/campaigns'), 1500);
            return;
          } catch (scheduleError) {
            toast.error(scheduleError?.message || 'Failed to schedule campaign');
            return;
          }
        } else if (!isScheduled && result?.id) {
          // For immediate send in edit mode, send the campaign
          try {
            await sendCampaign.mutateAsync(result.id);
            toast.success('Campaign queued for sending!');
          } catch (sendError) {
            toast.warning('Campaign updated but failed to send. You can send it manually from the campaigns list.');
          }
          setTimeout(() => navigate('/app/campaigns'), 1500);
          return;
        }
      } else {
        // For new campaigns
        if (isScheduled && formData.scheduleAt) {
          // Convert scheduled time from shop's timezone to UTC
          // The date picker gives us an ISO string, but we interpret the user's selection
          // as being in the shop's timezone, then convert to UTC for the backend
          const scheduleAtUTC = convertShopTimeToUTC(formData.scheduleAt, shopTimezone);
          campaignData.scheduleAt = scheduleAtUTC;
          result = await createCampaign.mutateAsync(campaignData);
          
          // Use schedule endpoint to properly set status to 'scheduled'
          if (result?.id) {
            try {
              await scheduleCampaign.mutateAsync({
                id: result.id,
                scheduleType: 'scheduled',
                scheduleAt: scheduleAtUTC,
              });
              toast.success('Campaign scheduled successfully!');
            } catch (scheduleError) {
              toast.warning('Campaign created but failed to schedule. You can schedule it manually from the campaigns list.');
            }
          }
        } else {
          // Create and send immediately
          result = await createCampaign.mutateAsync(campaignData);
          
          if (result?.id) {
            try {
              await sendCampaign.mutateAsync(result.id);
              toast.success('Campaign created and queued for sending!');
            } catch (sendError) {
              toast.warning('Campaign created but failed to send. You can send it manually from the campaigns list.');
            }
          }
        }
      }
      
      if (result?.id) {
        setTimeout(() => navigate('/app/campaigns'), 1500);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to create campaign. Please check your inputs and try again.');
    }
  };

  // Prepare audience options
  const audienceOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'All Contacts' },
    ];
    
    if (audiencesData) {
      const audiences = normalizeArrayResponse(audiencesData, 'audiences');
      audiences.forEach((audience) => {
        options.push({
          value: audience.id || audience.name,
          label: audience.name || audience.id,
        });
      });
    }
    
    return options;
  }, [audiencesData]);

  // Prepare discount options
  const discountOptions = useMemo(() => {
    const options = [
      { value: '', label: 'No Discount Code' },
    ];
    
    if (discountsData) {
      const discounts = normalizeArrayResponse(discountsData, 'discounts');
      discounts.forEach((discount) => {
        options.push({
          value: discount.id,
          label: `${discount.code || discount.name}${discount.value ? ` (${discount.value}${discount.type === 'percentage' ? '%' : ''})` : ''}`,
        });
      });
    }
    
    return options;
  }, [discountsData]);

  // Calculate SMS info
  const smsInfo = useMemo(() => {
    return countSMSCharacters(formData.message);
  }, [formData.message]);

  // Get selected discount code for preview
  const selectedDiscount = useMemo(() => {
    if (!formData.discountId || !discountsData) return 'DISCOUNT20';
    const discounts = Array.isArray(discountsData) ? discountsData : discountsData.discounts || [];
    const discount = discounts.find((d) => d.id === formData.discountId);
    return discount?.code || 'DISCOUNT20';
  }, [formData.discountId, discountsData]);

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = isEditMode && isLoadingCampaign && !existingCampaign;

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
        title={isEditMode ? 'Edit Campaign' : 'Create Campaign - Sendly SMS Marketing'}
        description="Create a new SMS campaign and preview it in real-time"
        path={isEditMode ? `/app/campaigns/${id}/edit` : '/app/campaigns/new'}
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BackButton to="/app/campaigns" label="Back" />
            </div>
            <PageHeader
              title={isEditMode ? 'Edit Campaign' : 'Create Campaign'}
              subtitle={
                isEditMode 
                  ? 'Update your SMS campaign and preview it in real-time'
                  : 'Create a new SMS campaign and preview it in real-time'
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Campaign Form */}
            <div>
              <GlassCard>
                <div className="space-y-6">
                  <GlassInput
                    label="Campaign Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Summer Sale Campaign"
                    required
                  />

                  <GlassSelectCustom
                    label="Audience / Segment"
                    name="audience"
                    value={formData.audience}
                    onChange={handleChange}
                    options={audienceOptions}
                    searchable={audienceOptions.length > 5}
                  />

                  {settingsData?.senderId && (
                    <GlassSelectCustom
                      label="Sender ID"
                      name="senderId"
                      value={formData.senderId}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'Default' },
                        { value: settingsData.senderId, label: settingsData.senderId },
                      ]}
                    />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="message" className="block text-sm font-medium text-neutral-text-primary">
                        Message
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative placeholder-menu-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPlaceholderMenuOpen(!isPlaceholderMenuOpen);
                          }}
                          className="px-3 py-1.5 text-sm rounded-lg bg-neutral-surface-secondary border border-neutral-border/60 hover:border-neutral-border hover:bg-neutral-surface-primary transition-colors flex items-center gap-1.5 text-neutral-text-secondary hover:text-neutral-text-primary"
                        >
                          <span>+</span>
                          <span>Insert variable</span>
                        </button>
                        {isPlaceholderMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl bg-neutral-surface-primary backdrop-blur-[24px] border border-neutral-border/60 shadow-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const textarea = document.getElementById('message');
                                const start = textarea.selectionStart || formData.message.length;
                                const end = textarea.selectionEnd || formData.message.length;
                                const placeholder = '{{first_name}}';
                                const newMessage = 
                                  formData.message.substring(0, start) + 
                                  placeholder + 
                                  formData.message.substring(end);
                                setFormData(prev => ({ ...prev, message: newMessage }));
                                setIsPlaceholderMenuOpen(false);
                                setTimeout(() => {
                                  textarea.focus();
                                  const newPosition = start + placeholder.length;
                                  textarea.setSelectionRange(newPosition, newPosition);
                                }, 10);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-neutral-text-primary hover:bg-neutral-surface-secondary transition-colors border-b border-neutral-border/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-neutral-surface-secondary px-2 py-1 rounded">{'{{first_name}}'}</span>
                                <span>First Name</span>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const textarea = document.getElementById('message');
                                const start = textarea.selectionStart || formData.message.length;
                                const end = textarea.selectionEnd || formData.message.length;
                                const placeholder = '{{last_name}}';
                                const newMessage = 
                                  formData.message.substring(0, start) + 
                                  placeholder + 
                                  formData.message.substring(end);
                                setFormData(prev => ({ ...prev, message: newMessage }));
                                setIsPlaceholderMenuOpen(false);
                                setTimeout(() => {
                                  textarea.focus();
                                  const newPosition = start + placeholder.length;
                                  textarea.setSelectionRange(newPosition, newPosition);
                                }, 10);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-neutral-text-primary hover:bg-neutral-surface-secondary transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-neutral-surface-secondary px-2 py-1 rounded">{'{{last_name}}'}</span>
                                <span>Last Name</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <GlassTextarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      error={errors.message}
                      rows={8}
                      placeholder="Type your SMS message here... Use {{first_name}} and {{last_name}} for personalization."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-text-primary mb-2 block">
                      SMS Info
                    </label>
                    <div className="p-3 rounded-lg bg-neutral-surface-secondary border border-neutral-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-text-secondary">
                          {smsInfo.characters} characters
                        </span>
                        <span className={`font-semibold ${smsInfo.parts > 1 ? 'text-fuchsia-primary' : 'text-ice-primary'}`}>
                          {smsInfo.parts} SMS part{smsInfo.parts > 1 ? 's' : ''}
                        </span>
                      </div>
                      {smsInfo.parts > 1 && (
                        <p className="text-xs text-fuchsia-primary mt-2">
                          This message will be split into {smsInfo.parts} parts
                        </p>
                      )}
                    </div>
                  </div>

                  {discountOptions.length > 1 && (
                    <GlassSelectCustom
                      label="Discount Code (Optional)"
                      name="discountId"
                      value={formData.discountId || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          discountId: e.target.value || null,
                        }));
                      }}
                      options={discountOptions}
                      searchable={discountOptions.length > 5}
                      placeholder="Select a discount code..."
                    />
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={handleScheduleToggle}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-neutral-surface-primary border transition-all
                        ${isScheduled 
                          ? 'border-ice-primary bg-ice-primary/10 shadow-glow-ice-light' 
                          : 'border-neutral-border/60 hover:border-neutral-border'
                        }
                        focus-ring focus:shadow-glow-ice-light
                        min-h-[44px] w-full sm:w-auto
                      `}
                    >
                      <Icon 
                        name="schedule" 
                        size="md" 
                        variant={isScheduled ? "ice" : "default"}
                        className={isScheduled ? 'text-ice-primary' : 'text-neutral-text-secondary'}
                      />
                      <span className={`text-sm font-medium ${isScheduled ? 'text-ice-primary' : 'text-neutral-text-primary'}`}>
                        Schedule for later
                      </span>
                    </button>
                    
                    {isScheduled && (
                      <div className="mt-4">
                        <GlassDateTimePicker
                          label="Scheduled Date & Time"
                          name="scheduleAt"
                          value={formData.scheduleAt || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              scheduleAt: e.target.value || '',
                            }));
                          }}
                          error={errors.scheduleAt}
                          minDate={new Date().toISOString()}
                        />
                        {formData.scheduleAt && (() => {
                          // Convert UTC time to shop timezone for display
                          const displayDate = convertUTCToShopTime(formData.scheduleAt, shopTimezone);
                          return (
                            <p className="mt-2 text-sm text-ice-primary flex items-center gap-2">
                              <Icon name="schedule" size="sm" variant="ice" className="text-ice-primary" />
                              <span>
                                Scheduled for {format(displayDate, 'PPp')} ({shopTimezone})
                              </span>
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <GlassButton
                      variant="ghost"
                      size="lg"
                      onClick={handleSaveDraft}
                      disabled={createCampaign.isPending || updateCampaign.isPending || sendCampaign.isPending || scheduleCampaign.isPending}
                      className="flex-1"
                    >
                      {createCampaign.isPending || updateCampaign.isPending ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          Saving...
                        </span>
                      ) : (
                        'Save Draft'
                      )}
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      size="lg"
                      onClick={handleSend}
                      disabled={
                        createCampaign.isPending || 
                        updateCampaign.isPending || 
                        sendCampaign.isPending || 
                        scheduleCampaign.isPending ||
                        (isScheduled && (!formData.scheduleAt || formData.scheduleAt.trim() === ''))
                      }
                      className="flex-1"
                    >
                      {createCampaign.isPending || updateCampaign.isPending || sendCampaign.isPending || scheduleCampaign.isPending ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          {isScheduled ? 'Scheduling...' : 'Sending...'}
                        </span>
                      ) : (
                        isScheduled ? 'Schedule' : 'Send Now'
                      )}
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* iPhone Preview */}
            <div className="lg:sticky lg:top-8">
              <GlassCard variant="default" className="p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-neutral-text-primary">Live Preview</h3>
                  <p className="text-sm text-neutral-text-secondary">
                    See how your message will appear on a mobile device
                  </p>
                </div>
                <IPhonePreviewWithDiscount
                  message={formData.message || 'Type your message to see preview...'}
                  discountCode={selectedDiscount}
                  firstName="Sarah"
                />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
