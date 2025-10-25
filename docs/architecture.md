# WorkLog Architecture

## System Overview

WorkLog is a multi-tenant time tracking application built with a modern, scalable architecture that supports both web and mobile clients.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Keycloak      │
│   (React)       │    │ (React Native)  │    │  (Auth Server)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │     (Express.js)          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Business Logic       │
                    │     (Node.js Services)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Data Layer           │
                    │     (PostgreSQL)          │
                    └───────────────────────────┘
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy
- **Database Level**: Organization-based row-level security
- **Application Level**: Organization context in all API calls
- **Authentication Level**: Keycloak realm-based user isolation

### Data Model Hierarchy
```
Organization
├── Users (with roles)
├── Customers
│   └── Projects
│       ├── SOW (Statement of Work)
│       ├── Time Entries
│       └── Tasks
└── Settings & Configuration
```

## Component Architecture

### 1. Web Application (React)
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-based page components
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── store/              # State management (React Query)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

### 2. Mobile Application (React Native)
```
src/
├── components/         # Reusable mobile components
├── screens/           # Screen components
├── navigation/        # Navigation configuration
├── services/          # API service layer
├── store/             # State management (React Query)
├── storage/           # Local storage (SQLite)
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### 3. API Server (Node.js)
```
src/
├── controllers/       # Request handlers
├── services/          # Business logic
├── middleware/        # Express middleware
├── routes/            # API route definitions
├── models/            # Data models (Prisma)
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
└── config/            # Configuration files
```

## Database Design

### Core Entities

#### Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  keycloak_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  billing_settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sow_id UUID REFERENCES sows(id),
  billing_model VARCHAR(50) NOT NULL, -- 'timesheet' or 'task-based'
  status VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE,
  budget_hours DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Time Entries
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  task_description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  is_timer_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Design

### RESTful Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get user profile

#### Organizations
- `GET /organizations` - List user's organizations
- `GET /organizations/:id` - Get organization details
- `PUT /organizations/:id` - Update organization

#### Customers
- `GET /customers` - List customers
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer details
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

#### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Time Entries
- `GET /time-entries` - List time entries
- `POST /time-entries` - Create time entry
- `GET /time-entries/:id` - Get time entry details
- `PUT /time-entries/:id` - Update time entry
- `DELETE /time-entries/:id` - Delete time entry
- `POST /time-entries/start-timer` - Start timer
- `POST /time-entries/stop-timer` - Stop timer

### GraphQL (Future Enhancement)
```graphql
type Query {
  projects: [Project!]!
  timeEntries(filter: TimeEntryFilter): [TimeEntry!]!
  reports(type: ReportType!): Report!
}

type Mutation {
  createTimeEntry(input: TimeEntryInput!): TimeEntry!
  startTimer(projectId: ID!): TimeEntry!
  stopTimer(entryId: ID!): TimeEntry!
}
```

## Security Architecture

### Authentication Flow
1. User authenticates with Keycloak
2. Keycloak returns JWT token with organization context
3. API validates JWT and extracts organization ID
4. All database queries filtered by organization ID

### Authorization Levels
1. **Organization Level**: User belongs to organization
2. **Resource Level**: User has permission to access resource
3. **Action Level**: User has permission to perform action

### Data Protection
- **Encryption**: All data encrypted in transit (TLS)
- **Token Security**: JWT tokens with short expiration
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection**: Prisma ORM prevents SQL injection

## Mobile Offline Architecture

### Offline Data Storage
- **SQLite Database**: Local data storage
- **Sync Queue**: Pending operations queue
- **Conflict Resolution**: Last-write-wins with timestamps

### Sync Strategy
1. **Background Sync**: Periodic sync when online
2. **Manual Sync**: User-triggered sync
3. **Conflict Detection**: Timestamp-based conflict detection
4. **Data Reconciliation**: Server-side conflict resolution

## Deployment Architecture

### Development Environment
```
┌─────────────────┐
│   Docker Compose│
├─────────────────┤
│   Web App       │
│   Mobile App    │
│   API Server    │
│   PostgreSQL    │
│   Keycloak      │
└─────────────────┘
```

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Keycloak      │
└─────────┬───────┘    │   (External)    │
          │            └─────────────────┘
          │
┌─────────┴───────┐
│   Web Servers   │
│   (Multiple)    │
└─────────┬───────┘
          │
┌─────────┴───────┐
│   API Servers   │
│   (Multiple)    │
└─────────┬───────┘
          │
┌─────────┴───────┐
│   PostgreSQL    │
│   (Primary)     │
└─────────────────┘
```

## Performance Considerations

### Database Optimization
- **Indexing**: Proper indexes on frequently queried columns
- **Query Optimization**: Efficient Prisma queries
- **Connection Pooling**: Database connection pooling
- **Caching**: Application-level caching (future)

### API Performance
- **Pagination**: All list endpoints paginated
- **Filtering**: Server-side filtering and sorting
- **Compression**: Gzip compression for API responses
- **Rate Limiting**: API rate limiting per user/organization

### Mobile Performance
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Optimized images and icons
- **Bundle Splitting**: Code splitting for smaller bundles
- **Offline First**: Offline-first data strategy

## Monitoring & Observability

### Logging
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, Info, Warn, Error
- **Correlation IDs**: Request tracing across services

### Metrics
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Time entries, user activity
- **Infrastructure Metrics**: CPU, memory, disk usage

### Health Checks
- **API Health**: `/health` endpoint
- **Database Health**: Database connection checks
- **External Dependencies**: Keycloak connectivity

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: API servers can be scaled horizontally
- **Database Scaling**: Read replicas for read-heavy operations
- **CDN**: Static assets served via CDN

### Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Database Tuning**: PostgreSQL configuration optimization
- **Caching Strategy**: Multi-level caching implementation