import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Campaigns
export const useCampaigns = (params = {}) => {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/campaigns?${queryString}`);
      // Backend returns { success: true, data: { items: [...], campaigns: [...], pagination: {...} } }
      // API interceptor extracts response.data.data, so we get { items: [...], campaigns: [...], pagination: {...} }
      // Use campaigns array if available (backward compatibility), otherwise use items
      return {
        campaigns: response.campaigns || response.items || [],
        pagination: response.pagination || {},
      };
    },
  });
};

export const useCampaign = (id) => {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`),
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/campaigns/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useScheduleCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, scheduleType, scheduleAt, recurringDays }) => {
      const scheduleData = {
        scheduleType: scheduleType || 'scheduled',
        scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        recurringDays,
      };
      return api.put(`/campaigns/${id}/schedule`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Contacts
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/contacts?${queryString}`);
      // Backend returns { success: true, data: { contacts: [...], pagination: {...} } }
      // API interceptor extracts response.data.data, so we get { contacts: [...], pagination: {...} }
      return {
        contacts: response.contacts || response.items || [],
        pagination: response.pagination || {},
      };
    },
  });
};

export const useContactStats = () => {
  return useQuery({
    queryKey: ['contacts', 'stats'],
    queryFn: () => api.get('/contacts/stats'),
  });
};

// Billing
export const useBillingBalance = () => {
  return useQuery({
    queryKey: ['billing', 'balance'],
    queryFn: () => api.get('/billing/balance'),
  });
};

/**
 * Get public pricing packages (no authentication required)
 * Used for public pricing page
 */
export const usePublicPackages = (currency = 'EUR') => {
  return useQuery({
    queryKey: ['public', 'packages', currency],
    queryFn: () => api.get(`/public/packages?currency=${currency}`),
    retry: (failureCount, error) => {
      // Don't retry on network errors (backend not available)
      if (error?.isNetworkError || error?.status === 0) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (public data changes rarely)
  });
};

/**
 * Get billing packages (authenticated - requires store context)
 * Used for authenticated users in the app
 */
export const useBillingPackages = () => {
  return useQuery({
    queryKey: ['billing', 'packages'],
    queryFn: () => api.get('/billing/packages'),
    retry: (failureCount, error) => {
      // Don't retry on network errors (backend not available)
      if (error?.isNetworkError || error?.status === 0) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Campaign Stats
export const useCampaignStats = () => {
  return useQuery({
    queryKey: ['campaigns', 'stats'],
    queryFn: () => api.get('/campaigns/stats/summary'),
  });
};

export const useCampaignMetrics = (id) => {
  return useQuery({
    queryKey: ['campaigns', id, 'metrics'],
    queryFn: () => api.get(`/campaigns/${id}/metrics`),
    enabled: !!id,
  });
};

export const usePrepareCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/prepare`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useRetryFailedCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/retry-failed`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });
};

// Dashboard
export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      // Backend returns { success: true, data: { credits, totalCampaigns, totalContacts, totalMessagesSent, ... } }
      return response;
    },
  });
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview'),
  });
};

export const useDashboardQuickStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'quick-stats'],
    queryFn: () => api.get('/dashboard/quick-stats'),
  });
};

// Templates
export const useTemplates = (params = {}) => {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/templates?${queryString}`);
    },
  });
};

export const useTemplateCategories = () => {
  return useQuery({
    queryKey: ['templates', 'categories'],
    queryFn: () => api.get('/templates/categories'),
  });
};

export const useTemplate = (id) => {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get(`/templates/${id}`),
    enabled: !!id,
  });
};

export const useTrackTemplateUsage = () => {
  return useMutation({
    mutationFn: (id) => api.post(`/templates/${id}/track`),
  });
};

// Contacts - CRUD
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/contacts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
    },
  });
};

export const useContact = (id) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.get(`/contacts/${id}`),
    enabled: !!id,
  });
};

export const useImportContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData) => {
      // For file uploads, we need to use FormData directly
      const { API_URL, TOKEN_KEY } = await import('../utils/constants');
      const token = localStorage.getItem(TOKEN_KEY);
      
      const response = await fetch(`${API_URL}/contacts/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to import contacts');
      }
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
    },
  });
};

export const useBirthdayContacts = (params = {}) => {
  return useQuery({
    queryKey: ['contacts', 'birthdays', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/contacts/birthdays?${queryString}`);
    },
  });
};

// Billing
export const useCreatePurchase = () => {
  return useMutation({
    mutationFn: (data) => api.post('/billing/purchase', data),
  });
};

export const useBillingHistory = (params = {}) => {
  return useQuery({
    queryKey: ['billing', 'history', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/billing/history?${queryString}`);
    },
  });
};

export const useBillingHistoryStripe = (params = {}) => {
  return useQuery({
    queryKey: ['billing', 'billing-history', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/billing/billing-history?${queryString}`);
    },
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
  });
};

export const useAccountInfo = () => {
  return useQuery({
    queryKey: ['settings', 'account'],
    queryFn: () => api.get('/settings/account'),
  });
};

export const useUpdateSenderNumber = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.put('/settings/sender', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

// Discounts
export const useDiscounts = () => {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.get('/discounts'),
  });
};

export const useDiscount = (id) => {
  return useQuery({
    queryKey: ['discount', id],
    queryFn: () => api.get(`/discounts/${id}`),
    enabled: !!id,
  });
};

export const useValidateDiscount = () => {
  return useMutation({
    mutationFn: (discountId) => {
      // Backend has two endpoints:
      // 1. POST /shopify/discounts/validate (expects discountId in body)
      // 2. GET /discounts/validate/:code (expects code in URL)
      // We'll use POST /shopify/discounts/validate as it's the standard endpoint
      return api.post('/shopify/discounts/validate', { discountId });
    },
  });
};

// Audiences
export const useAudiences = () => {
  return useQuery({
    queryKey: ['audiences'],
    queryFn: () => api.get('/audiences'),
  });
};

export const useAudienceDetails = (id, params = {}) => {
  return useQuery({
    queryKey: ['audience', id, 'details', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/audiences/${id}/details?${queryString}`);
    },
    enabled: !!id,
  });
};

export const useValidateAudience = () => {
  return useMutation({
    mutationFn: (audienceId) => api.post('/audiences/validate', { audienceId }),
  });
};

// Automations
export const useAutomations = () => {
  return useQuery({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations'),
  });
};

export const useAutomationStats = () => {
  return useQuery({
    queryKey: ['automations', 'stats'],
    queryFn: () => api.get('/automations/stats'),
  });
};

export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/automations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
};

export const useSystemDefaults = () => {
  return useQuery({
    queryKey: ['automations', 'defaults'],
    queryFn: () => api.get('/automations/defaults'),
  });
};

export const useSyncSystemDefaults = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post('/automations/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
};

// Reports
export const useReportsOverview = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'overview', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/overview?${queryString}`);
    },
  });
};

export const useReportsKPIs = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'kpis', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/kpis?${queryString}`);
    },
  });
};

export const useCampaignReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'campaigns', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/campaigns?${queryString}`);
    },
  });
};

export const useCampaignReport = (id) => {
  return useQuery({
    queryKey: ['reports', 'campaigns', id],
    queryFn: () => api.get(`/reports/campaigns/${id}`),
    enabled: !!id,
  });
};

export const useAutomationReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'automations', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/automations?${queryString}`);
    },
  });
};

export const useMessagingReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'messaging', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/messaging?${queryString}`);
    },
  });
};

export const useCreditsReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'credits', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/credits?${queryString}`);
    },
  });
};

export const useContactsReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'contacts', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/contacts?${queryString}`);
    },
  });
};

export const useExportData = () => {
  return useMutation({
    mutationFn: (params) => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/reports/export?${queryString}`);
    },
  });
};

// Tracking
export const useCampaignDeliveryStatus = (id) => {
  return useQuery({
    queryKey: ['tracking', 'campaign', id],
    queryFn: () => api.get(`/tracking/campaign/${id}`),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
};

export const useMittoMessageStatus = (messageId) => {
  return useQuery({
    queryKey: ['tracking', 'mitto', messageId],
    queryFn: () => api.get(`/tracking/mitto/${messageId}`),
    enabled: !!messageId,
  });
};

export const useBulkUpdateDeliveryStatus = () => {
  return useMutation({
    mutationFn: (data) => api.post('/tracking/bulk-update', data),
  });
};

