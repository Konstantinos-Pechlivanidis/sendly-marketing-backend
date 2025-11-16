import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import GlassDatePicker from '../../components/ui/GlassDatePicker';
import PageHeader from '../../components/ui/PageHeader';
import BackButton from '../../components/ui/BackButton';
import StatusBadge from '../../components/ui/StatusBadge';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useContact, useUpdateContact, useDeleteContact, useCreateContact } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function ContactDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToastContext();
  const isNewContact = !id || id === 'new';
  const [isEditing, setIsEditing] = useState(isNewContact || location.state?.edit === true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    birthDate: '',
    smsConsent: 'unknown',
    tags: [],
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const { data: contact, isLoading, error } = useContact(id, { enabled: !isNewContact });
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createContact = useCreateContact();

  useEffect(() => {
    if (contact && !isNewContact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phoneE164 || '', // Backend returns phoneE164
        email: contact.email || '',
        gender: contact.gender || '',
        birthDate: contact.birthDate ? new Date(contact.birthDate).toISOString() : '',
        smsConsent: contact.smsConsent || 'unknown',
        tags: contact.tags || [],
      });
    }
  }, [contact, isNewContact]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (fieldName) => {
    // Real-time validation on blur
    const newErrors = { ...errors };
    
    if (fieldName === 'phone') {
      if (!formData.phone?.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!isValidPhoneNumber(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number with country code';
      } else {
        delete newErrors.phone;
      }
    } else if (fieldName === 'email' && formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    } else if (fieldName === 'birthDate' && formData.birthDate && formData.birthDate.trim()) {
      try {
        const birthDate = new Date(formData.birthDate);
        if (isNaN(birthDate.getTime())) {
          newErrors.birthDate = 'Invalid date format';
        } else if (birthDate > new Date()) {
          newErrors.birthDate = 'Birth date cannot be in the future';
        } else {
          delete newErrors.birthDate;
        }
      } catch (error) {
        newErrors.birthDate = 'Invalid date format';
      }
    } else if (fieldName === 'birthDate' && !formData.birthDate) {
      delete newErrors.birthDate;
    }
    
    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Validate phone number using react-phone-number-input
      if (!isValidPhoneNumber(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number with country code';
      }
    }
    
    if (formData.email && formData.email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (formData.birthDate && formData.birthDate.trim()) {
      try {
        const birthDate = new Date(formData.birthDate);
        if (isNaN(birthDate.getTime())) {
          newErrors.birthDate = 'Invalid date format';
        } else if (birthDate > new Date()) {
          newErrors.birthDate = 'Birth date cannot be in the future';
        }
      } catch (error) {
        newErrors.birthDate = 'Invalid date format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      // Prepare payload - convert phone to phoneE164 and format birthDate
      const payload = {
        firstName: formData.firstName?.trim() || null,
        lastName: formData.lastName?.trim() || null,
        phoneE164: formData.phone?.trim() || null, // react-phone-number-input already returns E.164 format
        email: formData.email?.trim() || null,
        gender: formData.gender || null,
        birthDate: formData.birthDate && formData.birthDate.trim() ? (formData.birthDate.includes('T') ? formData.birthDate : new Date(formData.birthDate).toISOString()) : null,
        smsConsent: formData.smsConsent || 'unknown',
        tags: formData.tags || [],
      };

      if (isNewContact) {
        const result = await createContact.mutateAsync(payload);
        
        toast.success('Contact created successfully');
        
        const contactId = result?.id || result?.data?.id;
        
        if (contactId) {
          navigate(`/app/contacts/${contactId}`, { replace: true });
        } else {
          navigate('/app/contacts', { replace: true });
        }
      } else {
        await updateContact.mutateAsync({ id, ...payload });
        toast.success('Contact updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error?.message || `Failed to ${isNewContact ? 'create' : 'update'} contact`);
    }
  };

  const handleDelete = async () => {
    if (isNewContact) {
      navigate('/app/contacts');
      return;
    }

    try {
      await deleteContact.mutateAsync(id);
      toast.success('Contact deleted successfully');
      navigate('/app/contacts');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete contact');
    }
  };

  // Only show full loading state on initial load (no cached data)
  // If we have cached data, show it immediately even if fetching
  const isInitialLoad = !isNewContact && isLoading && !contact;

  if (isInitialLoad) {
    return <LoadingState size="lg" />;
  }

  if (!isNewContact && error && !contact) {
    return (
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1200px] mx-auto w-full">
          <ErrorState
            title="Contact Not Found"
            message={error?.message || 'The contact you are looking for does not exist.'}
            actionLabel="Back to Contacts"
            onAction={() => navigate('/app/contacts')}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={isNewContact ? 'New Contact' : `${contact?.firstName || contact?.name || 'Contact'} - Contact Details`}
        description="View and edit contact details"
        path={isNewContact ? '/app/contacts/new' : `/app/contacts/${id}`}
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1200px] mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BackButton to="/app/contacts" label="Back" />
            </div>
            <PageHeader
              title={
                isNewContact 
                  ? 'New Contact'
                  : contact?.firstName && contact?.lastName
                  ? `${contact.firstName} ${contact.lastName}`
                  : contact?.name || 'Unnamed Contact'
              }
              subtitle={
                !isNewContact ? (
                  <div className="flex items-center gap-3 mt-2">
                    <StatusBadge status={contact?.smsConsent || contact?.consentStatus} />
                    {contact?.createdAt && (
                      <span className="text-sm text-neutral-text-secondary">
                        Added {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                ) : undefined
              }
              action={
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      {!isNewContact && (
                        <GlassButton variant="ghost" size="md" onClick={() => setIsEditing(false)}>
                          Cancel
                        </GlassButton>
                      )}
                      <GlassButton 
                        variant="primary" 
                        size="md" 
                        onClick={handleSave}
                        disabled={createContact.isPending || updateContact.isPending}
                      >
                        {createContact.isPending || updateContact.isPending ? (
                          <span className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            Saving...
                          </span>
                        ) : (
                          isNewContact ? 'Create Contact' : 'Save Changes'
                        )}
                      </GlassButton>
                    </>
                  ) : !isNewContact && (
                    <>
                      <GlassButton
                        variant="ghost"
                        size="md"
                        onClick={() => setIsEditing(true)}
                      >
                        <span className="flex items-center gap-2">
                          <Icon name="edit" size="sm" variant="ice" />
                          Edit
                        </span>
                      </GlassButton>
                      <GlassButton variant="ghost" size="md" onClick={() => setShowDeleteDialog(true)}>
                        <span className="flex items-center gap-2">
                          <Icon name="delete" size="sm" className="text-red-500" />
                          Delete
                        </span>
                      </GlassButton>
                    </>
                  )}
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Contact Details */}
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-neutral-text-primary">Contact Details</h2>
                {isEditing ? (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <GlassInput
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={() => handleBlur('firstName')}
                        error={errors.firstName}
                      />
                      <GlassInput
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={() => handleBlur('lastName')}
                        error={errors.lastName}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div onBlur={() => handleBlur('phone')}>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={formData.phone}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, phone: value || '' }));
                            if (errors.phone) {
                              setErrors((prev) => ({ ...prev, phone: '' }));
                            }
                          }}
                          className="glass-phone-input"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                      <style>{`
                        .glass-phone-input {
                          width: 100%;
                        }
                        .glass-phone-input .PhoneInputInput {
                          background: rgba(255, 255, 255, 0.05);
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          border-radius: 0.75rem;
                          padding: 0.75rem 1rem;
                          color: var(--neutral-text-primary);
                          font-size: 1rem;
                          width: 100%;
                          transition: all 0.2s;
                        }
                        .glass-phone-input .PhoneInputInput:focus {
                          outline: none;
                          border-color: var(--ice-primary);
                          box-shadow: 0 0 0 3px rgba(78, 143, 184, 0.1);
                        }
                        .glass-phone-input .PhoneInputCountry {
                          background: rgba(255, 255, 255, 0.05);
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          border-radius: 0.75rem;
                          padding: 0.5rem;
                          margin-right: 0.5rem;
                        }
                        .glass-phone-input .PhoneInputCountrySelect {
                          background: transparent;
                          border: none;
                          color: var(--neutral-text-primary);
                          font-size: 0.875rem;
                        }
                      `}</style>
                    </div>
                    
                    <GlassInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      error={errors.email}
                    />
                    
                    <GlassSelectCustom
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'Not specified' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                    
                    <GlassDatePicker
                      label="Birth Date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={(e) => {
                        // GlassDatePicker returns ISO datetime string or empty string
                        setFormData((prev) => ({ ...prev, birthDate: e.target.value || '' }));
                        if (errors.birthDate) {
                          setErrors((prev) => ({ ...prev, birthDate: '' }));
                        }
                      }}
                      onBlur={() => handleBlur('birthDate')}
                      error={errors.birthDate}
                      maxDate={new Date().toISOString()}
                    />
                    
                    <GlassSelectCustom
                      label="SMS Consent Status"
                      name="smsConsent"
                      value={formData.smsConsent}
                      onChange={handleChange}
                      options={[
                        { value: 'unknown', label: 'Unknown' },
                        { value: 'opted_in', label: 'Opted In' },
                        { value: 'opted_out', label: 'Opted Out' },
                      ]}
                    />
                    
                    <div>
                      <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-sm rounded-full bg-ice-soft/50 border border-ice-primary/30 text-ice-deep font-semibold flex items-center gap-2"
                          >
                            {tag}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-red-500 hover:text-red-700"
                                aria-label={`Remove ${tag} tag`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <GlassInput
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="flex-1"
                          />
                          <GlassButton
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={handleAddTag}
                            disabled={!tagInput.trim() || formData.tags.includes(tagInput.trim())}
                          >
                            Add
                          </GlassButton>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !isNewContact && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Name</label>
                      <p className="text-base text-neutral-text-primary font-medium">
                        {contact?.firstName && contact?.lastName
                          ? `${contact.firstName} ${contact.lastName}`
                          : contact?.firstName || contact?.lastName || 'Unnamed Contact'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Phone</label>
                      <p className="text-base text-neutral-text-primary font-medium">{contact?.phoneE164 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Email</label>
                      <p className="text-base text-neutral-text-primary font-medium">{contact?.email || '-'}</p>
                    </div>
                    {contact?.gender && (
                      <div>
                        <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Gender</label>
                        <p className="text-base text-neutral-text-primary font-medium capitalize">{contact.gender}</p>
                      </div>
                    )}
                    {contact?.birthDate && (
                      <div>
                        <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Birth Date</label>
                        <p className="text-base text-neutral-text-primary font-medium">
                          {format(new Date(contact.birthDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {contact?.tags && contact.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-semibold text-neutral-text-secondary mb-1.5 block">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {contact.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 text-sm rounded-full bg-ice-soft/50 border border-ice-primary/30 text-ice-deep font-semibold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <GlassCard variant="ice" className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-neutral-text-primary">Quick Info</h3>
                <div className="space-y-3">
                      {!isNewContact && (
                        <>
                          <div>
                            <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">SMS Consent Status</p>
                            <StatusBadge status={contact?.smsConsent || contact?.consentStatus} />
                          </div>
                          {contact?.gender && (
                            <div>
                              <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Gender</p>
                              <p className="text-sm text-neutral-text-primary capitalize">{contact.gender}</p>
                            </div>
                          )}
                          {contact?.birthDate && (
                            <div>
                              <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Birth Date</p>
                              <p className="text-sm text-neutral-text-primary">
                                {format(new Date(contact.birthDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          )}
                      {contact?.createdAt && (
                        <div>
                          <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Created</p>
                          <p className="text-sm text-neutral-text-primary">
                            {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      {contact?.updatedAt && (
                        <div>
                          <p className="text-xs font-medium text-neutral-text-secondary mb-1 uppercase tracking-wider">Last Updated</p>
                          <p className="text-sm text-neutral-text-primary">
                            {format(new Date(contact.updatedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
      
      {!isNewContact && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Contact"
          message="Are you sure you want to delete this contact? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive={true}
        />
      )}
    </>
  );
}

