# Test Suite Documentation

## Overview

Comprehensive test suite for all API endpoints in the Sendly Marketing Backend.

## Setup

### Install Dependencies

```bash
npm install
```

### Configure Test Database

Create a `.env.test` file with test database configuration:

```env
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/sendly_test
NODE_ENV=test
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
tests/
├── integration/          # Integration tests for API endpoints
│   ├── dashboard.test.js
│   ├── contacts.test.js
│   ├── campaigns.test.js
│   ├── billing.test.js
│   ├── reports.test.js
│   ├── settings.test.js
│   ├── templates.test.js
│   ├── automations.test.js
│   ├── tracking.test.js
│   ├── discounts.test.js
│   ├── audiences.test.js
│   ├── core.test.js
│   └── webhooks.test.js
├── helpers/              # Test utilities
│   ├── test-utils.js     # Test data creation helpers
│   ├── test-db.js        # Database verification helpers
│   └── test-server.js   # Server test helpers
├── setup.js              # Test environment setup
├── global-setup.js      # Global setup (runs once)
└── global-teardown.js   # Global teardown (runs once)
```

## Test Coverage

### Endpoints Covered

- ✅ Dashboard (2 endpoints)
- ✅ Contacts (8 endpoints)
- ✅ Campaigns (9 endpoints)
- ✅ Billing (5 endpoints)
- ✅ Reports (8 endpoints)
- ✅ Settings (3 endpoints)
- ✅ Templates (4 endpoints)
- ✅ Automations (5 endpoints)
- ✅ Tracking (3 endpoints)
- ✅ Discounts (3 endpoints)
- ✅ Audiences (3 endpoints)
- ✅ Core/Health (6 endpoints)
- ✅ Webhooks (3 endpoints)

**Total: 61 endpoints tested**

## Test Features

### Real-World Examples

All tests use realistic data examples:
- Valid phone numbers in E.164 format
- Real email addresses
- Proper date formats
- Complete campaign data
- Actual transaction scenarios

### Database Validation

Tests verify:
- Data is correctly stored in database
- Relationships are maintained
- Constraints are enforced
- Updates are persisted
- Deletes remove data properly

### Full Request/Response Cycles

Tests cover:
- Request validation
- Response structure
- Status codes
- Error handling
- Data transformation

### Edge Cases

Tests include:
- Invalid input validation
- Missing required fields
- Boundary conditions
- Error scenarios
- Authentication failures

## Writing New Tests

### Example Test Structure

```javascript
describe('Endpoint Group', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop();
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /endpoint', () => {
    it('should return expected data', async () => {
      const res = await request(app)
        .get('/endpoint')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
```

### Test Utilities

Use helper functions from `tests/helpers/`:

```javascript
import {
  createTestShop,
  createTestContact,
  createTestCampaign,
  createTestHeaders,
  cleanupTestData,
} from '../helpers/test-utils.js';

import {
  verifyContactInDb,
  verifyCampaignInDb,
  verifyShopCredits,
} from '../helpers/test-db.js';
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterAll`
3. **Real Data**: Use realistic test data
4. **Verification**: Verify both API response and database state
5. **Error Cases**: Test both success and error scenarios

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Fast execution
- No external dependencies required
- Isolated test database
- Deterministic results

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database is running
2. **Prisma Client**: Run `npm run db:generate` before tests
3. **Environment Variables**: Check `.env.test` configuration
4. **Test Data**: Ensure test data is cleaned up between runs

### Debugging

Run individual test files:

```bash
npm test -- tests/integration/contacts.test.js
```

Run with verbose output:

```bash
npm test -- --verbose
```

## Coverage Goals

- **Current**: 61 endpoints tested
- **Target**: 100% endpoint coverage
- **Focus**: Critical business logic paths

## Notes

- Tests use a separate test database
- External services (Stripe, Shopify) may require mocking
- Some endpoints may need additional setup based on business logic
- Webhook tests may require signature validation mocks

