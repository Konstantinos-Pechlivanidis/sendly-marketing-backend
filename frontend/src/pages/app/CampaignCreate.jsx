import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassTextarea from '../../components/ui/GlassTextarea';
import IPhonePreview from '../../components/iphone/IPhonePreview';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useCreateCampaign, useSendCampaign } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { format } from 'date-fns';

export default function CampaignCreate() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const sendCampaign = useSendCampaign();
  const toast = useToastContext();
  
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    audience: 'all',
    scheduleType: 'immediate',
    scheduleAt: '',
    discountId: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isScheduled, setIsScheduled] = useState(false);

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
      // Set default scheduled time to tomorrow at 10 AM
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
      // Validate that scheduleAt is in the future
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
      // For draft, we still create the campaign but with scheduleType='immediate'
      // The backend will set status='draft' automatically
      const campaignData = {
        name: formData.name.trim(),
        message: formData.message.trim(),
        audience: formData.audience,
        scheduleType: 'immediate',
        discountId: formData.discountId || null,
      };
      
      const result = await createCampaign.mutateAsync(campaignData);
      // API interceptor returns response.data, so result is already the data object
      // Backend returns { success: true, data: { id, name, ... } }
      // So result should be { id, name, ... }
      if (result?.id) {
        toast.success('Campaign saved as draft successfully');
        navigate('/app/campaigns');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(error?.message || 'Failed to save campaign draft. Please try again.');
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
      };
      
      // Add scheduleAt only if scheduled
      if (isScheduled && formData.scheduleAt) {
        campaignData.scheduleAt = new Date(formData.scheduleAt).toISOString();
      }
      
      const result = await createCampaign.mutateAsync(campaignData);
      
      // If immediate, send the campaign right away
      if (!isScheduled && result?.id) {
        try {
          await sendCampaign.mutateAsync(result.id);
          toast.success('Campaign created and queued for sending!');
        } catch (sendError) {
          toast.warning('Campaign created but failed to send. You can send it manually from the campaigns list.');
          console.error('Error sending campaign:', sendError);
        }
      } else if (isScheduled) {
        toast.success('Campaign scheduled successfully!');
      }
      
      if (result?.id) {
        setTimeout(() => navigate('/app/campaigns'), 1500);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error?.message || 'Failed to create campaign. Please check your inputs and try again.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-bg-dark">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-h1 font-bold mb-2">Create Campaign</h1>
          <p className="text-body text-border-subtle">Create a new SMS campaign and preview it in real-time</p>
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
                />

                <div>
                  <label className="block text-sm font-medium text-primary-light mb-2">
                    Audience / Segment
                  </label>
                  <select
                    name="audience"
                    className="w-full px-4 py-3 rounded-md bg-glass-white backdrop-blur-[24px] border border-glass-border text-primary-light focus-ring focus:border-ice-accent focus:shadow-glow-ice transition-button"
                    value={formData.audience}
                    onChange={handleChange}
                  >
                    <option value="all">All Contacts</option>
                    <option value="male">Male Customers</option>
                    <option value="female">Female Customers</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    {/* TODO: Add segment options dynamically from API */}
                    {/* <option value="segment:segmentId">Segment Name</option> */}
                  </select>
                  <p className="mt-1 text-xs text-border-subtle">
                    Select the target audience for this campaign
                  </p>
                </div>

                <GlassTextarea
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  error={errors.message}
                  rows={8}
                  placeholder="Type your SMS message here... Use {{first_name}} for personalization."
                />

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={handleScheduleToggle}
                      className="w-5 h-5 rounded border-glass-border bg-glass-white text-ice-accent focus:ring-ice-accent focus:ring-2"
                    />
                    <span className="text-sm font-medium text-primary-light">
                      Schedule for later
                    </span>
                  </label>
                  
                  {isScheduled && (
                    <div className="mt-4">
                      <GlassInput
                        label="Scheduled Date & Time"
                        name="scheduleAt"
                        type="datetime-local"
                        value={formData.scheduleAt ? new Date(formData.scheduleAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            const date = new Date(value);
                            setFormData((prev) => ({
                              ...prev,
                              scheduleAt: date.toISOString(),
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              scheduleAt: '',
                            }));
                          }
                        }}
                        error={errors.scheduleAt}
                      />
                      {formData.scheduleAt && (
                        <p className="mt-2 text-sm text-ice-accent flex items-center gap-2">
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
                    disabled={createCampaign.isPending || sendCampaign.isPending}
                    className="flex-1"
                  >
                    {createCampaign.isPending ? (
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
                    disabled={createCampaign.isPending || sendCampaign.isPending}
                    className="flex-1"
                  >
                    {createCampaign.isPending || sendCampaign.isPending ? (
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
          <div className="lg:sticky lg:top-24">
            <GlassCard variant="dark" className="p-4">
              <div className="mb-4">
                <h3 className="text-h3 font-semibold mb-2">Live Preview</h3>
                <p className="text-sm text-border-subtle">
                  See how your message will appear on a mobile device
                </p>
              </div>
              <IPhonePreview message={formData.message} />
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

