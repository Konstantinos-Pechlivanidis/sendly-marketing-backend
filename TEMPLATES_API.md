# Templates API Documentation

## Overview

The Templates module provides system-defined, read-only SMS templates that are available to all users. Templates are created and managed by administrators, while users can only view and use them for inspiration.

## Features

- **System-defined templates**: Pre-created by administrators
- **Read-only access**: Users cannot modify, delete, or create templates
- **Category-based organization**: Templates are organized by categories (Welcome, Promotional, etc.)
- **Search and filtering**: Find templates by category, keywords, or tags
- **Usage tracking**: Track which templates are most popular
- **No authentication required**: Templates are publicly accessible

## Database Schema

### Template Model

```prisma
model Template {
  id            String   @id @default(cuid())
  title         String
  category      String
  content       String
  previewImage  String?
  tags          String[] @default([])
  isPublic      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  usage         TemplateUsage[]
}
```

### TemplateUsage Model

```prisma
model TemplateUsage {
  id         String    @id @default(cuid())
  shopId     String
  templateId String
  usedCount  Int       @default(0)
  lastUsedAt DateTime?
  shop       Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  template   Template  @relation(fields: [templateId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Public Template Endpoints (No Authentication Required)

#### GET /api/templates

Get all public templates with optional filtering.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `search` (string, optional): Search in title, content, or tags
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_id",
        "title": "Welcome New Customer",
        "category": "Welcome",
        "content": "Welcome to {{shopName}}! Use code WELCOME10 for 10% off!",
        "previewImage": "https://example.com/image.jpg",
        "tags": ["welcome", "new-customer", "discount"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "categories": ["Welcome", "Promotional", "Order Updates"]
  }
}
```

#### GET /api/templates/:id

Get a single template by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_id",
    "title": "Welcome New Customer",
    "category": "Welcome",
    "content": "Welcome to {{shopName}}! Use code WELCOME10 for 10% off!",
    "previewImage": "https://example.com/image.jpg",
    "tags": ["welcome", "new-customer", "discount"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/templates/categories

Get all available template categories.

**Response:**
```json
{
  "success": true,
  "data": ["Welcome", "Promotional", "Order Updates", "Holiday Offers"]
}
```

#### POST /api/templates/:id/track

Track template usage for analytics (requires shop context).

**Response:**
```json
{
  "success": true,
  "message": "Template usage tracked"
}
```

### Admin Template Endpoints (Authentication Required)

#### GET /admin/templates

Get all templates for admin management (including private ones).

**Query Parameters:**
- `category` (string, optional): Filter by category
- `search` (string, optional): Search in title, content, or tags
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_id",
        "title": "Welcome New Customer",
        "category": "Welcome",
        "content": "Welcome to {{shopName}}! Use code WELCOME10 for 10% off!",
        "previewImage": "https://example.com/image.jpg",
        "tags": ["welcome", "new-customer", "discount"],
        "isPublic": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "usage": [
          {
            "shopId": "shop_id",
            "usedCount": 5,
            "lastUsedAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "total": 10,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### POST /admin/templates

Create a new template.

**Request Body:**
```json
{
  "title": "New Template",
  "category": "Promotional",
  "content": "Template content with {{variables}}",
  "previewImage": "https://example.com/image.jpg",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_id",
    "title": "New Template",
    "category": "Promotional",
    "content": "Template content with {{variables}}",
    "previewImage": "https://example.com/image.jpg",
    "tags": ["tag1", "tag2"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Template created successfully"
}
```

#### PUT /admin/templates/:id

Update a template.

**Request Body:**
```json
{
  "title": "Updated Template",
  "category": "Promotional",
  "content": "Updated content",
  "previewImage": "https://example.com/new-image.jpg",
  "tags": ["updated", "tags"],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_id",
    "title": "Updated Template",
    "category": "Promotional",
    "content": "Updated content",
    "previewImage": "https://example.com/new-image.jpg",
    "tags": ["updated", "tags"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Template updated successfully"
}
```

#### DELETE /admin/templates/:id

Delete a template.

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

#### GET /admin/templates/:id/stats

Get template usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "template_id",
      "title": "Welcome New Customer",
      "category": "Welcome"
    },
    "stats": {
      "totalUsage": 25,
      "uniqueShops": 5,
      "usage": [
        {
          "usedCount": 10,
          "lastUsedAt": "2024-01-01T00:00:00.000Z",
          "shop": {
            "shopDomain": "example.myshopify.com"
          }
        }
      ]
    }
  }
}
```

## Template Categories

The system includes the following predefined categories:

- **Welcome**: New customer onboarding
- **Abandoned Cart**: Cart abandonment recovery
- **Order Updates**: Order confirmation, shipping updates
- **Holiday Offers**: Birthday, holiday specials
- **Promotional**: Flash sales, general promotions
- **Inventory**: Back in stock notifications
- **Feedback**: Review requests, surveys
- **Re-engagement**: Win-back campaigns

## Template Variables

Templates support dynamic variables that can be replaced with actual values:

- `{{shopName}}`: Store name
- `{{firstName}}`: Customer's first name
- `{{lastName}}`: Customer's last name
- `{{orderNumber}}`: Order number
- `{{trackingLink}}`: Shipping tracking link
- `{{productName}}`: Product name
- `{{discountCode}}`: Discount code

## Usage Examples

### Get All Templates
```bash
curl -X GET "http://localhost:3000/api/templates"
```

### Filter by Category
```bash
curl -X GET "http://localhost:3000/api/templates?category=Welcome"
```

### Search Templates
```bash
curl -X GET "http://localhost:3000/api/templates?search=discount"
```

### Get Template Categories
```bash
curl -X GET "http://localhost:3000/api/templates/categories"
```

### Track Template Usage
```bash
curl -X POST "http://localhost:3000/api/templates/template_id/track" \
  -H "Content-Type: application/json"
```

## Seeding Templates

To populate the database with sample templates, run:

```bash
node scripts/seed-templates.js
```

This will create 10 sample templates across different categories with realistic content and tags.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common error codes:
- `400`: Bad Request (missing required fields)
- `404`: Not Found (template doesn't exist)
- `500`: Internal Server Error

## Security Considerations

- Public endpoints require no authentication
- Admin endpoints require proper authentication
- Template content is sanitized to prevent XSS
- Usage tracking respects shop context
- No sensitive data is exposed in public endpoints
