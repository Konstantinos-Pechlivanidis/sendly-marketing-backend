# Frontend Technical Specification

## SMS Blossom Shopify App - Detailed Implementation Guide

### 📋 **Technical Overview**

Αυτό το document περιγράφει λεπτομερώς την τεχνική υλοποίηση του frontend για το SMS Blossom Shopify App, συμπεριλαμβανομένων όλων των APIs, components, και features που έχουμε συζητήσει.

---

## 🏗️ **Architecture Overview**

```
Frontend Architecture
├── App Layer (React + TypeScript)
├── Component Layer (Polaris + Custom)
├── Service Layer (API Integration)
├── State Layer (Context + Hooks)
├── Utility Layer (Helpers + Types)
└── Asset Layer (Styles + Images)
```

---

## 📱 **Page-by-Page Implementation**

### **1. Dashboard Page**

#### **API Integration**

```typescript
// API Endpoints
GET / dashboard / overview;
GET / dashboard / quick - stats;
GET / dashboard / recent - activity;

// Response Types
interface DashboardData {
  overview: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    cost: number;
    optIns: number;
    optOuts: number;
    attributedOrders: {
      count: number;
      revenue: number;
      percentage: number;
    };
  };
  walletStats: {
    balance: number;
    totalPurchased: number;
    totalUsed: number;
    active: boolean;
  };
  recentMessages: Message[];
  recentTransactions: Transaction[];
}
```

#### **Components Structure**

```typescript
// Main Page Component
<DashboardPage>
  <Page title="Dashboard" subtitle="SMS Marketing Overview">
    <Layout>
      <Layout.Section>
        <MetricsGrid>
          <StatCard title="Total Sent" value={overview.sent} icon={MessageMajor} />
          <StatCard title="Delivered" value={overview.delivered} icon={DeliveryMajor} />
          <StatCard title="Failed" value={overview.failed} icon={FailureMajor} />
          <StatCard title="Delivery Rate" value={`${overview.deliveryRate}%`} icon={AnalyticsMajor} />
        </MetricsGrid>
      </Layout.Section>

      <Layout.Section>
        <RevenueMetrics>
          <StatCard title="Attributed Revenue" value={`$${overview.attributedOrders.revenue}`} icon={DollarSignMajor} />
          <StatCard title="Attributed Orders" value={overview.attributedOrders.count} icon={ClickMajor} />
          <StatCard title="Attribution Rate" value={`${overview.attributedOrders.percentage}%`} icon={AnalyticsMajor} />
          <StatCard title="Wallet Balance" value={`$${walletStats.balance}`} icon={WalletMajor} />
        </RevenueMetrics>
      </Layout.Section>

      <Layout.Section>
        <RecentActivity>
          <ActivityFeed messages={recentMessages} />
          <TransactionHistory transactions={recentTransactions} />
        </RecentActivity>
      </Layout.Section>
    </Layout>
  </Page>
</DashboardPage>
```

#### **Implementation Steps**

1. Create `src/pages/Dashboard.tsx`
2. Implement `useDashboard` hook
3. Create `MetricsGrid` component
4. Add `RecentActivity` component
5. Implement responsive design

---

### **2. Contacts Page**

#### **API Integration**

```typescript
// API Endpoints
GET /contacts                    # List contacts with pagination
GET /contacts/:id               # Get single contact
POST /contacts                  # Create contact
PUT /contacts/:id               # Update contact
DELETE /contacts/:id            # Delete contact
POST /contacts/import           # Import contacts from CSV/Excel
GET /contacts/search            # Search contacts

// Request/Response Types
interface ContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  smsConsentState: 'opted_in' | 'opted_out' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}
```

#### **Components Structure**

```typescript
// Main Page Component
<ContactsPage>
  <Page title="Contacts" subtitle="Manage your SMS contacts">
    <Layout>
      <Layout.Section>
        <ContactsToolbar>
          <SearchBar onSearch={handleSearch} />
          <FilterDropdown onFilter={handleFilter} />
          <Button onClick={handleCreateContact}>Add Contact</Button>
          <Button onClick={handleImport}>Import Contacts</Button>
        </ContactsToolbar>
      </Layout.Section>

      <Layout.Section>
        <ContactsList>
          <ResourceList
            items={contacts}
            renderItem={renderContactItem}
            pagination={pagination}
          />
        </ContactsList>
      </Layout.Section>
    </Layout>
  </Page>

  <ContactFormModal />
  <ImportModal />
</ContactsPage>
```

#### **Key Features Implementation**

```typescript
// Contact CRUD Operations
const handleCreateContact = async (contactData: CreateContactData) => {
  try {
    const contact = await contactsAPI.createContact(contactData);
    setContacts((prev) => [contact, ...prev]);
    setShowFormModal(false);
    showToast('Contact created successfully');
  } catch (error) {
    showError('Failed to create contact');
  }
};

// Search and Filter
const handleSearch = (query: string) => {
  setSearchQuery(query);
  setCurrentPage(1);
  fetchContacts();
};

// Import Functionality
const handleImport = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await contactsAPI.importContacts(formData);
    showToast(`Imported ${result.imported} contacts successfully`);
    fetchContacts();
  } catch (error) {
    showError('Failed to import contacts');
  }
};
```

#### **Implementation Steps**

1. Create `src/pages/Contacts.tsx`
2. Implement `useContacts` hook
3. Create `ContactsList` component
4. Add `ContactForm` component
5. Implement `ImportModal` component
6. Add search and filter functionality
7. Implement pagination

---

### **3. Campaigns Page**

#### **API Integration**

```typescript
// API Endpoints
GET /campaigns                   # List campaigns
GET /campaigns/:id               # Get campaign details
POST /campaigns                  # Create campaign
PUT /campaigns/:id               # Update campaign
DELETE /campaigns/:id            # Delete campaign
POST /campaigns/:id/send-now     # Send campaign immediately
PUT /campaigns/:id/schedule      # Schedule campaign
GET /campaigns/upcoming          # Get upcoming campaigns

// Request/Response Types
interface Campaign {
  id: string;
  name: string;
  message: string;
  audience: 'all' | 'men' | 'women';
  discountId?: string;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduleAt?: string;
  recurringDays?: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  metrics: {
    totalSent: number;
    totalDelivered: number;
    totalClicked: number;
    deliveryRate: number;
    clickRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateCampaignData {
  name: string;
  message: string;
  audience: 'all' | 'men' | 'women';
  discountId?: string;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduleAt?: string;
  recurringDays?: number;
}
```

#### **Components Structure**

```typescript
// Main Page Component
<CampaignsPage>
  <Page title="Campaigns" subtitle="Create and manage SMS campaigns">
    <Layout>
      <Layout.Section>
        <CampaignsToolbar>
          <Button onClick={handleCreateCampaign}>Create Campaign</Button>
          <Button onClick={handleViewUpcoming}>Upcoming Campaigns</Button>
        </CampaignsToolbar>
      </Layout.Section>

      <Layout.Section>
        <CampaignsList>
          <ResourceList
            items={campaigns}
            renderItem={renderCampaignItem}
            pagination={pagination}
          />
        </CampaignsList>
      </Layout.Section>
    </Layout>
  </Page>

  <CampaignFormModal />
  <ScheduleModal />
</CampaignsPage>
```

#### **Key Features Implementation**

```typescript
// Campaign Creation
const handleCreateCampaign = async (campaignData: CreateCampaignData) => {
  try {
    const campaign = await campaignsAPI.createCampaign(campaignData);
    setCampaigns(prev => [campaign, ...prev]);
    setShowFormModal(false);
    showToast('Campaign created successfully');
  } catch (error) {
    showError('Failed to create campaign');
  }
};

// Campaign Scheduling
const handleScheduleCampaign = async (campaignId: string, scheduleData: ScheduleData) => {
  try {
    await campaignsAPI.scheduleCampaign(campaignId, scheduleData);
    showToast('Campaign scheduled successfully');
    fetchCampaigns();
  } catch (error) {
    showError('Failed to schedule campaign');
  }
};

// Audience Selection
const AudienceSelector = ({ value, onChange }: AudienceSelectorProps) => {
  const options = [
    { label: 'All Contacts', value: 'all' },
    { label: 'Men Only', value: 'men' },
    { label: 'Women Only', value: 'women' },
  ];

  return (
    <Select
      label="Audience"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
};
```

#### **Implementation Steps**

1. Create `src/pages/Campaigns.tsx`
2. Implement `useCampaigns` hook
3. Create `CampaignForm` component
4. Add `ScheduleModal` component
5. Implement audience selection
6. Add discount integration
7. Implement GDPR compliance features

---

### **4. Templates Page**

#### **API Integration**

```typescript
// API Endpoints
GET /templates                   # List global templates
GET /templates/:id               # Get template details
GET /templates/categories        # Get categories
GET /templates/triggers          # Get triggers
GET /templates/popular           # Get popular templates
GET /templates/stats             # Get template statistics
POST /templates/:id/use          # Record template usage
POST /templates/preview          # Preview template

// Request/Response Types
interface Template {
  id: string;
  name: string;
  body: string;
  trigger: string;
  category: string;
  description: string;
  version: number;
  sentCount: number;
  usedCount: number;
  lastUsedAt: string | null;
  metrics: {
    sentCount: number;
    usedCount: number;
    conversionRate: number;
    lastUsedAt: string | null;
  };
}

interface TemplatesResponse {
  templates: Template[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    category: string;
    trigger: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
}
```

#### **Components Structure**

```typescript
// Main Page Component
<TemplatesPage>
  <Page title="SMS Templates" subtitle="Browse and use pre-built SMS templates">
    <Layout>
      <Layout.Section>
        <TemplatesToolbar>
          <SearchBar onSearch={handleSearch} />
          <CategoryFilter onFilter={handleCategoryFilter} />
          <TriggerFilter onFilter={handleTriggerFilter} />
          <SortDropdown onSort={handleSort} />
        </TemplatesToolbar>
      </Layout.Section>

      <Layout.Section>
        <TemplatesGrid>
          <ResourceList
            items={templates}
            renderItem={renderTemplateItem}
            pagination={pagination}
          />
        </TemplatesGrid>
      </Layout.Section>
    </Layout>
  </Page>

  <TemplatePreviewModal />
</TemplatesPage>
```

#### **Key Features Implementation**

```typescript
// Template Preview
const handlePreviewTemplate = async (template: Template) => {
  try {
    const sampleData = generateSampleData(template.trigger);
    const preview = await templatesAPI.previewTemplate(template.id, sampleData);
    setPreviewData(preview.data);
    setShowPreviewModal(true);
  } catch (error) {
    showError('Failed to preview template');
  }
};

// Template Usage Tracking
const handleUseTemplate = async (templateId: string) => {
  try {
    await templatesAPI.useTemplate(templateId);
    showToast('Template usage recorded');
    fetchTemplates();
  } catch (error) {
    showError('Failed to record template usage');
  }
};

// Category Filtering
const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Fashion', value: 'fashion' },
    { label: 'Gym', value: 'gym' },
    { label: 'Store', value: 'store' },
    { label: 'Default', value: 'default' },
  ];

  return (
    <Select
      label="Category"
      options={categories}
      value={value}
      onChange={onChange}
    />
  );
};
```

#### **Implementation Steps**

1. Create `src/pages/Templates.tsx`
2. Implement `useTemplates` hook
3. Create `TemplatesGrid` component
4. Add `TemplatePreview` component
5. Implement category and trigger filtering
6. Add search functionality
7. Implement usage tracking

---

### **5. Automations Page**

#### **API Integration**

```typescript
// API Endpoints
GET /automations                 # List automations
GET /automations/:type           # Get automation details
PATCH /automations/:type         # Update automation
POST /automations/:type/reset    # Reset to default
GET /automations/stats           # Get automation statistics
POST /automations/preview        # Preview automation message

// Request/Response Types
interface Automation {
  id: string;
  type: string;
  active: boolean;
  message: string;
  defaultMessage: string;
  delayMinutes: number | null;
  description: string;
  variables: string[];
  isDefault: boolean;
  stats?: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalClicked: number;
    deliveryRate: number;
    clickRate: number;
  };
}

interface UpdateAutomationData {
  active?: boolean;
  message?: string;
  delayMinutes?: number;
}
```

#### **Components Structure**

```typescript
// Main Page Component
<AutomationsPage>
  <Page title="SMS Automations" subtitle="Configure automated SMS messages">
    <Layout>
      <Layout.Section>
        <AutomationsStats>
          <StatCard title="Active Automations" value={stats.activeAutomations} icon={AutomationMajor} />
          <StatCard title="Total Sent" value={stats.totalSent} icon={MessageMajor} />
          <StatCard title="Delivery Rate" value={`${stats.deliveryRate}%`} icon={DeliveryMajor} />
          <StatCard title="Click Rate" value={`${stats.clickRate}%`} icon={ClickMajor} />
        </AutomationsStats>
      </Layout.Section>

      <Layout.Section>
        <AutomationsList>
          <ResourceList
            items={automations}
            renderItem={renderAutomationItem}
          />
        </AutomationsList>
      </Layout.Section>
    </Layout>
  </Page>

  <AutomationFormModal />
  <PreviewModal />
</AutomationsPage>
```

#### **Key Features Implementation**

```typescript
// Automation Configuration
const handleUpdateAutomation = async (type: string, data: UpdateAutomationData) => {
  try {
    const automation = await automationsAPI.updateAutomation(type, data);
    setAutomations((prev) => prev.map((a) => (a.type === type ? automation : a)));
    showToast('Automation updated successfully');
  } catch (error) {
    showError('Failed to update automation');
  }
};

// Message Preview
const handlePreviewMessage = async (automation: Automation) => {
  try {
    const sampleData = generateSampleData(automation.type);
    const preview = await automationsAPI.previewMessage(
      automation.type,
      automation.message,
      sampleData
    );
    setPreviewData(preview.data);
    setShowPreviewModal(true);
  } catch (error) {
    showError('Failed to preview message');
  }
};

// Reset to Default
const handleResetAutomation = async (type: string) => {
  try {
    await automationsAPI.resetAutomation(type);
    showToast('Automation reset to default');
    fetchAutomations();
  } catch (error) {
    showError('Failed to reset automation');
  }
};
```

#### **Implementation Steps**

1. Create `src/pages/Automations.tsx`
2. Implement `useAutomations` hook
3. Create `AutomationsList` component
4. Add `AutomationForm` component
5. Implement message editing with variables
6. Add preview functionality
7. Implement reset to default

---

### **6. Reports Page**

#### **API Integration**

```typescript
// API Endpoints
GET /reports/overview            # Get overview metrics
GET /reports/campaigns           # Get campaign analytics
GET /reports/campaigns/:id       # Get campaign details
GET /reports/automations         # Get automation analytics
GET /reports/messaging           # Get messaging analytics
GET /reports/revenue             # Get revenue analytics
GET /reports/export              # Export reports

// Request/Response Types
interface ReportsData {
  overview: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    cost: number;
    optIns: number;
    optOuts: number;
    attributedOrders: {
      count: number;
      revenue: number;
      percentage: number;
    };
  };
  campaignAttribution: CampaignAttribution[];
  automationAttribution: {
    automation: string;
    orders: number;
    revenue: number;
  };
  messagingTimeseries: MessagingTimeseries[];
  walletStats: {
    balance: number;
    totalPurchased: number;
    totalUsed: number;
    active: boolean;
  };
}
```

#### **Components Structure**

```typescript
// Main Page Component
<ReportsPage>
  <Page title="SMS Reports & Analytics" subtitle="Comprehensive insights into your SMS marketing performance">
    <Layout>
      <Layout.Section>
        <DateRangeSelector>
          <DatePicker />
          <PresetButtons />
        </DateRangeSelector>
      </Layout.Section>

      <Layout.Section>
        <Tabs>
          <Tab id="overview" content="Overview">
            <OverviewTab data={data.overview} />
          </Tab>
          <Tab id="campaigns" content="Campaigns">
            <CampaignsTab data={data.campaignAttribution} />
          </Tab>
          <Tab id="automations" content="Automations">
            <AutomationsTab data={data.automationAttribution} />
          </Tab>
          <Tab id="messaging" content="Messaging">
            <MessagingTab data={data.messagingTimeseries} />
          </Tab>
          <Tab id="revenue" content="Revenue">
            <RevenueTab data={data.revenue} />
          </Tab>
        </Tabs>
      </Layout.Section>
    </Layout>
  </Page>

  <ExportModal />
</ReportsPage>
```

#### **Key Features Implementation**

```typescript
// Date Range Selection
const handleDateRangeChange = (from: Date, to: Date) => {
  setDateRange({ from, to });
  fetchReports();
};

// Export Functionality
const handleExport = async (format: string, reportType: string) => {
  try {
    const blob = await reportsAPI.exportReports({
      from: dateRange.from,
      to: dateRange.to,
      format,
      reportType
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    showError('Failed to export report');
  }
};

// Data Visualization
const MetricsChart = ({ data }: MetricsChartProps) => {
  return (
    <Card>
      <LineChart
        data={data}
        xKey="day"
        yKey="sent"
        title="Messages Sent Over Time"
      />
    </Card>
  );
};
```

#### **Implementation Steps**

1. Create `src/pages/Reports.tsx`
2. Implement `useReports` hook
3. Create tabbed interface
4. Add date range selection
5. Implement data visualization
6. Add export functionality
7. Create responsive design

---

## 🔧 **Technical Implementation Details**

### **State Management**

#### **Context Providers**

```typescript
// App Context
interface AppContextType {
  shop: Shop | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Notification Context
interface NotificationContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}
```

#### **Custom Hooks**

```typescript
// Data Fetching Hooks
export const useDashboard = (params?: DashboardParams) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getOverview(params);
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Form Hooks
export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    phoneE164: '',
    email: '',
    gender: 'other',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phoneE164.trim()) {
      newErrors.phoneE164 = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      const contact = await contactsAPI.createContact(formData);
      return contact;
    } catch (error) {
      throw error;
    }
  }, [formData, validate]);

  return {
    formData,
    setFormData,
    errors,
    validate,
    handleSubmit,
  };
};
```

### **Component Architecture**

#### **Base Components**

```typescript
// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'base' | 'success' | 'warning' | 'critical';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'base',
  onClick
}) => {
  return (
    <Card>
      <LegacyStack alignment="center">
        <Icon color={color} />
        <LegacyStack vertical>
          <Text variant="headingMd" as="h6">{title}</Text>
          <Text variant="heading2xl" as="h2">{value}</Text>
          {trend && trendValue && (
            <Text variant="bodySm" color={trend === 'up' ? 'success' : 'critical'}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
            </Text>
          )}
        </LegacyStack>
      </LegacyStack>
    </Card>
  );
};

// DataTable Component
interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (row: any) => void;
  emptyState?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading,
  pagination,
  onRowClick,
  emptyState
}) => {
  if (loading) {
    return (
      <Card>
        <LegacyStack alignment="center">
          <Spinner size="large" />
        </LegacyStack>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        {emptyState || (
          <EmptyState
            heading="No data found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>No data available for the selected criteria.</p>
          </EmptyState>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <DataTable
        columnContentTypes={columns.map(col => col.type)}
        headings={columns.map(col => col.header)}
        rows={data.map(row => columns.map(col => col.render(row)))}
        onRowClick={onRowClick}
      />
      {pagination && (
        <LegacyStack distribution="center">
          <Pagination
            hasPrevious={pagination.hasPrev}
            onPrevious={pagination.onPrev}
            hasNext={pagination.hasNext}
            onNext={pagination.onNext}
            label={`Page ${pagination.page} of ${pagination.totalPages}`}
          />
        </LegacyStack>
      )}
    </Card>
  );
};
```

#### **Page Components**

```typescript
// Base Page Component
interface BasePageProps {
  title: string;
  subtitle?: string;
  primaryAction?: ActionProps;
  secondaryActions?: ActionProps[];
  children: React.ReactNode;
}

export const BasePage: React.FC<BasePageProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  children
}) => {
  return (
    <Page
      title={title}
      subtitle={subtitle}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <Layout>
        {children}
      </Layout>
    </Page>
  );
};

// Dashboard Page
export const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <BasePage title="Dashboard">
        <Layout.Section>
          <Spinner size="large" />
        </Layout.Section>
      </BasePage>
    );
  }

  if (error) {
    return (
      <BasePage title="Dashboard">
        <Layout.Section>
          <Banner status="critical">{error}</Banner>
        </Layout.Section>
      </BasePage>
    );
  }

  return (
    <BasePage title="Dashboard" subtitle="SMS Marketing Overview">
      <Layout.Section>
        <MetricsGrid data={data.overview} />
      </Layout.Section>
      <Layout.Section>
        <RevenueMetrics data={data.overview} />
      </Layout.Section>
      <Layout.Section>
        <RecentActivity data={data} />
      </Layout.Section>
    </BasePage>
  );
};
```

### **API Service Layer**

#### **Base API Service**

```typescript
class ApiService {
  private baseURL: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
  }

  async setSessionToken(token: string) {
    this.sessionToken = token;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const shopDomain = await this.getShopDomain();
    if (shopDomain) {
      headers['X-Shopify-Shop-Domain'] = shopDomain;
    }

    return headers;
  }

  private async getShopDomain(): Promise<string | null> {
    // Get shop domain from Shopify App Bridge
    return new URLSearchParams(window.location.search).get('shop');
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  }
}
```

#### **Specific API Services**

```typescript
// Dashboard API
export class DashboardAPI extends ApiService {
  async getOverview(params?: { from?: string; to?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const endpoint = `/dashboard/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ data: DashboardData }>(endpoint);
  }

  async getQuickStats() {
    return this.request<{ data: QuickStats }>('/dashboard/quick-stats');
  }

  async getRecentActivity() {
    return this.request<{ data: RecentActivity }>('/dashboard/recent-activity');
  }
}

// Contacts API
export class ContactsAPI extends ApiService {
  async getContacts(params: ContactsParams) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{ data: ContactsResponse }>(`/contacts?${queryParams.toString()}`);
  }

  async getContact(id: string) {
    return this.request<{ data: Contact }>(`/contacts/${id}`);
  }

  async createContact(contact: CreateContactData) {
    return this.request<{ data: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, contact: UpdateContactData) {
    return this.request<{ data: Contact }>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async deleteContact(id: string) {
    return this.request<{ success: boolean }>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async importContacts(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ data: ImportResult }>('/contacts/import', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
    });
  }
}
```

### **Error Handling**

#### **Error Boundary**

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Banner status="critical">
            <Text variant="headingMd" as="h3">Something went wrong</Text>
            <Text variant="bodyMd">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </Button>
          </Banner>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

#### **Error Handling Hook**

```typescript
export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: Error | string) => {
    const message = typeof error === 'string' ? error : error.message;
    setError(message);

    // Log error to monitoring service
    console.error('Error:', message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
```

### **Performance Optimization**

#### **Code Splitting**

```typescript
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const ContactsPage = lazy(() => import('./pages/Contacts'));
const CampaignsPage = lazy(() => import('./pages/Campaigns'));
const TemplatesPage = lazy(() => import('./pages/Templates'));
const AutomationsPage = lazy(() => import('./pages/Automations'));
const ReportsPage = lazy(() => import('./pages/Reports'));

// App component with Suspense
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner size="large" />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
```

#### **Memoization**

```typescript
// Memoized components
export const StatCard = React.memo<StatCardProps>(({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'base',
  onClick
}) => {
  return (
    <Card>
      <LegacyStack alignment="center">
        <Icon color={color} />
        <LegacyStack vertical>
          <Text variant="headingMd" as="h6">{title}</Text>
          <Text variant="heading2xl" as="h2">{value}</Text>
          {trend && trendValue && (
            <Text variant="bodySm" color={trend === 'up' ? 'success' : 'critical'}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
            </Text>
          )}
        </LegacyStack>
      </LegacyStack>
    </Card>
  );
});

// Memoized hooks
export const useDashboard = (params?: DashboardParams) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getOverview(params);
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return useMemo(() => ({
    data,
    loading,
    error,
    refetch: fetchData
  }), [data, loading, error, fetchData]);
};
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Foundation**

- [ ] Project setup and configuration
- [ ] Shopify App integration
- [ ] Authentication setup
- [ ] API service layer
- [ ] Basic routing and navigation
- [ ] Core components library
- [ ] Error handling
- [ ] State management

### **Phase 2: Core Pages**

- [ ] Dashboard page implementation
- [ ] Contacts page implementation
- [ ] Basic CRUD operations
- [ ] Search and filter functionality
- [ ] Pagination implementation
- [ ] Form validation
- [ ] File upload handling

### **Phase 3: Advanced Features**

- [ ] Campaigns page implementation
- [ ] Templates page implementation
- [ ] Automations page implementation
- [ ] Scheduling functionality
- [ ] Import/export features
- [ ] Preview functionality
- [ ] Performance optimization

### **Phase 4: Analytics & Reports**

- [ ] Reports page implementation
- [ ] Data visualization
- [ ] Export functionality
- [ ] Performance optimization
- [ ] Testing and bug fixes
- [ ] Responsive design
- [ ] Accessibility improvements

### **Phase 5: Polish & Deploy**

- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Security audit
- [ ] Testing coverage
- [ ] Documentation
- [ ] Deployment preparation

---

**This technical specification provides a complete guide for implementing the SMS Blossom Shopify App frontend. Follow the implementation steps sequentially and refer to the backend API documentation for detailed endpoint specifications.**
