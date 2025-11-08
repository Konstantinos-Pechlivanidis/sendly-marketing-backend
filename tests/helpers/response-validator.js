/**
 * Response Validator
 * Validates API response structures match expected format
 */

/**
 * Validate standard API response structure
 */
export function validateApiResponse(res, expectedDataStructure = null) {
  // Check basic response structure
  expect(res.body).toHaveProperty('success');
  expect(typeof res.body.success).toBe('boolean');

  if (res.body.success) {
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toBeTruthy();

    // If specific structure provided, validate it
    if (expectedDataStructure) {
      validateStructure(res.body.data, expectedDataStructure);
    }
  } else {
    // Error responses should have error field
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  }

  return res.body;
}

/**
 * Validate nested object structure
 */
function validateStructure(obj, structure, path = '') {
  for (const [key, value] of Object.entries(structure)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (value === null) {
      // Just check key exists (can be null)
      expect(obj).toHaveProperty(key);
    } else if (typeof value === 'string') {
      // Type check
      if (value === 'array') {
        expect(obj).toHaveProperty(key);
        expect(Array.isArray(obj[key])).toBe(true);
      } else if (value === 'object') {
        expect(obj).toHaveProperty(key);
        expect(typeof obj[key]).toBe('object');
        expect(obj[key]).not.toBeNull();
      } else if (value === 'number') {
        expect(obj).toHaveProperty(key);
        expect(typeof obj[key]).toBe('number');
      } else if (value === 'string') {
        expect(obj).toHaveProperty(key);
        expect(typeof obj[key]).toBe('string');
      } else if (value === 'boolean') {
        expect(obj).toHaveProperty(key);
        expect(typeof obj[key]).toBe('boolean');
      }
    } else if (typeof value === 'object') {
      // Nested structure
      if (Array.isArray(value)) {
        // Array of objects
        expect(obj).toHaveProperty(key);
        expect(Array.isArray(obj[key])).toBe(true);
        if (obj[key].length > 0 && value.length > 0) {
          validateStructure(obj[key][0], value[0], `${currentPath}[0]`);
        }
      } else {
        // Nested object
        expect(obj).toHaveProperty(key);
        expect(typeof obj[key]).toBe('object');
        expect(obj[key]).not.toBeNull();
        validateStructure(obj[key], value, currentPath);
      }
    }
  }
}

/**
 * Expected response structures for each endpoint
 */
export const expectedResponses = {
  dashboard: {
    overview: {
      sms: {
        sent: 'number',
        delivered: 'number',
        failed: 'number',
        deliveryRate: 'number',
      },
      contacts: {
        total: 'number',
        optedIn: 'number',
        optedOut: 'number',
      },
      wallet: {
        balance: 'number',
        currency: 'string',
      },
      recentMessages: 'array',
      recentTransactions: 'array',
    },
    quickStats: {
      smsSent: 'number',
      walletBalance: 'number',
    },
  },

  contacts: {
    list: {
      contacts: 'array',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number',
        hasMore: 'boolean',
      },
    },
    getOne: {
      id: 'string',
      phoneE164: 'string',
      firstName: null, // optional
      lastName: null, // optional
      email: null, // optional
      smsConsent: 'string',
    },
    create: {
      id: 'string',
      phoneE164: 'string',
      smsConsent: 'string',
    },
    stats: {
      total: 'number',
      optedIn: 'number',
      optedOut: 'number',
      byGender: {
        male: 'number',
        female: 'number',
        other: 'number',
      },
    },
  },

  campaigns: {
    list: {
      campaigns: 'array',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number',
        hasMore: 'boolean',
      },
    },
    getOne: {
      id: 'string',
      name: 'string',
      message: 'string',
      status: 'string',
      scheduleType: 'string',
    },
    create: {
      id: 'string',
      name: 'string',
      message: 'string',
      status: 'string',
    },
    metrics: {
      sent: 'number',
      delivered: 'number',
      failed: 'number',
      deliveryRate: 'number',
    },
  },

  billing: {
    balance: {
      balance: 'number',
      currency: 'string',
    },
    packages: {
      packages: 'array',
    },
    history: {
      transactions: 'array',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number',
      },
    },
  },

  reports: {
    overview: {
      overview: {
        totalCampaigns: 'number',
        totalContacts: 'number',
        totalSmsSent: 'number',
        deliveryRate: 'number',
        creditsRemaining: 'number',
      },
    },
    kpis: {
      deliveryRate: 'number',
      totalSent: 'number',
      totalDelivered: 'number',
    },
  },

  settings: {
    get: {
      currency: 'string',
      timezone: 'string',
      senderNumber: null, // optional
      senderName: null, // optional
    },
    account: {
      shopDomain: 'string',
      shopName: 'string',
      credits: 'number',
    },
  },
};

export default {
  validateApiResponse,
  expectedResponses,
};

