# API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api` (development)
- **Response Format**: JSON
- **Authentication**: JWT via NextAuth (stored in session cookies)
- **Content-Type**: `application/json`

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "statusCode": 400,
  "details": {} // Optional additional error details
}
```

### Common Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 500 | Server Error | Unexpected server error |

## Authentication Endpoints

### Register User

Creates a new user account and sends OTP email.

```
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Validation**:
- Email: Must be valid email format, max 255 chars
- Password: Min 8 chars, alphanumeric + special chars recommended

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "message": "OTP sent to your email"
  }
}
```

**Error Responses**:
- 400: Invalid email format
- 409: Email already registered
- 500: Email sending failed

**Related**: See `OTP Endpoints` for verification flow

---

## OTP Endpoints

### Send OTP

Sends OTP code to user email. Can be used to resend if expired.

```
POST /api/otp/send
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 600 // seconds
  }
}
```

**Error Responses**:
- 400: Invalid email
- 404: User not found
- 500: Email sending failed

---

### Verify OTP

Verifies OTP code and marks user as verified.

```
POST /api/otp/verify
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Validation**:
- Code: Exactly 6 digits
- Email: Valid format
- Code must not be expired or already used

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "redirectUrl": "/login"
  }
}
```

**Error Responses**:
- 400: Invalid code format
- 404: Code not found or expired
- 409: Code already used

---

## Project Endpoints

### List Projects

Gets all projects for authenticated user.

```
GET /api/projects
```

**Query Parameters**:
```
?limit=20&skip=0      // Pagination
?status=draft         // Filter by status
?search=keyword       // Search in title/description
```

**Authentication**: Required (NextAuth session)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "title": "How to Learn TypeScript",
        "description": "A comprehensive guide...",
        "category": "Technology",
        "contentType": "Blog Post",
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T12:00:00Z"
      }
    ],
    "total": 5,
    "limit": 20,
    "skip": 0
  }
}
```

**Error Responses**:
- 401: Not authenticated

---

### Create Project

Creates a new project.

```
POST /api/projects
```

**Request Body**:
```json
{
  "title": "How to Learn TypeScript",
  "description": "A comprehensive guide for beginners",
  "category": "Technology",
  "contentType": "Blog Post"
}
```

**Validation**:
- title: Required, 1-200 characters
- description: Optional, max 500 characters
- category: Required, must be valid category
- contentType: Required, must be valid type

**Valid Categories**:
- Technology
- Business
- Health & Wellness
- Education
- Entertainment
- Sports
- Other

**Valid Content Types**:
- Blog Post
- Article
- Report
- Guide
- White Paper
- Case Study
- Tutorial
- Other

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "title": "How to Learn TypeScript",
    "description": "A comprehensive guide for beginners",
    "category": "Technology",
    "contentType": "Blog Post",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Not authenticated
- 403: Subscription limit exceeded (free plan)
- 500: Database error

---

### Get Project Details

Gets detailed information about a specific project.

```
GET /api/projects/:id
```

**Path Parameters**:
- `id`: Project ObjectId

**Authentication**: Required (must own project)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "How to Learn TypeScript",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "plan": {
      "outline": {
        "mainTopic": "How to Learn TypeScript",
        "sections": [
          {
            "title": "Introduction",
            "subsections": ["Why TypeScript?", "Benefits"],
            "estimatedLength": 300
          }
        ],
        "keyPoints": ["Type Safety", "Developer Experience"]
      }
    },
    "research": {
      "sections": [
        {
          "title": "Introduction",
          "content": "TypeScript is a superset of JavaScript...",
          "sources": [
            {
              "title": "TypeScript Documentation",
              "url": "https://www.typescriptlang.org",
              "snippet": "..."
            }
          ]
        }
      ]
    },
    "output": {
      "content": "# How to Learn TypeScript\n\n## Introduction\n\n...",
      "metadata": {
        "wordCount": 5200,
        "sections": 8,
        "generationTime": 145
      }
    },
    "evaluation": {
      "qualityScore": 85,
      "feedback": "Well-structured and comprehensive content",
      "suggestions": ["Add more code examples"],
      "readyForPublish": true
    }
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Don't have permission
- 404: Project not found

---

### Delete Project

Deletes a project and all associated data.

```
DELETE /api/projects/:id
```

**Path Parameters**:
- `id`: Project ObjectId

**Authentication**: Required (must own project)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Project deleted successfully",
    "deletedId": "507f1f77bcf86cd799439011"
  }
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Don't have permission
- 404: Project not found

---

### Get Project Status

Gets current generation status of a project.

```
GET /api/projects/:id/status
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "projectId": "507f1f77bcf86cd799439011",
    "status": "in_progress",
    "progress": {
      "planner": true,
      "researcher": true,
      "writer": false,
      "promptWriter": false,
      "evaluator": false
    },
    "currentAgent": "writer",
    "estimatedTimeRemaining": 30 // seconds
  }
}
```

---

## Pipeline Endpoints

### Run Content Generation

Starts the content generation pipeline for a project.

```
POST /api/pipeline/run
```

**Request Body**:
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "topic": "How to Learn TypeScript",
  "additionalContext": "Focus on practical examples for beginners"
}
```

**Validation**:
- projectId: Required, must exist and be owned by user
- topic: Required, 5-500 characters
- additionalContext: Optional, max 1000 characters

**Authorization Checks**:
- User must own the project
- Subscription plan checked:
  - Free: 5 generations/month
  - Pro: Unlimited
- Project must be in draft or failed status

**Success Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "projectId": "507f1f77bcf86cd799439011",
    "status": "in_progress",
    "message": "Content generation started",
    "estimatedTime": 300 // seconds
  }
}
```

**Process Flow**:
1. Validates input
2. Checks subscription limits
3. Updates project status to "in_progress"
4. Queues pipeline execution
5. Returns immediately (async)
6. WebSocket or polling for updates (optional)

**Error Responses**:
- 400: Invalid input
- 401: Not authenticated
- 403: Subscription limit exceeded or insufficient permissions
- 404: Project not found
- 409: Project already in progress

**Response Time**: 1-10 seconds depending on content complexity

---

## Export Endpoints

### Export Project Content

Exports generated content in specified format.

```
GET /api/export/:id?format=docx
```

**Path Parameters**:
- `id`: Project ObjectId

**Query Parameters**:
- `format`: Required, one of: `docx`, `pdf`

**Supported Formats**:

| Format | MIME Type | Size Limit |
|--------|-----------|-----------|
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 2MB |
| PDF | application/pdf | 2MB |

**Authentication**: Required (must own project)

**Success Response (200)**:
```
Binary file content
Headers:
  Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
  Content-Disposition: attachment; filename="project-title.docx"
```

**Error Responses**:
- 400: Invalid format specified
- 401: Not authenticated
- 403: Don't have permission
- 404: Project not found
- 409: Content not yet generated
- 500: Export generation failed

**Export Features**:
- **DOCX**: Formatted text, headings, page breaks, metadata
- **PDF**: Professional layout, page numbers, headers/footers

---

## Payment Endpoints

### Initialize Payment

Creates a payment link for subscription upgrade.

```
POST /api/payments/initialize
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "plan": "pro",
  "amount": 5000, // amount in kobo (NGN 50.00)
  "currency": "NGN"
}
```

**Validation**:
- email: Valid email format
- plan: 'free' or 'pro'
- amount: Must be > 0
- currency: 'NGN', 'GHS', etc.

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "...",
    "reference": "PAYSTACK_REF_123456"
  }
}
```

**Next Steps**: Redirect user to authorizationUrl in browser

**Error Responses**:
- 400: Invalid plan or amount
- 401: Not authenticated
- 500: Payment service error

---

### Payment Webhook

Paystack webhook endpoint - called automatically by Paystack.

```
POST /api/payments/webhook
```

**Headers** (set by Paystack):
```
X-Paystack-Signature: sha512_hash_of_payload
```

**Payload** (from Paystack):
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PAYSTACK_REF_123456",
    "amount": 5000,
    "status": "success",
    "customer": {
      "email": "user@example.com"
    }
  }
}
```

**Processing**:
1. Verify signature with PAYSTACK_SECRET_KEY
2. Create Payment record
3. Update Subscription status
4. Send confirmation email
5. Return 200 OK to Paystack

**Response (200)**:
```json
{
  "success": true
}
```

**Security**:
- Always verify signature
- Check event type
- Verify reference uniqueness

---

## Rate Limiting

**Currently Not Implemented** - Recommended for production:

```
- Unauthenticated: 10 requests/minute
- Authenticated: 100 requests/minute
- /api/pipeline/run: 5 requests/minute
```

Add with `express-rate-limit` or similar.

---

## Authentication

All endpoints except `/auth/register` and `/otp/*` require valid NextAuth session.

**Session Check**:
```typescript
// In API route
const session = await auth();
if (!session) {
  return json({ error: 'Unauthorized' }, 401);
}
const userId = session.user.id;
```

**Token Expiry**: 30 days

---

## CORS

Development: All origins allowed

Production: Restrict to:
```
- https://yourdomain.com
- https://www.yourdomain.com
- https://app.yourdomain.com
```

---

## Pagination

List endpoints support pagination:

```
GET /api/projects?limit=20&skip=0
```

**Defaults**:
- limit: 20 (max 100)
- skip: 0

**Response includes**:
- `total`: Total matching records
- `limit`: Items per page
- `skip`: Items skipped

---

## Search & Filtering

**Project Filtering**:
```
GET /api/projects?status=completed&category=Technology
```

**Available Filters**:
- status: draft, in_progress, completed
- category: Technology, Business, etc.
- search: Text search in title/description

---

## Webhooks

Currently only Paystack webhook is implemented. Future webhooks to consider:

- OpenRouter errors
- Search API failures
- Email delivery failures
- Generation timeouts

---

For integration examples and client code, see the frontend components in `components/` and `app/(dashboard)/`.
