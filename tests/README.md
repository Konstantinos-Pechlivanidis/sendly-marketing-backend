# 🧪 Tests Documentation

## Test Configuration

Τα tests τρέχουν **ενάντια στο production server** που τρέχει στο port 3000 και χρησιμοποιούν τα **production .env variables**.

## Environment Variables

Προσθέστε στο `.env` file σας τα παρακάτω variables για testing:

```bash
# Test Configuration
TEST_BASE_URL=http://localhost:3000          # Production server URL (default: http://localhost:3000)
TEST_SHOP_DOMAIN=test-store.myshopify.com    # Default test shop domain
TEST_SHOP_CREDITS=10000                      # Initial credits for test shops
TEST_DATA_PREFIX=TEST_                       # Prefix for test data identification
TEST_CLEANUP=true                            # Clean up test data after tests (set to 'false' to keep data)
TEST_AUTH_TOKEN=your_token_here              # Optional: Auth token for requests
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/campaigns.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Data

Τα tests **δημιουργούν πραγματικά δεδομένα** στο production database με prefix `TEST_` για εύκολη αναγνώριση.

### Test Data Prefix

Όλα τα test data έχουν prefix `TEST_` (configurable via `TEST_DATA_PREFIX`):
- Shops: `TEST_1234567890.myshopify.com`
- Contacts: `TEST_John`, `TEST_Doe`
- Campaigns: `TEST_Test Campaign 1234567890`

### Test Data Cleanup

Από default, τα test data διαγράφονται μετά τα tests. Για να τα κρατήσετε (για frontend testing):

```bash
TEST_CLEANUP=false npm test
```

## Test Structure

### Test Client

Τα tests χρησιμοποιούν custom test client που κάνει HTTP requests στο production server:

```javascript
import { request } from '../helpers/test-client.js';

// GET request
const res = await request()
  .get('/campaigns')
  .set({ 'X-Shopify-Shop-Domain': 'test-store.myshopify.com' });

// POST request
const res = await request()
  .post('/campaigns')
  .set(testHeaders)
  .send({ name: 'Test Campaign', message: 'Test message' });
```

### Test Helpers

```javascript
import {
  createTestShop,      // Create test shop in database
  createTestContact,   // Create test contact
  createTestCampaign,  // Create test campaign
  createTestHeaders,   // Create request headers
  cleanupTestData,     // Clean up test data
} from '../helpers/test-utils.js';
```

## Example Test

```javascript
import { request } from '../helpers/test-client.js';
import { createTestShop, createTestHeaders, cleanupTestData } from '../helpers/test-utils.js';

describe('Campaigns Endpoints', () => {
  let testShop;
  let testHeaders;

  beforeAll(async () => {
    // Create test shop in production database
    testShop = await createTestShop({
      shopDomain: 'TEST_campaigns-1234567890.myshopify.com',
      credits: 10000,
    });
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  it('should create a campaign', async () => {
    const res = await request()
      .post('/campaigns')
      .set(testHeaders)
      .send({
        name: 'Test Campaign',
        message: 'Test message',
        scheduleType: 'immediate',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });
});
```

## Production Server Requirements

⚠️ **Important:** Ο production server πρέπει να τρέχει στο port 3000 πριν τρέξετε τα tests:

```bash
# Start production server
npm start
# Server should run on http://localhost:3000
```

## Frontend Testing

Αφού τρέξετε τα tests, τα δεδομένα θα παραμείνουν στο database (αν `TEST_CLEANUP=false`). Μπορείτε να χρησιμοποιήσετε αυτά τα δεδομένα για frontend testing:

- **Test Shop Domain**: `TEST_1234567890.myshopify.com`
- **Test Contacts**: Με prefix `TEST_`
- **Test Campaigns**: Με prefix `TEST_`

## Troubleshooting

### Tests fail with connection error

- Βεβαιωθείτε ότι ο production server τρέχει στο port 3000
- Ελέγξτε ότι το `TEST_BASE_URL` στο `.env` είναι σωστό

### Tests fail with database error

- Ελέγξτε ότι το `DATABASE_URL` στο `.env` είναι σωστό
- Βεβαιωθείτε ότι η database connection είναι active

### Test data not cleaned up

- Ελέγξτε ότι `TEST_CLEANUP=true` στο `.env`
- Τα test data μπορεί να μην διαγράφονται αν τα tests crash

## Notes

- Τα tests δημιουργούν **πραγματικά δεδομένα** στο production database
- Χρησιμοποιήστε `TEST_CLEANUP=false` αν θέλετε να κρατήσετε τα δεδομένα για frontend testing
- Όλα τα test data έχουν prefix `TEST_` για εύκολη αναγνώριση
