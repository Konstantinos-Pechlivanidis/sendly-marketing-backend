# 📚 Sendly Marketing Backend - Επαγγελματική Τεκμηρίωση API

**Έκδοση**: 2.0  
**Ημερομηνία Ενημέρωσης**: Δεκέμβριος 2024  
**Κατάσταση**: Production Ready ✅

---

## 📋 Περιεχόμενα

1. [Εισαγωγή](#εισαγωγή)
2. [Επεξήγηση Business Flows](#επεξήγηση-business-flows)
3. [Dashboard Endpoints](#dashboard-endpoints)
4. [Contacts Endpoints](#contacts-endpoints)
5. [Campaigns Endpoints](#campaigns-endpoints)
6. [Automations Endpoints](#automations-endpoints)
7. [Billing & Credits Endpoints](#billing--credits-endpoints)
8. [Reports & Analytics Endpoints](#reports--analytics-endpoints)
9. [Templates Endpoints](#templates-endpoints)
10. [Audiences Endpoints](#audiences-endpoints)
11. [Settings Endpoints](#settings-endpoints)
12. [Tracking Endpoints](#tracking-endpoints)
13. [Discounts Endpoints](#discounts-endpoints)
14. [Webhooks](#webhooks)
15. [Authentication & Security](#authentication--security)
16. [Error Handling](#error-handling)

---

## 🎯 Εισαγωγή

### Σκοπός

Το Sendly Marketing Backend είναι μια ολοκληρωμένη πλατφόρμα SMS marketing που έχει σχεδιαστεί ειδικά για Shopify stores. Παρέχει αυτοματοποιημένες SMS καμπάνιες, διαχείριση επαφών, ενσωμάτωση χρεώσεων και λεπτομερή αναλυτικά στοιχεία.

### Βασικά Χαρακτηριστικά

- **Υποστήριξη Πολλαπλών Καταστημάτων**: Κάθε Shopify store έχει απομονωμένα δεδομένα
- **SMS Καμπάνιες**: Δημιουργία, προγραμματισμός και αποστολή στοχευμένων SMS καμπανιών
- **Διαχείριση Επαφών**: Εισαγωγή, διαχείριση και segmentation των πελατών
- **Αυτοματισμοί**: Μηνύματα γενεθλίων, ανάκτηση εγκαταλελειμμένων καλαθιών, κ.λπ.
- **Ενσωμάτωση Χρεώσεων**: Συστήματος credit με Stripe
- **Αναλυτικά**: Ολοκληρωμένες αναφορές και παρακολούθηση
- **Σύστημα Templates**: Προ-κατασκευασμένα SMS templates
- **Webhook Υποστήριξη**: Real-time παρακολούθηση παράδοσης

---

## 🔄 Επεξήγηση Business Flows

### 1. Campaign Creation & Sending Flow

**Σκοπός**: Δημιουργία και αποστολή SMS καμπάνιας

**Βήματα**:
1. **Δημιουργία Campaign** (`POST /campaigns`)
   - Ο χρήστης δημιουργεί μια νέα καμπάνια με όνομα, μήνυμα, audience, και schedule type
   - Το σύστημα δημιουργεί το campaign με status `draft`
   - Δημιουργείται record στα CampaignMetrics

2. **Προετοιμασία Campaign** (`POST /campaigns/:id/prepare`) - Προαιρετικό
   - Υπολογίζεται ο αριθμός των recipients χωρίς να αποσταλεί το campaign
   - Επιστρέφεται πληροφορία για validation
   - Δεν καταναλώνονται credits

3. **Αποστολή Campaign** (`POST /campaigns/:id/send`)
   - Επιλύονται οι recipients βάσει του audience
   - Επαληθεύονται τα credits (πρέπει να υπάρχουν αρκετά)
   - Καταναλώνονται τα credits (1 credit ανά SMS)
   - Το campaign status αλλάζει σε `sending`
   - Δημιουργούνται records στα CampaignRecipient
   - Προστίθεται το campaign στην queue για αποστολή

4. **Αποστολή SMS**
   - Το queue worker παίρνει το campaign
   - Αποστέλλονται τα SMS μέσω Mitto API
   - Κάθε SMS αποθηκεύεται με status `sent`
   - Το campaign status αλλάζει σε `sent` όταν ολοκληρωθεί

**Business Rules**:
- Μόνο `draft` campaigns μπορούν να αποσταλούν
- Πρέπει να υπάρχουν αρκετά credits
- Recipients πρέπει να έχουν `smsConsent: 'opted_in'`
- Campaigns με `scheduleType: 'scheduled'` δεν μπορούν να αποσταλούν αμέσως

---

### 2. Contact Import & Management Flow

**Σκοπός**: Εισαγωγή και διαχείριση επαφών πελατών

**Βήματα**:
1. **Εισαγωγή Contacts** (`POST /contacts/import`)
   - Ο χρήστης στέλνει array of contacts
   - Κάθε contact επαληθεύεται (phone format E.164)
   - Αν υπάρχει ήδη contact με το ίδιο phone, ενημερώνεται
   - Αν δεν υπάρχει, δημιουργείται νέο contact
   - Επιστρέφονται statistics (created, updated, skipped, errors)

2. **Δημιουργία Contact** (`POST /contacts`)
   - Επαλήθευση phone format (E.164)
   - Επαλήθευση email format (αν παρέχεται)
   - Δημιουργία contact record
   - Cache invalidation για contacts list και stats

3. **Ενημέρωση Contact** (`PUT /contacts/:id`)
   - Επαλήθευση των νέων δεδομένων
   - Ενημέρωση του contact record
   - Cache invalidation

4. **Διαγραφή Contact** (`DELETE /contacts/:id`)
   - Αφαίρεση του contact record
   - Cache invalidation

**Business Rules**:
- Phone number πρέπει να είναι σε E.164 format
- Duplicate detection βάσει phone number
- Contacts με `smsConsent: 'opted_out'` δεν λαμβάνουν SMS
- Birthday tracking για automation triggers

---

### 3. Credit Purchase Flow

**Σκοπός**: Αγορά credits για SMS αποστολές

**Βήματα**:
1. **Προβολή Packages** (`GET /billing/packages`)
   - Επιστρέφονται όλα τα διαθέσιμα credit packages
   - Κάθε package περιέχει: credits, price, currency, description

2. **Δημιουργία Purchase Session** (`POST /billing/purchase`)
   - Επιλέγεται package από τον χρήστη
   - Δημιουργείται BillingTransaction record με status `pending`
   - Δημιουργείται Stripe Checkout Session
   - Το transaction record ενημερώνεται με Stripe session ID
   - Επιστρέφεται session URL για redirect

3. **Stripe Payment Processing**
   - Ο χρήστης ολοκληρώνει την πληρωμή στο Stripe
   - Stripe στέλνει webhook στο `/webhooks/stripe`
   - Επαληθεύεται το webhook signature
   - Αν το event είναι `checkout.session.completed`:
     - Το transaction status αλλάζει σε `completed`
     - Προστίθενται credits στο shop balance
     - Δημιουργείται WalletTransaction record

4. **Credit Usage**
   - Όταν αποστέλλεται SMS, καταναλώνονται credits
   - Δημιουργείται WalletTransaction με type `debit`
   - Αν δεν υπάρχουν αρκετά credits, το request απορρίπτεται

**Business Rules**:
- Credits δεν λήγουν ποτέ
- Credits δεν μεταφέρονται μεταξύ stores
- Ανά SMS καταναλώνονται 1 credit
- Insufficient credits error όταν υπάρχουν < required credits

---

### 4. Automation Triggers Flow

**Σκοπός**: Αυτόματη αποστολή SMS βάσει events

**Βήματα**:
1. **Event Trigger** (από Shopify webhook ή scheduled job)
   - Παράδειγμα: Order created, Cart abandoned, Birthday
   - Το σύστημα εντοπίζει το event

2. **Automation Lookup**
   - Εύρεση active UserAutomation για το trigger event
   - Αν δεν υπάρχει, skip
   - Αν υπάρχει αλλά δεν είναι active, skip

3. **Contact Validation**
   - Εύρεση του contact
   - Επαλήθευση `smsConsent: 'opted_in'`
   - Αν δεν έχει consent, skip

4. **Credit Validation**
   - Επαλήθευση ότι υπάρχουν αρκετά credits
   - Αν δεν υπάρχουν, καταγράφεται skip στο AutomationLog

5. **Message Processing**
   - Προετοιμασία μηνύματος (template processing)
   - Αντικατάσταση variables ({{firstName}}, {{orderNumber}}, κ.λπ.)
   - Αποστολή SMS μέσω Mitto
   - Καταγραφή στο AutomationLog

**Business Rules**:
- Automations χρειάζονται active UserAutomation
- Contacts πρέπει να έχουν SMS consent
- Credits επαληθεύονται πριν την αποστολή
- Failed automations καταγράφονται στο AutomationLog

---

## 🏠 Dashboard Endpoints

### GET /dashboard/overview

**Σκοπός**: Λήψη ολοκληρωμένων δεδομένων dashboard

**Business Flow**:
1. Συλλογή SMS statistics (sent, delivered, failed, delivery rate)
2. Συλλογή contact statistics (total, opted_in, opted_out)
3. Συλλογή wallet balance
4. Συλλογή recent messages και transactions
5. Cache για 5 λεπτά

**Headers**:
```http
Authorization: Bearer <shopify_session_token>
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sms": {
      "sent": 1250,
      "delivered": 1180,
      "failed": 70,
      "deliveryRate": 0.944
    },
    "contacts": {
      "total": 2500,
      "optedIn": 2100,
      "optedOut": 400
    },
    "wallet": {
      "balance": 500,
      "currency": "EUR"
    },
    "recentMessages": [...],
    "recentTransactions": [...]
  }
}
```

**Rate Limit**: 100 requests/minute

---

### GET /dashboard/quick-stats

**Σκοπός**: Γρήγορα statistics για dashboard widgets

**Business Flow**:
1. Συλλογή βασικών metrics (sms sent, wallet balance)
2. Lightweight query για performance

**Response**:
```json
{
  "success": true,
  "data": {
    "smsSent": 1250,
    "walletBalance": 500
  }
}
```

**Rate Limit**: 100 requests/minute

---

## 👥 Contacts Endpoints

### GET /contacts

**Σκοπός**: Λίστα contacts με filtering, search, και pagination

**Business Flow**:
1. Εφαρμογή filters (consent status, gender, birthday, SMS consent)
2. Εφαρμογή search (name, email, phone)
3. Pagination
4. Cache για 2 λεπτά

**Query Parameters**:
- `page` (number, default: 1): Αριθμός σελίδας
- `pageSize` (number, default: 20, max: 100): Αντικείμενα ανά σελίδα
- `filter` (string): `all`, `consented`, `nonconsented`
- `search` (string): Αναζήτηση σε name, email, phone
- `gender` (string): `male`, `female`, `other`
- `smsConsent` (string): `opted_in`, `opted_out`, `unknown`
- `hasBirthDate` (boolean): Filter βάσει birthday availability

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "email": "john@example.com",
        "gender": "male",
        "birthDate": "1990-01-01",
        "smsConsent": "opted_in",
        "tags": ["vip", "newsletter"],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Rate Limit**: 60 requests/minute

---

### POST /contacts

**Σκοπός**: Δημιουργία νέου contact

**Business Flow**:
1. Επαλήθευση phone format (E.164)
2. Επαλήθευση email format (αν παρέχεται)
3. Έλεγχος για duplicate phone
4. Δημιουργία contact record
5. Cache invalidation

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306977123456",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01",
  "smsConsent": "opted_in",
  "tags": ["vip", "newsletter"]
}
```

**Validation Rules**:
- `phoneE164`: Required, E.164 format (+306977123456)
- `email`: Optional, valid email format
- `gender`: Optional, `male`, `female`, `other`
- `smsConsent`: Optional, `opted_in`, `opted_out`, `unknown`
- `birthDate`: Optional, ISO date, not in future

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00Z",
    "smsConsent": "opted_in",
    "tags": ["vip", "newsletter"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "message": "Contact created successfully"
}
```

**Rate Limit**: 60 requests/minute

---

### GET /contacts/:id

**Σκοπός**: Λήψη ενός contact

**Business Flow**:
1. Εύρεση contact by ID
2. Επαλήθευση ότι ανήκει στο store
3. Επιστροφή contact data

**Rate Limit**: 60 requests/minute

---

### PUT /contacts/:id

**Σκοπός**: Ενημέρωση contact

**Business Flow**:
1. Εύρεση contact
2. Επαλήθευση νέων δεδομένων
3. Ενημέρωση contact record
4. Cache invalidation

**Request Body**: (όλα τα fields είναι optional)
```json
{
  "email": "new-mail@example.com",
  "tags": ["customer", "newsletter"]
}
```

**Rate Limit**: 60 requests/minute

---

### DELETE /contacts/:id

**Σκοπός**: Διαγραφή contact

**Business Flow**:
1. Εύρεση contact
2. Διαγραφή contact record
3. Cache invalidation

**Rate Limit**: 60 requests/minute

---

### GET /contacts/stats

**Σκοπός**: Statistics για contacts

**Business Flow**:
1. Συλλογή statistics (total, opted_in, opted_out, by gender)
2. Cache για 5 λεπτά

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2100,
    "optedOut": 400,
    "unknown": 0,
    "byGender": {
      "male": 1200,
      "female": 1000,
      "other": 300
    }
  }
}
```

**Rate Limit**: 60 requests/minute

---

### GET /contacts/birthdays

**Σκοπός**: Contacts με γενέθλια

**Business Flow**:
1. Εύρεση contacts με birthdays στις επόμενες N ημέρες
2. Filtering βάσει SMS consent

**Query Parameters**:
- `daysAhead` (number, default: 7): Ημέρες μπροστά

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "birthDate": "1990-01-15",
        "phoneE164": "+306977123456"
      }
    ],
    "count": 10
  }
}
```

**Rate Limit**: 60 requests/minute

---

### POST /contacts/import

**Σκοπός**: Bulk import contacts

**Business Flow**:
1. Επαλήθευση κάθε contact
2. Έλεγχος για duplicates (phone)
3. Αν υπάρχει, update. Αν όχι, create
4. Συλλογή statistics
5. Cache invalidation

**Request Body**:
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306977123456",
      "email": "john@example.com",
      "smsConsent": "opted_in"
    },
    {
      "firstName": "Jane",
      "phoneE164": "+306988812345",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 2,
    "created": 2,
    "updated": 0,
    "skipped": 0,
    "errors": []
  },
  "message": "Successfully imported 2 contacts, updated 0, skipped 0"
}
```

**Rate Limit**: 3 requests/5 minutes (stricter για bulk operations)

---

## 📢 Campaigns Endpoints

### GET /campaigns

**Σκοπός**: Λίστα campaigns με filtering

**Business Flow**:
1. Εφαρμογή filters (status, date range)
2. Sorting
3. Pagination
4. Cache για 2 λεπτά

**Query Parameters**:
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `status` (string): `draft`, `scheduled`, `sending`, `sent`, `failed`, `cancelled`
- `sortBy` (string): `createdAt`, `updatedAt`, `name`, `scheduleAt`
- `sortOrder` (string): `asc`, `desc`

**Response**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Black Friday Sale",
        "message": "Get 50% off!",
        "audience": "all",
        "status": "sent",
        "scheduleType": "immediate",
        "createdAt": "2025-01-01T00:00:00Z",
        "metrics": {
          "sent": 1000,
          "delivered": 950,
          "failed": 50
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**Rate Limit**: 40 requests/minute

---

### POST /campaigns

**Σκοπός**: Δημιουργία νέας campaign

**Business Flow**:
1. Επαλήθευση campaign data
2. Δημιουργία campaign με status `draft`
3. Δημιουργία CampaignMetrics record
4. Cache invalidation

**Request Body**:
```json
{
  "name": "Black Friday Sale",
  "message": "Get 50% off everything! Use code BLACKFRIDAY",
  "audience": "all",
  "discountId": "discount_123",
  "scheduleType": "immediate",
  "scheduleAt": "2025-12-01T10:00:00Z",
  "recurringDays": null
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `message`: Required, 1-1600 characters
- `audience`: Optional, `all`, `male`, `female`, `men`, `women`, `segment:<id>`
- `scheduleType`: Required, `immediate`, `scheduled`, `recurring`
- `scheduleAt`: Required if `scheduleType` is `scheduled`, must be future date
- `recurringDays`: Required if `scheduleType` is `recurring`, 1-365 days

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Black Friday Sale",
    "message": "Get 50% off everything! Use code BLACKFRIDAY",
    "audience": "all",
    "status": "draft",
    "scheduleType": "immediate",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "message": "Campaign created successfully"
}
```

**Rate Limit**: 40 requests/minute

---

### GET /campaigns/:id

**Σκοπός**: Λήψη μιας campaign

**Business Flow**:
1. Εύρεση campaign by ID
2. Επαλήθευση ότι ανήκει στο store
3. Επιστροφή campaign data με metrics

**Rate Limit**: 40 requests/minute

---

### PUT /campaigns/:id

**Σκοπός**: Ενημέρωση campaign

**Business Flow**:
1. Εύρεση campaign
2. Έλεγχος ότι status είναι `draft` (για major changes)
3. Επαλήθευση νέων δεδομένων
4. Ενημέρωση campaign record
5. Cache invalidation

**Request Body**: (όλα optional)
```json
{
  "name": "Updated Campaign Name",
  "message": "Updated message",
  "audience": "male"
}
```

**Rate Limit**: 40 requests/minute

---

### DELETE /campaigns/:id

**Σκοπός**: Διαγραφή campaign

**Business Flow**:
1. Εύρεση campaign
2. Έλεγχος ότι status είναι `draft` ή `scheduled` (δεν μπορεί να διαγραφεί sent campaign)
3. Διαγραφή campaign record
4. Cache invalidation

**Rate Limit**: 40 requests/minute

---

### POST /campaigns/:id/prepare

**Σκοπός**: Προετοιμασία campaign (validation χωρίς αποστολή)

**Business Flow**:
1. Εύρεση campaign
2. Επίλυση recipients βάσει audience
3. Υπολογισμός recipient count
4. Επιστροφή validation info (δεν καταναλώνονται credits)

**Response**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "recipientCount": 1000,
    "estimatedCredits": 1000,
    "isValid": true,
    "warnings": []
  }
}
```

**Rate Limit**: 40 requests/minute

---

### POST /campaigns/:id/send

**Σκοπός**: Άμεση αποστολή campaign

**Business Flow**:
1. Εύρεση campaign
2. Έλεγχος ότι status είναι `draft`
3. Επίλυση recipients
4. Επαλήθευση credits (πρέπει να υπάρχουν αρκετά)
5. Κατανάλωση credits
6. Ενημέρωση campaign status σε `sending`
7. Δημιουργία CampaignRecipient records
8. Προσθήκη campaign στην queue

**Response**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "recipientCount": 1000,
    "status": "sending",
    "queuedAt": "2025-01-01T10:00:00Z"
  }
}
```

**Rate Limit**: 5 requests/minute (stricter για αποστολές)

---

### PUT /campaigns/:id/schedule

**Σκοπός**: Προγραμματισμός campaign

**Business Flow**:
1. Εύρεση campaign
2. Επαλήθευση schedule data
3. Ενημέρωση campaign με schedule information
4. Cache invalidation

**Request Body**:
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2025-12-01T10:00:00Z"
}
```

**Rate Limit**: 40 requests/minute

---

### GET /campaigns/:id/metrics

**Σκοπός**: Metrics για μια campaign

**Business Flow**:
1. Εύρεση campaign
2. Συλλογή metrics (sent, delivered, failed, delivery rate)
3. Cache για 1 λεπτό

**Response**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "sent": 1000,
    "delivered": 950,
    "failed": 50,
    "deliveryRate": 0.95,
    "opened": 0,
    "clicked": 0
  }
}
```

**Rate Limit**: 40 requests/minute

---

### GET /campaigns/stats/summary

**Σκοπός**: Συνολικά campaign statistics

**Business Flow**:
1. Συλλογή statistics για όλες τις campaigns
2. Aggregation metrics

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 50,
    "totalSent": 50000,
    "totalDelivered": 47500,
    "totalFailed": 2500,
    "averageDeliveryRate": 0.95
  }
}
```

**Rate Limit**: 40 requests/minute

---

## 🤖 Automations Endpoints

### GET /automations

**Σκοπός**: Λίστα automations για το store

**Business Flow**:
1. Εύρεση active UserAutomations για το store
2. Συλλογή Automation details
3. Επιστροφή automations list

**Response**:
```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "id": "automation_123",
        "name": "Birthday Wishes",
        "trigger": "birthday",
        "message": "Happy Birthday!",
        "isActive": true
      }
    ]
  }
}
```

**Rate Limit**: 100 requests/minute

---

### PUT /automations/:id

**Σκοπός**: Ενημέρωση automation

**Business Flow**:
1. Εύρεση UserAutomation
2. Ενημέρωση (message, isActive)
3. Cache invalidation

**Request Body**:
```json
{
  "userMessage": "Custom birthday message",
  "isActive": true
}
```

**Rate Limit**: 100 requests/minute

---

### GET /automations/stats

**Σκοπός**: Statistics για automations

**Business Flow**:
1. Συλλογή AutomationLog records
2. Aggregation (sent, skipped, failed)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSent": 500,
    "totalSkipped": 50,
    "totalFailed": 10,
    "byTrigger": {
      "birthday": 200,
      "cart_abandoned": 300
    }
  }
}
```

**Rate Limit**: 100 requests/minute

---

## 💳 Billing & Credits Endpoints

### GET /billing/balance

**Σκοπός**: Λήψη credit balance

**Business Flow**:
1. Εύρεση shop record
2. Επιστροφή credits balance
3. Cache για 30 δευτερόλεπτα

**Response**:
```json
{
  "success": true,
  "data": {
    "credits": 500,
    "balance": 500,
    "currency": "EUR"
  }
}
```

**Rate Limit**: 20 requests/minute

---

### GET /billing/packages

**Σκοπός**: Λίστα διαθέσιμων credit packages

**Business Flow**:
1. Επιστροφή hardcoded packages list
2. Κάθε package περιέχει: id, name, credits, price, currency, description

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "package_1000",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99,
      "currency": "EUR",
      "description": "Perfect for small businesses",
      "popular": false,
      "features": ["1,000 SMS messages", "No expiration"]
    },
    {
      "id": "package_5000",
      "name": "5,000 SMS Credits",
      "credits": 5000,
      "price": 129.99,
      "currency": "EUR",
      "popular": true
    }
  ]
}
```

**Rate Limit**: 20 requests/minute

---

### POST /billing/purchase

**Σκοπός**: Δημιουργία Stripe checkout session

**Business Flow**:
1. Επαλήθευση package ID
2. Εύρεση shop details
3. Επαλήθευση return URLs
4. Δημιουργία BillingTransaction με status `pending`
5. Δημιουργία Stripe Checkout Session
6. Ενημέρωση transaction με Stripe session ID
7. Επιστροφή session URL

**Request Body**:
```json
{
  "packageId": "package_1000",
  "successUrl": "https://yourapp.com/billing/success",
  "cancelUrl": "https://yourapp.com/billing/cancel"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123",
    "sessionUrl": "https://checkout.stripe.com/pay/cs_test_123",
    "transactionId": "txn_123",
    "package": {
      "id": "package_1000",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99
    }
  },
  "message": "Checkout session created successfully"
}
```

**Rate Limit**: 20 requests/minute

---

### GET /billing/history

**Σκοπός**: Transaction history

**Business Flow**:
1. Συλλογή WalletTransaction records
2. Filtering και pagination
3. Cache για 5 λεπτά

**Query Parameters**:
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `type` (string): `purchase`, `debit`, `credit`, `refund`, `adjustment`

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "purchase",
        "credits": 1000,
        "ref": "stripe:cs_test_123",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

**Rate Limit**: 20 requests/minute

---

### GET /billing/billing-history

**Σκοπός**: Billing history (Stripe transactions)

**Business Flow**:
1. Συλλογή BillingTransaction records
2. Filtering και pagination
3. Cache για 5 λεπτά

**Query Parameters**:
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `status` (string): `pending`, `completed`, `failed`

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "billing_txn_123",
        "packageType": "package_1000",
        "creditsAdded": 1000,
        "amount": 2999,
        "currency": "EUR",
        "status": "completed",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10
    }
  }
}
```

**Rate Limit**: 20 requests/minute

---

## 📊 Reports & Analytics Endpoints

### GET /reports/overview

**Σκοπός**: Overview αναφορών

**Business Flow**:
1. Συλλογή KPIs
2. Συλλογή campaign performance
3. Συλλογή automation insights
4. Συλλογή credit usage
5. Συλλογή contact insights

**Query Parameters**:
- `from` (ISO date): Start date
- `to` (ISO date): End date

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCampaigns": 50,
      "totalContacts": 2500,
      "totalSmsSent": 50000,
      "deliveryRate": 0.95,
      "creditsRemaining": 500
    },
    "campaignPerformance": {...},
    "automationInsights": {...},
    "creditUsage": {...},
    "contactInsights": {...}
  }
}
```

**Rate Limit**: 50 requests/minute

---

### GET /reports/kpis

**Σκοπός**: Key Performance Indicators

**Business Flow**:
1. Συλλογή βασικών metrics
2. Calculations για KPIs

**Rate Limit**: 50 requests/minute

---

### GET /reports/campaigns

**Σκοπός**: Campaign reports

**Business Flow**:
1. Συλλογή campaign performance data
2. Filtering βάσει date range, status
3. Pagination

**Query Parameters**:
- `from` (ISO date)
- `to` (ISO date)
- `status` (string)
- `page` (number)
- `limit` (number)

**Rate Limit**: 50 requests/minute

---

### GET /reports/campaigns/:id

**Σκοπός**: Detailed report για μια campaign

**Business Flow**:
1. Εύρεση campaign
2. Συλλογή detailed metrics
3. Delivery statistics
4. Timeline data

**Rate Limit**: 50 requests/minute

---

### GET /reports/automations

**Σκοπός**: Automation reports

**Business Flow**:
1. Συλλογή AutomationLog records
2. Aggregation by trigger type
3. Success/failure rates

**Rate Limit**: 50 requests/minute

---

### GET /reports/messaging

**Σκοπός**: Messaging reports

**Business Flow**:
1. Συλλογή message statistics
2. Delivery rates
3. Time-based analysis

**Rate Limit**: 50 requests/minute

---

### GET /reports/credits

**Σκοπός**: Credit usage reports

**Business Flow**:
1. Συλλογή credit usage data
2. Consumption patterns
3. Purchase history

**Rate Limit**: 50 requests/minute

---

### GET /reports/contacts

**Σκοπός**: Contact reports

**Business Flow**:
1. Συλλογή contact statistics
2. Growth trends
3. Segmentation data

**Rate Limit**: 50 requests/minute

---

### GET /reports/export

**Σκοπός**: Export reports

**Business Flow**:
1. Συλλογή data βάσει type
2. Format conversion (CSV, JSON)
3. File generation

**Query Parameters**:
- `type` (string): `campaigns`, `contacts`, `credits`
- `format` (string): `csv`, `json`
- `from` (ISO date)
- `to` (ISO date)

**Rate Limit**: 10 requests/minute (stricter για exports)

---

## 📄 Templates Endpoints

### GET /templates

**Σκοπός**: Λίστα public templates

**Business Flow**:
1. Συλλογή public templates
2. Filtering βάσει category, search
3. Pagination

**Query Parameters**:
- `category` (string): Filter by category
- `search` (string): Search in title and content
- `page` (number)
- `pageSize` (number)

**Response**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "title": "Welcome Message",
        "content": "Welcome to {{shopName}}!",
        "category": "welcome",
        "usageCount": 100
      }
    ]
  }
}
```

**Rate Limit**: 100 requests/minute (public endpoint)

---

### GET /templates/:id

**Σκοπός**: Λήψη ενός template

**Business Flow**:
1. Εύρεση template by ID
2. Επιστροφή template data

**Rate Limit**: 100 requests/minute

---

### POST /templates/:id/track

**Σκοπός**: Track template usage

**Business Flow**:
1. Εύρεση template
2. Increment usage count
3. Καταγραφή usage στο store context

**Rate Limit**: 100 requests/minute

---

### GET /templates/categories

**Σκοπός**: Λίστα template categories

**Business Flow**:
1. Συλλογή unique categories
2. Count per category

**Rate Limit**: 100 requests/minute

---

### GET /admin/templates

**Σκοπός**: Admin templates management

**Business Flow**:
1. Συλλογή όλων των templates (admin only)
2. Statistics

**Rate Limit**: 100 requests/minute

---

### POST /admin/templates

**Σκοπός**: Δημιουργία template (admin)

**Business Flow**:
1. Επαλήθευση template data
2. Δημιουργία template record

**Rate Limit**: 100 requests/minute

---

### PUT /admin/templates/:id

**Σκοπός**: Ενημέρωση template (admin)

**Business Flow**:
1. Εύρεση template
2. Ενημέρωση template data

**Rate Limit**: 100 requests/minute

---

### DELETE /admin/templates/:id

**Σκοπός**: Διαγραφή template (admin)

**Business Flow**:
1. Εύρεση template
2. Διαγραφή template record

**Rate Limit**: 100 requests/minute

---

### GET /admin/templates/:id/stats

**Σκοπός**: Statistics για template (admin)

**Business Flow**:
1. Συλλογή usage statistics
2. Stores που χρησιμοποιούν το template

**Rate Limit**: 100 requests/minute

---

## 🎯 Audiences Endpoints

### GET /audiences

**Σκοπός**: Λίστα predefined audiences

**Business Flow**:
1. Υπολογισμός contact counts για κάθε audience type
2. Συλλογή custom segments
3. Επιστροφή audiences list με counts

**Response**:
```json
{
  "success": true,
  "data": {
    "audiences": [
      {
        "id": "all",
        "name": "All (SMS Consented)",
        "description": "All contacts who have opted in",
        "type": "predefined",
        "contactCount": 2100,
        "isAvailable": true
      },
      {
        "id": "men",
        "name": "Men",
        "contactCount": 1200,
        "isAvailable": true
      },
      {
        "id": "women",
        "name": "Women",
        "contactCount": 900,
        "isAvailable": true
      }
    ]
  }
}
```

**Rate Limit**: 100 requests/minute

---

### GET /audiences/:audienceId/details

**Σκοπός**: Detailed audience με contact list

**Business Flow**:
1. Επίλυση audience (predefined ή segment)
2. Συλλογή contacts
3. Pagination

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Rate Limit**: 100 requests/minute

---

### POST /audiences/validate

**Σκοπός**: Validation audience selection

**Business Flow**:
1. Επαλήθευση audience ID
2. Υπολογισμός contact count
3. Validation checks

**Request Body**:
```json
{
  "audienceId": "all"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "audienceId": "all",
    "contactCount": 2100,
    "isValid": true
  }
}
```

**Rate Limit**: 100 requests/minute

---

## ⚙️ Settings Endpoints

### GET /settings

**Σκοπός**: Λήψη settings

**Business Flow**:
1. Συλλογή shop settings
2. Συλλογή shop info
3. Συλλογή recent transactions
4. Usage guide

**Response**:
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "shop_123",
      "shopDomain": "your-store.myshopify.com",
      "credits": 500
    },
    "settings": {
      "senderNumber": "+306977123456",
      "senderName": "YourStore",
      "timezone": "UTC",
      "defaultLanguage": "en"
    }
  }
}
```

**Rate Limit**: 100 requests/minute

---

### GET /settings/account

**Σκοπός**: Account information

**Business Flow**:
1. Συλλογή account details
2. Subscription info (αν υπάρχει)

**Rate Limit**: 100 requests/minute

---

### PUT /settings/sender

**Σκοπός**: Ενημέρωση sender number

**Business Flow**:
1. Επαλήθευση sender number format
2. Ενημέρωση ShopSettings
3. Cache invalidation

**Request Body**:
```json
{
  "senderNumber": "+306977123456",
  "senderName": "YourStore"
}
```

**Rate Limit**: 100 requests/minute

---

## 🔍 Tracking Endpoints

### GET /tracking/mitto/:messageId

**Σκοπός**: Delivery status για Mitto message

**Business Flow**:
1. Εύρεση message by Mitto message ID
2. Επιστροφή delivery status

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "mitto_msg_123",
    "status": "delivered",
    "deliveredAt": "2025-01-01T10:05:00Z"
  }
}
```

**Rate Limit**: 100 requests/minute

---

### GET /tracking/campaign/:campaignId

**Σκοπός**: Delivery status για όλα τα messages μιας campaign

**Business Flow**:
1. Εύρεση campaign
2. Συλλογή όλων των messages
3. Aggregation status

**Response**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "total": 1000,
    "sent": 1000,
    "delivered": 950,
    "failed": 50,
    "messages": [...]
  }
}
```

**Rate Limit**: 100 requests/minute

---

### POST /tracking/bulk-update

**Σκοπός**: Bulk update delivery status

**Business Flow**:
1. Επαλήθευση message IDs
2. Bulk update status
3. Cache invalidation

**Request Body**:
```json
{
  "updates": [
    {
      "messageId": "msg_123",
      "status": "delivered",
      "deliveredAt": "2025-01-01T10:05:00Z"
    }
  ]
}
```

**Rate Limit**: 100 requests/minute

---

## 🎟️ Discounts Endpoints

### GET /discounts

**Σκοπός**: Λίστα Shopify discounts

**Business Flow**:
1. Συλλογή discounts από Shopify API
2. Filtering και formatting
3. Επιστροφή discounts list

**Response**:
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount_123",
        "code": "BLACKFRIDAY",
        "title": "Black Friday Discount",
        "value": 50,
        "type": "percentage"
      }
    ]
  }
}
```

**Rate Limit**: 100 requests/minute

---

### GET /discounts/:id

**Σκοπός**: Λήψη ενός discount

**Business Flow**:
1. Εύρεση discount από Shopify API
2. Επιστροφή discount details

**Rate Limit**: 100 requests/minute

---

### GET /discounts/validate/:code

**Σκοπός**: Validation discount code

**Business Flow**:
1. Επαλήθευση discount code format
2. Validation στο Shopify
3. Επιστροφή validation result

**Rate Limit**: 100 requests/minute

---

## 🔔 Webhooks

### POST /webhooks/stripe

**Σκοπός**: Stripe webhook handler

**Business Flow**:
1. Επαλήθευση webhook signature
2. Αν event είναι `checkout.session.completed`:
   - Εύρεση transaction
   - Ενημέρωση status σε `completed`
   - Προσθήκη credits στο shop
   - Δημιουργία WalletTransaction
3. Αν event είναι `checkout.session.failed`:
   - Ενημέρωση transaction status σε `failed`

**Note**: No authentication required (Stripe signature verification)

---

### POST /webhooks/mitto/dlr

**Σκοπός**: Mitto delivery report webhook

**Business Flow**:
1. Επαλήθευση webhook data
2. Εύρεση message by Mitto message ID
3. Ενημέρωση delivery status
4. Cache invalidation

**Note**: No authentication required

---

### POST /webhooks/mitto/inbound

**Σκοπός**: Mitto inbound message webhook

**Business Flow**:
1. Επαλήθευση webhook data
2. Εύρεση contact by phone
3. Δημιουργία inbound message record
4. Trigger automation (αν χρειάζεται)

**Note**: No authentication required

---

### POST /automation-webhooks/shopify/orders/create

**Σκοπός**: Shopify order created webhook

**Business Flow**:
1. Επαλήθευση webhook data
2. Εύρεση contact από order
3. Trigger order confirmation automation
4. Queue automation job

**Note**: No authentication required (Shopify HMAC verification)

---

### POST /automation-webhooks/shopify/cart/abandoned

**Σκοπός**: Shopify abandoned cart webhook

**Business Flow**:
1. Επαλήθευση webhook data
2. Εύρεση contact
3. Trigger abandoned cart automation
4. Queue automation job

**Note**: No authentication required

---

### POST /automation-webhooks/trigger

**Σκοπός**: Manual automation trigger (testing)

**Business Flow**:
1. Επαλήθευση trigger data
2. Trigger automation manually
3. Επιστροφή result

**Rate Limit**: 100 requests/minute

---

## 🔐 Authentication & Security

### Authentication Flow

1. **Shopify App Bridge** παρέχει session token στο frontend
2. **Frontend** στέλνει token στο `Authorization: Bearer <token>` header
3. **Backend** επαληθεύει token και εξάγει shop domain
4. **Store Resolution** middleware βρίσκει/δημιουργεί shop record
5. **Όλες οι επόμενες operations** είναι scoped στο shop

### Required Headers

```http
Authorization: Bearer <shopify_session_token>
Content-Type: application/json
X-Shopify-Shop-Domain: your-store.myshopify.com
```

### Store Scoping

Κάθε database operation αυτόματα περιλαμβάνει `shopId` filtering:

```javascript
// Example: Getting contacts for a store
const contacts = await prisma.contact.findMany({
  where: { shopId: storeId }, // Automatically scoped
});
```

---

## ❌ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "error_type",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format"
    }
  ],
  "timestamp": "2025-01-01T00:00:00Z",
  "path": "/contacts",
  "method": "POST",
  "requestId": "req_1234567890"
}
```

### Common Error Codes

| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | ValidationError | Invalid input data |
| 401 | AuthenticationError | Invalid or missing token |
| 403 | AuthorizationError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | ConflictError | Duplicate resource |
| 429 | RateLimitError | Too many requests |
| 500 | InternalError | Server error |

### Validation Errors

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format (e.g., +306977123456)"
    }
  ]
}
```

### Rate Limit Errors

```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 🚦 Rate Limiting

### Rate Limit Tiers

| Endpoint Type | Limit | Window | Description |
|--------------|-------|--------|-------------|
| General API | 100 req/min | Per store | Most endpoints |
| Contacts | 60 req/min | Per store | Contact operations |
| Campaigns | 40 req/min | Per store | Campaign operations |
| Campaign Send | 5 req/min | Per store | Sending campaigns |
| Billing | 20 req/min | Per store | Billing operations |
| Import | 3 req/5min | Per store | Bulk import operations |
| Reports | 50/30/10 req/min | Per store | Report generation |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Per-Store Isolation

Κάθε Shopify store έχει independent rate limits:

```
Store A: 100/100 requests used → Rate limited
Store B: 10/100 requests used → Allowed
```

---

## 📝 Συνοπτικά Business Flows

### 1. Complete Campaign Flow

```
1. POST /campaigns → Create draft campaign
2. POST /campaigns/:id/prepare → Validate (optional)
3. POST /campaigns/:id/send → Send campaign
4. GET /campaigns/:id/metrics → View metrics
5. GET /reports/campaigns/:id → Detailed report
```

### 2. Complete Contact Management Flow

```
1. POST /contacts/import → Bulk import
2. GET /contacts → List contacts
3. PUT /contacts/:id → Update contact
4. GET /contacts/stats → View statistics
5. GET /contacts/birthdays → Get birthday contacts
```

### 3. Complete Billing Flow

```
1. GET /billing/balance → Check balance
2. GET /billing/packages → View packages
3. POST /billing/purchase → Create purchase
4. [Stripe Checkout] → Complete payment
5. [Webhook] → Credits added automatically
6. GET /billing/history → View transactions
```

### 4. Automation Flow

```
1. [Event Trigger] → Shopify webhook or scheduled job
2. [Automation Lookup] → Find active automation
3. [Contact Validation] → Check SMS consent
4. [Credit Validation] → Check available credits
5. [Message Send] → Send SMS via Mitto
6. [Logging] → Record in AutomationLog
```

---

**Τέλος Τεκμηρίωσης**

**Έκδοση**: 2.0  
**Ημερομηνία Ενημέρωσης**: Δεκέμβριος 2024  
**Κατάσταση**: Production Ready ✅

