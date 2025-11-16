import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { normalizePaginatedResponse } from '../utils/apiHelpers';
import { transformAutomationsFromAPI, transformAutomationToAPI } from '../utils/apiAdapters';

// Campaigns
export const useCampaigns = (params = {}) => {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      // Filter out undefined, null, and empty string values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });

      const queryString = new URLSearchParams(cleanParams).toString();
      const response = await api.get(`/campaigns${queryString ? `?${queryString}` : ''}`);
      // Normalize response to consistent format
      const normalized = normalizePaginatedResponse(response, 'campaigns');
      return {
        campaigns: normalized.items,
        pagination: normalized.pagination,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - list data changes with CRUD operations
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Use cached data if fresh
    placeholderData: (previousData) => previousData, // Keep previous data while fetching (smooth pagination)
  });
};

export const useCampaign = (id, options = {}) => {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - detail data changes less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if fresh - only refetch if explicitly requested
    placeholderData: (previousData) => previousData, // Show cached data while fetching
    ...options,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/campaigns/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id, 'metrics'] }); // Invalidate metrics
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
    },
  });
};

export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => {
      // Send POST request without body - explicitly set Content-Type and send empty object
      return api.post(`/campaigns/${id}/send`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', id, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: ['reports'], exact: false }); // Update reports
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
    },
  });
};

// Contacts
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      // Map frontend params to backend params
      const backendParams = {};
      
      // Copy all params except the ones we need to map
      Object.keys(params).forEach(key => {
        if (key !== 'consentStatus' && key !== 'search') {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            backendParams[key] = params[key];
          }
        }
      });
      
      // Map consentStatus to smsConsent (backend expects smsConsent)
      // Also support direct smsConsent param
      if (params.consentStatus) {
        backendParams.smsConsent = params.consentStatus;
      } else if (params.smsConsent) {
        backendParams.smsConsent = params.smsConsent;
      }
      
      // Map search to q (backend expects q for search)
      if (params.search) {
        backendParams.q = params.search;
      }
      
      const queryString = new URLSearchParams(backendParams).toString();
      const response = await api.get(`/contacts?${queryString}`);
      // Normalize response to consistent format
      const normalized = normalizePaginatedResponse(response, 'contacts');
      return {
        contacts: normalized.items,
        pagination: normalized.pagination,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useContactStats = () => {
  return useQuery({
    queryKey: ['contacts', 'stats'],
    queryFn: () => api.get('/contacts/stats'),
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change that frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if fresh
    placeholderData: (previousData) => previousData, // Show cached stats while fetching
  });
};

// Billing
export const useBillingBalance = () => {
  return useQuery({
    queryKey: ['billing', 'balance'],
    queryFn: () => api.get('/billing/balance'),
    staleTime: 2 * 60 * 1000, // 2 minutes - balance doesn't change that frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false, // Don't refetch on focus - use cached data
    refetchOnMount: false, // Use cached data if fresh
    placeholderData: (previousData) => previousData, // Show cached balance while fetching
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
export const useBillingPackages = (currency = null) => {
  return useQuery({
    queryKey: ['billing', 'packages', currency],
    queryFn: () => {
      const url = currency 
        ? `/billing/packages?currency=${encodeURIComponent(currency)}`
        : '/billing/packages';
      return api.get(url);
    },
    retry: (failureCount, error) => {
      // Don't retry on network errors (backend not available)
      if (error?.isNetworkError || error?.status === 0) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - packages rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // Show cached packages while fetching
  });
};

// Campaign Stats
export const useCampaignStats = (options = {}) => {
  return useQuery({
    queryKey: ['campaigns', 'stats'],
    queryFn: async () => {
      const response = await api.get('/campaigns/stats/summary');
      // Normalize response structure - handle both direct data and nested data structure
      const data = response.data?.data || response.data || response;
      return {
        stats: data,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change less frequently than metrics
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    ...options,
  });
};

export const useCampaignMetrics = (id, options = {}) => {
  return useQuery({
    queryKey: ['campaigns', id, 'metrics'],
    queryFn: () => api.get(`/campaigns/${id}/metrics`),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds - metrics update frequently for active campaigns
    gcTime: 5 * 60 * 1000, // 5 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if fresh
    refetchInterval: options.refetchInterval !== false ? 30 * 1000 : false, // Auto-refetch every 30s for live updates (only when enabled)
    refetchIntervalInBackground: false, // Don't refetch in background tabs
    placeholderData: (previousData) => previousData, // Show cached metrics while fetching
    ...options,
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
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });
};

// Dashboard
export const useDashboard = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      // Backend returns { success: true, data: { credits, totalCampaigns, totalContacts, totalMessagesSent, ... } }
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes less frequently than we thought
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5) - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on focus - use cached data
    refetchOnMount: false, // Use cached data if fresh
    refetchInterval: false, // Disable auto-refetch by default - only enable when explicitly needed
    placeholderData: (previousData) => previousData, // Show cached data while fetching
    ...options,
  });
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useDashboardQuickStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'quick-stats'],
    queryFn: () => api.get('/dashboard/quick-stats'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
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
    staleTime: 15 * 60 * 1000, // 15 minutes - templates rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useTemplateCategories = () => {
  return useQuery({
    queryKey: ['templates', 'categories'],
    queryFn: () => api.get('/templates/categories'),
    staleTime: Infinity, // Never stale - categories are static
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useTemplate = (id) => {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get(`/templates/${id}`),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      queryClient.invalidateQueries({ queryKey: ['contacts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/contacts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
    },
  });
};

export const useContact = (id, options = {}) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.get(`/contacts/${id}`),
    enabled: !!id && id !== 'new' && (options.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if fresh - only refetch if explicitly requested
    placeholderData: (previousData) => previousData, // Show cached data while fetching
    ...options,
  });
};

export const useImportContacts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => {
      // Data should be { contacts: [...] } - parsed from CSV on client side
      // Use axios for consistency with other API calls
      return api.post('/contacts/import', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard stats
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
    staleTime: 1 * 60 * 1000, // 1 minute - birthdays change daily
    gcTime: 5 * 60 * 1000, // 5 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Billing
export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/billing/purchase', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'balance'] }); // Update balance
      queryClient.invalidateQueries({ queryKey: ['billing', 'history'], exact: false }); // Update history
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard credits
    },
  });
};

export const useBillingHistory = (params = {}) => {
  return useQuery({
    queryKey: ['billing', 'history', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/billing/history?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - history changes with purchases
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useBillingHistoryStripe = (params = {}) => {
  return useQuery({
    queryKey: ['billing', 'billing-history', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/billing/billing-history?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
    staleTime: 15 * 60 * 1000, // 15 minutes - settings change only when user updates
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useAccountInfo = () => {
  return useQuery({
    queryKey: ['settings', 'account'],
    queryFn: () => api.get('/settings/account'),
    staleTime: 30 * 60 * 1000, // 30 minutes - account info rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useUpdateSenderNumber = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.put('/settings/sender', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
  });
};

// Discounts
export const useDiscounts = () => {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.get('/shopify/discounts'),
    staleTime: 10 * 60 * 1000, // 10 minutes - discounts change occasionally
    gcTime: 20 * 60 * 1000, // 20 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useDiscount = (id) => {
  return useQuery({
    queryKey: ['discount', id],
    queryFn: () => api.get(`/shopify/discounts/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
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
    staleTime: 10 * 60 * 1000, // 10 minutes - audiences change occasionally
    gcTime: 20 * 60 * 1000, // 20 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
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
    queryFn: async () => {
      const response = await api.get('/automations');
      // Backend returns array directly, transform for consistency
      const automations = Array.isArray(response) ? response : (response.automations || []);
      return transformAutomationsFromAPI(automations);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useAutomationStats = () => {
  return useQuery({
    queryKey: ['automations', 'stats'],
    queryFn: () => api.get('/automations/stats'),
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change that frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if fresh
    placeholderData: (previousData) => previousData, // Show cached stats while fetching
  });
};

/**
 * Create automation
 */
export const useCreateAutomation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => {
      const payload = transformAutomationToAPI(data, false);
      return api.post('/automations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'], exact: false });
    },
  });
};

export const useUpdateAutomation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => {
      const payload = transformAutomationToAPI(data, true);
      return api.put(`/automations/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'], exact: false });
    },
  });
};

export const useSystemDefaults = () => {
  return useQuery({
    queryKey: ['automations', 'defaults'],
    queryFn: () => api.get('/automations/defaults'),
    staleTime: Infinity, // Never stale - system defaults are static
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useSyncSystemDefaults = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post('/automations/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'], exact: false });
    },
  });
};

// Reports
export const useReportsOverview = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'overview', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/overview?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reports are expensive to compute
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useReportsKPIs = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'kpis', params],
    queryFn: async () => {
      // KPIs endpoint doesn't take date parameters, so we don't send them
      // Backend kpis endpoint doesn't accept query params
      return api.get('/reports/kpis');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useCampaignReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'campaigns', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.page && { page: params.page }),
        ...(params.limit && { limit: params.limit }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/campaigns?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useCampaignReport = (id) => {
  return useQuery({
    queryKey: ['reports', 'campaigns', id],
    queryFn: () => api.get(`/reports/campaigns/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useAutomationReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'automations', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/automations?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useMessagingReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'messaging', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/messaging?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useCreditsReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'credits', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/credits?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useContactsReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', 'contacts', params],
    queryFn: async () => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/contacts?${queryString}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // React Query v5
  });
};

export const useExportData = () => {
  return useMutation({
    mutationFn: (params) => {
      // Map frontend params to backend params (startDate/endDate -> from/to)
      const backendParams = {
        ...(params.startDate && { from: params.startDate }),
        ...(params.endDate && { to: params.endDate }),
        ...(params.type && { type: params.type }),
        ...(params.format && { format: params.format }),
      };
      const queryString = new URLSearchParams(backendParams).toString();
      return api.get(`/reports/export?${queryString}`);
    },
  });
};

// Tracking
export const useCampaignDeliveryStatus = (id, options = {}) => {
  return useQuery({
    queryKey: ['tracking', 'campaign', id],
    queryFn: () => api.get(`/tracking/campaign/${id}`),
    enabled: !!id,
    staleTime: 15 * 1000, // 15 seconds - tracking data is near real-time
    gcTime: 2 * 60 * 1000, // 2 minutes (React Query v5)
    refetchOnWindowFocus: false, // Don't refetch on focus - use cached data
    refetchOnMount: false, // Use cached data if fresh
    refetchInterval: options.refetchInterval !== false ? 30 * 1000 : false, // Refetch every 30 seconds for live updates (only when enabled)
    refetchIntervalInBackground: false, // Don't refetch in background tabs
    placeholderData: (previousData) => previousData, // Show cached tracking data while fetching
    ...options,
  });
};

export const useMittoMessageStatus = (messageId) => {
  return useQuery({
    queryKey: ['tracking', 'mitto', messageId],
    queryFn: () => api.get(`/tracking/mitto/${messageId}`),
    enabled: !!messageId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useBulkUpdateDeliveryStatus = () => {
  return useMutation({
    mutationFn: (data) => api.post('/tracking/bulk-update', data),
  });
};

