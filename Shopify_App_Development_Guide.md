# Sendly Marketing - Shopify App Development Guide

## 🎯 Overview

This guide is specifically designed for developing the Sendly Marketing Shopify App with your current store setup. It provides all the necessary information to implement and test the SMS marketing functionality within the Shopify ecosystem.

## 🏪 Current Store Configuration

### Development Environment
- **Backend URL**: `http://localhost:3000`
- **Store Domain**: `{{YOUR_STORE_DOMAIN}}.myshopify.com`
- **Environment**: Development
- **Authentication**: Shopify App Context (X-Shopify-Shop-Domain header)

### Production Environment
- **Backend URL**: `https://sendly-marketing-backend.onrender.com`
- **Store Domain**: `{{YOUR_STORE_DOMAIN}}.myshopify.com`
- **Environment**: Production
- **Authentication**: Shopify App Context (X-Shopify-Shop-Domain header)

## 🔐 Authentication Strategy

### Shopify App Authentication
The app uses **Shopify App Context** for authentication, not Bearer tokens. Every request from the Shopify App includes the store domain in headers.

```javascript
// Frontend (Shopify App)
const response = await fetch('/api/contacts', {
  headers: {
    'X-Shopify-Shop-Domain': 'your-store.myshopify.com',
    'Content-Type': 'application/json'
  }
});
```

### Store Resolution Process
1. **Shopify App** sends `X-Shopify-Shop-Domain` header
2. **Backend** resolves store from domain in database
3. **All operations** are automatically scoped to that store
4. **No manual store ID** required in requests

## 📱 Frontend Implementation

### Shopify App Structure
```
src/
├── components/
│   ├── Dashboard/
│   ├── Contacts/
│   ├── Campaigns/
│   ├── Automations/
│   ├── Templates/
│   ├── Reports/
│   └── Settings/
├── hooks/
│   ├── useShopifyAuth.js
│   ├── useStoreContext.js
│   └── useApi.js
├── services/
│   ├── api.js
│   └── shopify.js
└── pages/
    ├── Dashboard.jsx
    ├── Contacts.jsx
    ├── Campaigns.jsx
    ├── Automations.jsx
    ├── Templates.jsx
    ├── Reports.jsx
    └── Settings.jsx
```

### API Service Implementation
```javascript
// services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://sendly-marketing-backend.onrender.com'
      : 'http://localhost:3000';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Shop-Domain': window.shopify?.config?.shop?.myshopifyDomain || 'your-store.myshopify.com'
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardOverview() {
    return this.request('/api/dashboard/overview');
  }

  async getQuickStats() {
    return this.request('/api/dashboard/quick-stats');
  }

  // Contacts
  async getContacts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/contacts?${queryString}`);
  }

  async getContact(id) {
    return this.request(`/api/contacts/${id}`);
  }

  async createContact(data) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateContact(id, data) {
    return this.request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteContact(id) {
    return this.request(`/api/contacts/${id}`, {
      method: 'DELETE'
    });
  }

  async getContactStats() {
    return this.request('/api/contacts/stats');
  }

  async getBirthdayContacts() {
    return this.request('/api/contacts/birthdays');
  }

  // Campaigns
  async getCampaigns(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/campaigns?${queryString}`);
  }

  async getCampaign(id) {
    return this.request(`/api/campaigns/${id}`);
  }

  async createCampaign(data) {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCampaign(id, data) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCampaign(id) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'DELETE'
    });
  }

  async prepareCampaign(id) {
    return this.request(`/api/campaigns/${id}/prepare`, {
      method: 'POST'
    });
  }

  async sendCampaign(id) {
    return this.request(`/api/campaigns/${id}/send`, {
      method: 'POST'
    });
  }

  async scheduleCampaign(id, scheduleData) {
    return this.request(`/api/campaigns/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData)
    });
  }

  async getCampaignMetrics(id) {
    return this.request(`/api/campaigns/${id}/metrics`);
  }

  // Automations
  async getAutomations() {
    return this.request('/api/automations');
  }

  async updateAutomation(id, data) {
    return this.request(`/api/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getAutomationStats() {
    return this.request('/api/automations/stats');
  }

  // Templates
  async getTemplates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/templates?${queryString}`);
  }

  async getTemplate(id) {
    return this.request(`/api/templates/${id}`);
  }

  async getTemplateCategories() {
    return this.request('/api/templates/categories');
  }

  async trackTemplateUsage(id) {
    return this.request(`/api/templates/${id}/track`, {
      method: 'POST'
    });
  }

  // Reports
  async getReportsOverview() {
    return this.request('/api/reports/overview');
  }

  async getKPIs() {
    return this.request('/api/reports/kpis');
  }

  async getCampaignReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/reports/campaigns?${queryString}`);
  }

  async getAutomationReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/reports/automations?${queryString}`);
  }

  async getCreditReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/reports/credits?${queryString}`);
  }

  async getContactReports() {
    return this.request('/api/reports/contacts');
  }

  async exportData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/reports/export?${queryString}`);
  }

  // Settings & Billing
  async getSettings() {
    return this.request('/api/settings');
  }

  async getAccountInfo() {
    return this.request('/api/settings/account');
  }

  async updateSenderNumber(data) {
    return this.request('/api/settings/sender', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getCreditBalance() {
    return this.request('/api/billing/balance');
  }

  async getCreditPackages() {
    return this.request('/api/billing/packages');
  }

  async getBillingHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/billing/history?${queryString}`);
  }

  async createPurchaseSession(data) {
    return this.request('/api/billing/purchase', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Shopify Integration
  async getShopifyDiscounts() {
    return this.request('/api/shopify/discounts');
  }

  async getShopifyDiscount(id) {
    return this.request(`/api/shopify/discounts/${id}`);
  }

  async validateDiscount(data) {
    return this.request('/api/shopify/discounts/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Tracking
  async getMittoMessageStatus(messageId) {
    return this.request(`/api/tracking/mitto/${messageId}`);
  }

  async getCampaignDeliveryStatus(campaignId) {
    return this.request(`/api/tracking/campaign/${campaignId}`);
  }

  async bulkUpdateDeliveryStatus(updates) {
    return this.request('/api/tracking/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates })
    });
  }
}

export default new ApiService();
```

## 🎨 Frontend Components Implementation

### 1. Dashboard Component
```jsx
// components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewData, statsData] = await Promise.all([
          api.getDashboardOverview(),
          api.getQuickStats()
        ]);
        
        setOverview(overviewData.data);
        setQuickStats(statsData.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>SMS Marketing Dashboard</h1>
      
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Contacts</h3>
          <p className="metric-value">{overview?.totalContacts || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Campaigns</h3>
          <p className="metric-value">{overview?.totalCampaigns || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Credits Remaining</h3>
          <p className="metric-value">{overview?.creditsRemaining || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Delivery Rate</h3>
          <p className="metric-value">{overview?.deliveryRate || 0}%</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {overview?.recentActivity?.map((activity, index) => (
          <div key={index} className="activity-item">
            <span className="activity-type">{activity.type}</span>
            <span className="activity-message">{activity.message}</span>
            <span className="activity-time">
              {new Date(activity.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
```

### 2. Contacts Component
```jsx
// components/Contacts/Contacts.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    filter: 'all',
    q: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchContacts();
  }, [filters]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.getContacts(filters);
      setContacts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreateContact = async (contactData) => {
    try {
      await api.createContact(contactData);
      fetchContacts(); // Refresh the list
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  const handleUpdateContact = async (id, contactData) => {
    try {
      await api.updateContact(id, contactData);
      fetchContacts(); // Refresh the list
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.deleteContact(id);
      fetchContacts(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  if (loading) return <div>Loading contacts...</div>;

  return (
    <div className="contacts">
      <h1>Contacts Management</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search contacts..."
          value={filters.q}
          onChange={(e) => handleFilterChange({ q: e.target.value })}
        />
        <select
          value={filters.filter}
          onChange={(e) => handleFilterChange({ filter: e.target.value })}
        >
          <option value="all">All Contacts</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="consented">SMS Consented</option>
          <option value="nonconsented">SMS Non-consented</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="contacts-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Birth Date</th>
              <th>SMS Consent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id}>
                <td>{contact.firstName} {contact.lastName}</td>
                <td>{contact.phone}</td>
                <td>{contact.email}</td>
                <td>{contact.gender}</td>
                <td>{contact.birthDate ? new Date(contact.birthDate).toLocaleDateString() : '-'}</td>
                <td>{contact.smsConsent ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleUpdateContact(contact.id, {})}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteContact(contact.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={pagination.page <= 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Contacts;
```

### 3. Campaigns Component
```jsx
// components/Campaigns/Campaigns.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    status: 'all'
  });

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.getCampaigns(filters);
      setCampaigns(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (campaignData) => {
    try {
      await api.createCampaign(campaignData);
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSendCampaign = async (id) => {
    try {
      await api.sendCampaign(id);
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Failed to send campaign:', error);
    }
  };

  const handleScheduleCampaign = async (id, scheduleData) => {
    try {
      await api.scheduleCampaign(id, scheduleData);
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Failed to schedule campaign:', error);
    }
  };

  if (loading) return <div>Loading campaigns...</div>;

  return (
    <div className="campaigns">
      <h1>SMS Campaigns</h1>
      
      {/* Campaigns List */}
      <div className="campaigns-list">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="campaign-card">
            <h3>{campaign.name}</h3>
            <p>{campaign.message}</p>
            <div className="campaign-stats">
              <span>Recipients: {campaign.recipientCount}</span>
              <span>Delivery Rate: {campaign.deliveryRate}%</span>
              <span>Status: {campaign.status}</span>
            </div>
            <div className="campaign-actions">
              {campaign.status === 'draft' && (
                <button onClick={() => handleSendCampaign(campaign.id)}>
                  Send Now
                </button>
              )}
              <button onClick={() => handleScheduleCampaign(campaign.id, {})}>
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
```

## 🔧 Environment Configuration

### Development Setup
```bash
# .env.local (Frontend)
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_SHOP_DOMAIN=your-store.myshopify.com
```

### Production Setup
```bash
# .env.production (Frontend)
REACT_APP_API_BASE_URL=https://sendly-marketing-backend.onrender.com
REACT_APP_SHOP_DOMAIN=your-store.myshopify.com
```

## 📊 API Testing with Postman

### Postman Collection Setup
1. **Import** the `Sendly_Backend.postman_collection.json`
2. **Set Environment Variables**:
   - `base_url`: `http://localhost:3000` (development) or `https://sendly-marketing-backend.onrender.com` (production)
   - `shopDomain`: `your-store.myshopify.com`
3. **Update Headers** in each request:
   ```
   X-Shopify-Shop-Domain: your-store.myshopify.com
   Content-Type: application/json
   ```

### Key Test Scenarios
1. **Dashboard Overview**: `GET /api/dashboard/overview`
2. **Contacts CRUD**: Create, read, update, delete contacts
3. **Campaign Creation**: Create and send SMS campaigns
4. **Automation Setup**: Configure automated SMS triggers
5. **Reports**: View analytics and performance metrics
6. **Settings**: Manage sender number and billing

## 🚀 Deployment Checklist

### Development Phase
- [ ] Backend running on `http://localhost:3000`
- [ ] Store domain configured in environment
- [ ] Database migrations applied
- [ ] Redis connection established
- [ ] Mitto SMS integration configured

### Production Phase
- [ ] Backend deployed to `https://sendly-marketing-backend.onrender.com`
- [ ] Environment variables configured
- [ ] Database production URL set
- [ ] Redis production URL set
- [ ] Shopify App configured with production backend URL

## 🔍 Debugging & Troubleshooting

### Common Issues
1. **Store Resolution Failed**: Check `X-Shopify-Shop-Domain` header
2. **Credit Validation Errors**: Ensure sufficient credits for SMS sending
3. **Mitto Integration**: Verify API keys and traffic account ID
4. **Database Connection**: Check DATABASE_URL configuration

### Debug Endpoints
- `GET /health` - Basic health check
- `GET /health/full` - Comprehensive system status
- `GET /metrics` - Application metrics

## 📝 Next Steps

1. **Set up your store domain** in the environment variables
2. **Configure Mitto SMS** credentials
3. **Test the API endpoints** using Postman
4. **Implement frontend components** using the provided examples
5. **Deploy to production** when ready

This guide provides everything you need to develop and test the Sendly Marketing Shopify App with your specific store configuration! 🎯
