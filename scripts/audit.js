import fs from 'fs';
import path from 'path';
import app from '../server/app.js';

function listRoutes() {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).filter(Boolean);
      routes.push({ path: m.route.path, methods });
    } else if (m.name === 'router' && m.handle.stack) {
      m.handle.stack.forEach((h) => {
        const r = h.route;
        if (r) {
          routes.push({ path: r.path, methods: Object.keys(r.methods).filter(Boolean) });
        }
      });
    }
  });
  return routes;
}

function wantEndpoints() {
  // Minimum set derived from your docs (Contacts, Campaigns, Templates, Reports, Dashboard, Discounts, Billing)
  return [
    // Dashboard
    { m: 'GET', p: '/dashboard/overview' },
    { m: 'GET', p: '/dashboard/quick-stats' },
    // Contacts
    { m: 'GET', p: '/contacts' },
    { m: 'GET', p: '/contacts/:id' },
    { m: 'POST', p: '/contacts' },
    { m: 'PUT', p: '/contacts/:id' },
    { m: 'DELETE', p: '/contacts/:id' },
    { m: 'POST', p: '/contacts/import' },
    { m: 'GET', p: '/contacts/stats/summary' },
    // Campaigns
    { m: 'GET', p: '/campaigns' },
    { m: 'GET', p: '/campaigns/:id' },
    { m: 'POST', p: '/campaigns' },
    { m: 'PUT', p: '/campaigns/:id' },
    { m: 'DELETE', p: '/campaigns/:id' },
    { m: 'POST', p: '/campaigns/:id/prepare' },
    { m: 'POST', p: '/campaigns/:id/send' },
    { m: 'PUT', p: '/campaigns/:id/schedule' },
    { m: 'GET', p: '/campaigns/:id/metrics' },
    { m: 'GET', p: '/campaigns/stats/summary' },
    // Templates
    { m: 'GET', p: '/templates' },
    { m: 'GET', p: '/templates/:id' },
    { m: 'GET', p: '/templates/categories' },
    { m: 'GET', p: '/templates/triggers' },
    { m: 'GET', p: '/templates/popular' },
    { m: 'GET', p: '/templates/stats' },
    { m: 'POST', p: '/templates/:id/use' },
    { m: 'POST', p: '/templates/preview' },
    // Reports
    { m: 'GET', p: '/reports/overview' },
    { m: 'GET', p: '/reports/campaigns' },
    { m: 'GET', p: '/reports/campaigns/:id' },
    { m: 'GET', p: '/reports/automations' },
    { m: 'GET', p: '/reports/messaging' },
    { m: 'GET', p: '/reports/revenue' },
    { m: 'GET', p: '/reports/export' },
    // Discounts
    { m: 'GET', p: '/discounts' },
    { m: 'GET', p: '/discounts/validate/:code' },
    { m: 'GET', p: '/discounts/campaign/:code' },
    { m: 'GET', p: '/discounts/apply-url' },
    { m: 'GET', p: '/discounts/search' },
    { m: 'GET', p: '/discounts/conflicts' },
    // Billing
    { m: 'GET', p: '/billing/packages' },
    { m: 'POST', p: '/billing/packages/seed' },
    { m: 'POST', p: '/billing/purchase/:packageId' },
    { m: 'GET', p: '/billing/balance' },
    { m: 'GET', p: '/billing/transactions' },
    // Provider webhooks
    { m: 'POST', p: '/webhooks/mitto/dlr' },
    { m: 'POST', p: '/webhooks/mitto/inbound' },
    // Health
    { m: 'GET', p: '/health' },
    { m: 'GET', p: '/health/config' },
    { m: 'GET', p: '/health/full' },
  ];
}

(function main() {
  const found = listRoutes();
  const missing = [];
  const want = wantEndpoints();
  const has = (m, p) =>
    found.some((r) => r.path === p && r.methods.map((x) => x.toUpperCase()).includes(m));
  for (const w of want) if (!has(w.m, w.p)) missing.push(w);
  console.log('== ROUTES SUMMARY ==');
  console.table(found);
  if (missing.length) {
    console.log('== MISSING ENDPOINTS ==');
    console.table(missing);
    process.exitCode = 1;
  } else {
    console.log('All required endpoints are present ✓');
  }
})();
