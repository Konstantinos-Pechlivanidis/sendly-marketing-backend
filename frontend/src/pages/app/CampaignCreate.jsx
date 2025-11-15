import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassTextarea from '../../components/ui/GlassTextarea';
import GlassSelect from '../../components/ui/GlassSelect';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import GlassDateTimePicker from '../../components/ui/GlassDateTimePicker';
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
  
  // Check for template from Templates page
  const templateFromState = location.state?.template;
  
  const [formData, setFormData] = useState({
    name: templateFromState?.name || '',
    message: templateFromState?.message || '',
    audience: 'all',
    scheduleType: 'immediate',
    scheduleAt: '',
    discountId: null,
    senderId: '',
  });
  
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
        scheduleAt: existingCampaign.scheduleAt ? new Date(existingCampaign.scheduleAt).toISOString().slice(0, 16) : '',
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

  const handleBlur = (fieldName) => {
    // Real-time validation on blur
    const newErrors = { ...errors };
    
    if (fieldName === 'name' && !formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (fieldName === 'name') {
      delete newErrors.name;
    }
    
    if (fieldName === 'message') {
      if (!formData.message.trim()) {
        newErrors.message = 'Message is required';
      } else if (formData.message.trim().length < 10) {
        newErrors.message = 'Message must be at least 10 characters';
      } else if (formData.message.trim().length > 1600) {
        newErrors.message = 'Message is too long (max 1600 characters)';
      } else {
        delete newErrors.message;
      }
    }
    
    if (fieldName === 'scheduleAt' && isScheduled) {
      if (!formData.scheduleAt) {
        newErrors.scheduleAt = 'Scheduled date and time is required';
      } else {
        const scheduleDate = new Date(formData.scheduleAt);
        if (scheduleDate <= new Date()) {
          newErrors.scheduleAt = 'Schedule date must be in the future';
        } else {
          delete newErrors.scheduleAt;
        }
      }
    }
    
    setErrors(newErrors);
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
    
    if (isScheduled && !formData.scheduleAt) {
      newErrors.scheduleAt = 'Scheduled date and time is required';
    } else if (formData.scheduleAt) {
      const scheduleDate = new Date(formData.scheduleAt);
      if (scheduleDate <= new Date()) {
        newErrors.scheduleAt = 'Schedule date must be in the future';
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
      
      // Include scheduleAt if scheduled
      if (isScheduled && formData.scheduleAt) {
        campaignData.scheduleAt = new Date(formData.scheduleAt).toISOString();
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
            await scheduleCampaign.mutateAsync({
              id,
              scheduleType: 'scheduled',
              scheduleAt: formData.scheduleAt,
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
          // Create with scheduled data
          campaignData.scheduleAt = new Date(formData.scheduleAt).toISOString();
          result = await createCampaign.mutateAsync(campaignData);
          
          // Use schedule endpoint to properly set status to 'scheduled'
          if (result?.id) {
            try {
              await scheduleCampaign.mutateAsync({
                id: result.id,
                scheduleType: 'scheduled',
                scheduleAt: formData.scheduleAt,
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
      <div className="min-h-screen pt-6 pb-16 px-4 sm:px-6 lg:px-10 bg-neutral-bg-base">
        <div className="max-w-[1400px] mx-auto">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                  <GlassTextarea
                    label="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    error={errors.message}
                    rows={8}
                    placeholder="Type your SMS message here... Use {{first_name}} for personalization and {{discount_code}} for discount codes."
                    required
                  />

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
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={handleScheduleToggle}
                        className="w-5 h-5 rounded border-neutral-border bg-neutral-surface-primary text-ice-primary focus:ring-ice-primary focus:ring-2"
                      />
                      <span className="text-sm font-medium text-neutral-text-primary">
                        Schedule for later
                      </span>
                    </label>
                    
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
                        {formData.scheduleAt && (
                          <p className="mt-2 text-sm text-ice-primary flex items-center gap-2">
                            <span>🕐</span>
                            <span>
                              Scheduled for {format(new Date(formData.scheduleAt), 'PPp')}
                            </span>
                          </p>
                        )}
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
                      disabled={createCampaign.isPending || updateCampaign.isPending || sendCampaign.isPending || scheduleCampaign.isPending}
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
