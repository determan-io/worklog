# WorkLog API Documentation

## Overview
WorkLog provides a RESTful API for time tracking, project management, and multi-tenant organization management. The API uses JWT tokens for authentication and follows REST conventions.

## Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.worklog.com/v1
```

## Authentication
All API requests require authentication via JWT tokens obtained from Keycloak.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Organization-ID: <organization_id>
```

## API Endpoints

### Authentication

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /auth/logout
```

### Organizations

#### Get User's Organizations
```http
GET /organizations
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "domain": "acme.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Organization Details
```http
GET /organizations/{id}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "domain": "acme.com",
    "settings": {
      "timezone": "America/New_York",
      "date_format": "MM/DD/YYYY"
    },
    "subscription_plan": "pro",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Customers

#### List Customers
```http
GET /customers?page=1&limit=20&search=acme
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name or email
- `active`: Filter by active status (default: true)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Client",
      "email": "contact@acme.com",
      "phone": "+1-555-0123",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip": "10001"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### Create Customer
```http
POST /customers
```

**Request Body:**
```json
{
  "name": "New Client",
  "email": "client@example.com",
  "phone": "+1-555-0123",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "billing_settings": {
    "currency": "USD",
    "payment_terms": "Net 30"
  }
}
```

#### Update Customer
```http
PUT /customers/{id}
```

#### Delete Customer
```http
DELETE /customers/{id}
```

### Projects

#### List Projects
```http
GET /projects?customer_id=uuid&status=active&billing_model=timesheet
```

**Query Parameters:**
- `customer_id`: Filter by customer
- `status`: Filter by status (planning, active, on-hold, completed, cancelled)
- `billing_model`: Filter by billing model (timesheet, task-based)
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Complete website redesign project",
      "customer": {
        "id": "uuid",
        "name": "Acme Client"
      },
      "billing_model": "timesheet",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "budget_hours": 200.0,
      "hourly_rate": 150.00,
      "is_billable": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

#### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "customer_id": "uuid",
  "sow_id": "uuid",
  "billing_model": "timesheet",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "budget_hours": 200.0,
  "hourly_rate": 150.00
}
```

### Time Entries

#### List Time Entries
```http
GET /time-entries?project_id=uuid&start_date=2024-01-01&end_date=2024-01-31
```

**Query Parameters:**
- `project_id`: Filter by project
- `user_id`: Filter by user (admin/manager only)
- `start_date`: Filter by start date (ISO 8601)
- `end_date`: Filter by end date (ISO 8601)
- `is_timer_active`: Filter by active timers
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "project": {
        "id": "uuid",
        "name": "Website Redesign",
        "customer": {
          "name": "Acme Client"
        }
      },
      "task_description": "Frontend development",
      "start_time": "2024-01-15T09:00:00Z",
      "end_time": "2024-01-15T17:00:00Z",
      "duration_minutes": 480,
      "duration_hours": 8.0,
      "is_timer_active": false,
      "is_billable": true,
      "hourly_rate": 150.00,
      "notes": "Completed header component",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Create Time Entry
```http
POST /time-entries
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "task_description": "Frontend development",
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T17:00:00Z",
  "is_billable": true,
  "notes": "Completed header component"
}
```

#### Start Timer
```http
POST /time-entries/start-timer
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "task_description": "Frontend development"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "start_time": "2024-01-15T09:00:00Z",
    "is_timer_active": true,
    "duration_minutes": 0
  }
}
```

#### Stop Timer
```http
POST /time-entries/{id}/stop-timer
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "start_time": "2024-01-15T09:00:00Z",
    "end_time": "2024-01-15T17:00:00Z",
    "duration_minutes": 480,
    "is_timer_active": false
  }
}
```

#### Update Time Entry
```http
PUT /time-entries/{id}
```

#### Delete Time Entry
```http
DELETE /time-entries/{id}
```

### Timesheets

#### List Timesheets
```http
GET /timesheets?user_id=uuid&status=draft&week_start=2024-01-01
```

**Query Parameters:**
- `user_id`: Filter by user (admin/manager only)
- `status`: Filter by status (draft, submitted, approved, rejected)
- `week_start`: Filter by week start date
- `page`: Page number
- `limit`: Items per page

#### Create Timesheet
```http
POST /timesheets
```

**Request Body:**
```json
{
  "week_start_date": "2024-01-01",
  "week_end_date": "2024-01-07"
}
```

#### Submit Timesheet
```http
POST /timesheets/{id}/submit
```

#### Approve Timesheet
```http
POST /timesheets/{id}/approve
```

**Request Body:**
```json
{
  "notes": "Approved with minor adjustments"
}
```

### Reports

#### Time Summary Report
```http
GET /reports/time-summary?start_date=2024-01-01&end_date=2024-01-31&group_by=project
```

**Query Parameters:**
- `start_date`: Report start date
- `end_date`: Report end date
- `group_by`: Group by (project, user, customer, day, week, month)
- `project_id`: Filter by project
- `user_id`: Filter by user
- `customer_id`: Filter by customer

**Response:**
```json
{
  "data": {
    "summary": {
      "total_hours": 160.0,
      "total_entries": 20,
      "billable_hours": 150.0,
      "non_billable_hours": 10.0
    },
    "by_project": [
      {
        "project_id": "uuid",
        "project_name": "Website Redesign",
        "customer_name": "Acme Client",
        "total_hours": 80.0,
        "billable_hours": 80.0,
        "entry_count": 10
      }
    ],
    "by_user": [
      {
        "user_id": "uuid",
        "user_name": "John Doe",
        "total_hours": 40.0,
        "entry_count": 5
      }
    ]
  }
}
```

#### Export Report
```http
GET /reports/export?type=csv&start_date=2024-01-01&end_date=2024-01-31
```

**Query Parameters:**
- `type`: Export format (csv, pdf, xlsx)
- `start_date`: Report start date
- `end_date`: Report end date
- `project_id`: Filter by project
- `user_id`: Filter by user

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Authentication required
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error

## Rate Limiting

### Limits
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Burst limit**: 50 requests per minute

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642252800
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## Filtering and Sorting

### Filtering
Use query parameters to filter results:
```http
GET /time-entries?project_id=uuid&start_date=2024-01-01&is_billable=true
```

### Sorting
Use `sort` parameter with field and direction:
```http
GET /time-entries?sort=start_time:desc
GET /time-entries?sort=created_at:asc
```

### Search
Use `search` parameter for text search:
```http
GET /customers?search=acme
GET /projects?search=website
```

## Webhooks (Future)

### Webhook Events
- `time_entry.created`
- `time_entry.updated`
- `time_entry.deleted`
- `timesheet.submitted`
- `timesheet.approved`
- `timesheet.rejected`

### Webhook Payload
```json
{
  "event": "time_entry.created",
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "user_id": "uuid",
    "start_time": "2024-01-15T09:00:00Z",
    "end_time": "2024-01-15T17:00:00Z"
  },
  "timestamp": "2024-01-15T17:00:00Z"
}
```