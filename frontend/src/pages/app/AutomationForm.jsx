import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassTextarea from '../../components/ui/GlassTextarea';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import BackButton from '../../components/ui/BackButton';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Icon from '../../components/ui/Icon';
import { useAutomations, useCreateAutomation, useUpdateAutomation } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import { transformAutomationFromAPI } from '../../utils/apiAdapters';
import SEO from '../../components/SEO';

export default function AutomationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const toast = useToastContext();

  const { data: automationsData } = useAutomations();
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();

  const automations = Array.isArray(automationsData) 
    ? automationsData 
    : automationsData?.automations || [];
  const existingAutomation = isEditMode 
    ? automations.find((a) => a.id === id) 
    : null;

  const [formData, setFormData] = useState({
    name: '',
    trigger: 'order_placed',
    triggerConditions: {},
    message: '',
    status: 'draft',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && existingAutomation) {
      // Use adapter to ensure consistent format
      const normalized = transformAutomationFromAPI(existingAutomation);
      setFormData({
        name: normalized.name || '',
        trigger: normalized.trigger || 'order_placed',
        triggerConditions: normalized.triggerConditions || {},
        message: normalized.message || '',
        status: normalized.status || 'draft',
      });
    }
  }, [isEditMode, existingAutomation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent selecting disabled/coming soon triggers
    const selectedOption = triggerOptions.find(opt => opt.value === value);
    if (selectedOption?.disabled) {
      return; // Don't allow selection of disabled options
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Automation name is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (isEditMode) {
        await updateAutomation.mutateAsync({ id, ...formData });
        toast.success('Automation updated successfully');
      } else {
        await createAutomation.mutateAsync(formData);
        toast.success('Automation created successfully');
      }
      navigate('/app/automations');
    } catch (error) {
      toast.error(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} automation`);
    }
  };

  const triggerOptions = [
    { value: 'welcome', label: 'Welcome Message' },
    { value: 'order_placed', label: 'Order Placed' },
    { value: 'order_fulfilled', label: 'Order Fulfilled' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'abandoned_cart', label: 'Abandoned Cart', note: 'Coming soon', disabled: true },
    { value: 'customer_inactive', label: 'Customer Re-engagement', note: 'Coming soon', disabled: true },
  ];

  if (isEditMode && !existingAutomation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={isEditMode ? 'Edit Automation' : 'Create Automation - Sendly SMS Marketing'}
        description="Create or edit an SMS automation workflow"
        path={isEditMode ? `/app/automations/${id}` : '/app/automations/new'}
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1000px] mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BackButton to="/app/automations" label="Back" />
            </div>
            <PageHeader
              title={isEditMode ? 'Edit Automation' : 'Create Automation'}
              subtitle={
                isEditMode 
                  ? 'Update your automation workflow'
                  : 'Set up an automated SMS workflow for your store'
              }
            />
          </div>

          <GlassCard className="p-6">
            <div className="space-y-6">
              <GlassInput
                label="Automation Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Order Confirmation Automation"
                required
              />

              <div>
                <GlassSelectCustom
                  label="Trigger"
                  name="trigger"
                  value={formData.trigger}
                  onChange={handleChange}
                  options={triggerOptions.map(opt => ({ 
                    value: opt.value, 
                    label: opt.label,
                    disabled: opt.disabled 
                  }))}
                />
                {triggerOptions.find(opt => opt.value === formData.trigger)?.note && (
                  <p className="text-xs text-neutral-text-secondary mt-2 flex items-center gap-1">
                    <Icon name="info" size="xs" />
                    {triggerOptions.find(opt => opt.value === formData.trigger).note}
                  </p>
                )}
              </div>

              <GlassTextarea
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                error={errors.message}
                rows={6}
                placeholder="Type your SMS message here... Use {{first_name}} for personalization."
                required
              />

              <GlassSelectCustom
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                ]}
              />

              <div className="flex gap-4 pt-4">
                <GlassButton
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/app/automations')}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={handleSave}
                  disabled={updateAutomation.isPending}
                  className="flex-1"
                >
                  {updateAutomation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Saving...
                    </span>
                  ) : (
                    isEditMode ? 'Update Automation' : 'Create Automation'
                  )}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

