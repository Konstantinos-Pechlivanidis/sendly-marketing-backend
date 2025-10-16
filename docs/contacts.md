# Contacts API Documentation

## Overview

The Contacts API provides comprehensive contact management functionality for SMS marketing campaigns. It supports CRUD operations, search, pagination, import/export, and advanced filtering.

## Base URL

```
/contacts
```

## Authentication

All endpoints require Shopify session token authentication via the `ensureShopContext` middleware.

## Endpoints

### 1. List Contacts

**GET** `/contacts`

Retrieve a paginated list of contacts with optional search and filtering.

#### Query Parameters

| Parameter      | Type    | Default   | Description                                                   |
| -------------- | ------- | --------- | ------------------------------------------------------------- |
| `page`         | integer | 1         | Page number (1-based)                                         |
| `limit`        | integer | 20        | Number of contacts per page (max 100)                         |
| `search`       | string  | -         | Search by name or phone number                                |
| `sortBy`       | string  | createdAt | Sort field (createdAt, firstName, phoneE164, smsConsentState) |
| `sortOrder`    | string  | desc      | Sort order (asc, desc)                                        |
| `consentState` | string  | -         | Filter by consent state (opted_in, opted_out, pending)        |
| `tags`         | string  | -         | Filter by tags (comma-separated)                              |

#### Response

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+1234567890",
        "email": "john@example.com",
        "smsConsentState": "opted_in",
        "smsConsentSource": "checkout",
        "smsConsentAt": "2024-01-15T10:30:00Z",
        "unsubscribedAt": null,
        "optedOut": false,
        "tagsJson": ["vip", "newsletter"],
        "welcomedAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "customerId": "shopify_customer_123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Single Contact

**GET** `/contacts/:id`

Retrieve detailed information about a specific contact.

#### Response

```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact_123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+1234567890",
      "email": "john@example.com",
      "smsConsentState": "opted_in",
      "smsConsentSource": "checkout",
      "smsConsentAt": "2024-01-15T10:30:00Z",
      "unsubscribedAt": null,
      "optedOut": false,
      "tagsJson": ["vip", "newsletter"],
      "welcomedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "customerId": "shopify_customer_123",
      "messages": [
        {
          "id": "msg_123",
          "body": "Welcome to our store!",
          "status": "delivered",
          "sentAt": "2024-01-15T10:35:00Z",
          "deliveredAt": "2024-01-15T10:35:30Z",
          "failedAt": null
        }
      ],
      "campaigns": [
        {
          "id": "camp_123",
          "name": "Welcome Series",
          "status": "completed",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ]
    }
  }
}
```

### 3. Create Contact

**POST** `/contacts`

Create a new contact.

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "tags": ["vip", "newsletter"],
  "consentState": "opted_in",
  "consentSource": "manual"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact_123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+1234567890",
      "email": "john@example.com",
      "smsConsentState": "opted_in",
      "tagsJson": ["vip", "newsletter"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 4. Update Contact

**PUT** `/contacts/:id`

Update an existing contact.

#### Request Body

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "tags": ["vip", "premium"],
  "consentState": "opted_in"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact_123",
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneE164": "+1234567890",
      "smsConsentState": "opted_in",
      "tagsJson": ["vip", "premium"],
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  }
}
```

### 5. Delete Contact

**DELETE** `/contacts/:id`

Soft delete a contact (anonymizes PII data).

#### Response

```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### 6. Import Contacts

**POST** `/contacts/import`

Import contacts from a CSV file.

#### Request (FormData)

- `file`: CSV file with columns: phone, firstName, lastName, email, tags
- `consentState`: Default consent state for imported contacts
- `consentSource`: Source identifier for imported contacts

#### Response

```json
{
  "success": true,
  "data": {
    "results": {
      "total": 100,
      "imported": 85,
      "skipped": 15,
      "errors": [
        {
          "row": 5,
          "error": "Invalid phone number format",
          "data": {
            "phone": "invalid-phone",
            "firstName": "John"
          }
        }
      ]
    }
  }
}
```

### 7. Get Contacts Statistics

**GET** `/contacts/stats`

Get aggregated statistics about contacts.

#### Response

```json
{
  "success": true,
  "data": {
    "total": 1500,
    "optedIn": 1200,
    "optedOut": 250,
    "recent": 50,
    "optInRate": 80,
    "bySource": {
      "checkout": 800,
      "manual": 300,
      "import": 200,
      "api": 200
    }
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "missing_phone",
  "message": "Phone number is required"
}
```

### 404 Not Found

```json
{
  "error": "contact_not_found",
  "message": "Contact not found"
}
```

### 409 Conflict

```json
{
  "error": "contact_exists",
  "message": "Contact with this phone number already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "contact_creation_failed",
  "message": "Failed to create contact"
}
```

## Data Models

### Contact

| Field              | Type    | Description                                       |
| ------------------ | ------- | ------------------------------------------------- |
| `id`               | string  | Unique contact identifier                         |
| `firstName`        | string  | Contact's first name                              |
| `lastName`         | string  | Contact's last name                               |
| `phoneE164`        | string  | Phone number in E.164 format                      |
| `email`            | string  | Contact's email address                           |
| `smsConsentState`  | string  | Consent state (opted_in, opted_out, pending)      |
| `smsConsentSource` | string  | Source of consent (checkout, manual, import, api) |
| `smsConsentAt`     | string  | ISO 8601 timestamp of consent                     |
| `unsubscribedAt`   | string  | ISO 8601 timestamp of unsubscription              |
| `optedOut`         | boolean | Whether contact has opted out                     |
| `tagsJson`         | array   | Array of tags associated with contact             |
| `welcomedAt`       | string  | ISO 8601 timestamp of welcome message             |
| `createdAt`        | string  | ISO 8601 timestamp of creation                    |
| `updatedAt`        | string  | ISO 8601 timestamp of last update                 |
| `customerId`       | string  | Shopify customer ID (if linked)                   |

## Security Considerations

- All PII data is encrypted at rest using AES-256-GCM
- Phone numbers are hashed for efficient lookups
- Audit logs are created for all contact modifications
- Soft delete preserves data integrity while anonymizing PII
- Rate limiting applies to all endpoints

## Rate Limits

- List contacts: 100 requests per minute
- Create/Update/Delete: 50 requests per minute
- Import: 10 requests per minute
- Stats: 200 requests per minute

## Examples

### Search Contacts by Name

```bash
curl -X GET "/contacts?search=John&limit=10" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Filter by Consent State

```bash
curl -X GET "/contacts?consentState=opted_in&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Create Contact with Tags

```bash
curl -X POST "/contacts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "tags": ["vip", "newsletter"],
    "consentState": "opted_in"
  }'
```

### Import Contacts from CSV

```bash
curl -X POST "/contacts/import" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -F "file=@contacts.csv" \
  -F "consentState=opted_in" \
  -F "consentSource=import"
```

## Frontend Integration

The Contacts page is designed to work seamlessly with Shopify App frontend using Polaris components. See `frontend-examples/Contacts.tsx` for a complete implementation example.

### Key Features

- **Responsive Design**: Works on all device sizes
- **Real-time Search**: Instant filtering as you type
- **Bulk Operations**: Select multiple contacts for batch actions
- **Import/Export**: CSV file support with validation
- **Advanced Filtering**: Filter by consent state, tags, and date ranges
- **Sorting**: Sort by any field in ascending or descending order
- **Pagination**: Efficient handling of large contact lists
- **Audit Trail**: Track all contact modifications
