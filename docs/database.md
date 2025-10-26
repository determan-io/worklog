# WorkLog Database Schema

## Overview
WorkLog uses PostgreSQL as the primary database with Prisma as the ORM. The database is designed for multi-tenant architecture with organization-based data isolation.

## Database Design Principles

### Multi-Tenancy
- All tables include `organization_id` for tenant isolation
- Row-level security policies ensure data separation
- Foreign key constraints maintain referential integrity

### Dual ID System
- **Internal Correlation ID**: Integer-based SERIAL primary keys for optimal database performance
- **UUID**: Unique identifiers for all API access and external references
- **Benefits**: Better join performance, secure API access, easy correlation

### Data Integrity
- Dual ID system (SERIAL + UUID) for all entities
- Timestamps for audit trails
- Soft deletes where appropriate
- Validation constraints at database level
- Approval workflow support with email-based approvals

## Core Tables

### Organizations
The root entity for multi-tenancy.

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_uuid ON organizations(uuid);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_active ON organizations(is_active);
```

### Users
Users belong to organizations and have specific roles.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keycloak_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'client')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Customers
Customers belong to organizations and can have multiple projects.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB DEFAULT '{}',
  billing_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_active ON customers(is_active);
```

### SOWs (Statement of Work)
Define project scope, deliverables, and billing terms.

```sql
CREATE TABLE sows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  deliverables JSONB DEFAULT '[]',
  billing_terms JSONB DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  total_budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sows_organization_id ON sows(organization_id);
CREATE INDEX idx_sows_customer_id ON sows(customer_id);
CREATE INDEX idx_sows_status ON sows(status);
```

### Projects
Projects link customers to SOWs and define billing models.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sow_id UUID REFERENCES sows(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  billing_model VARCHAR(50) NOT NULL CHECK (billing_model IN ('timesheet', 'task-based')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  budget_hours DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  is_billable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_sow_id ON projects(sow_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_billing_model ON projects(billing_model);
CREATE INDEX idx_projects_active ON projects(is_active);
```

### Time Entries
Core time tracking data with support for both billing models.

```sql
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN start_time IS NOT NULL AND end_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL 
    END
  ) STORED,
  is_timer_active BOOLEAN DEFAULT FALSE,
  is_billable BOOLEAN DEFAULT TRUE,
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_time_entries_uuid ON time_entries(uuid);
CREATE INDEX idx_time_entries_organization_id ON time_entries(organization_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_timer_active ON time_entries(is_timer_active);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable);
CREATE INDEX idx_time_entries_status ON time_entries(status);
```

### Timesheets
Weekly timesheet management for timesheet billing model.

```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  total_hours DECIMAL(8,2) DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id, week_start_date)
);

CREATE INDEX idx_timesheets_organization_id ON timesheets(organization_id);
CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_timesheets_week_start ON timesheets(week_start_date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
```

### Timesheet Entries
Individual time entries within timesheets.

```sql
CREATE TABLE timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  hours_monday DECIMAL(4,2) DEFAULT 0,
  hours_tuesday DECIMAL(4,2) DEFAULT 0,
  hours_wednesday DECIMAL(4,2) DEFAULT 0,
  hours_thursday DECIMAL(4,2) DEFAULT 0,
  hours_friday DECIMAL(4,2) DEFAULT 0,
  hours_saturday DECIMAL(4,2) DEFAULT 0,
  hours_sunday DECIMAL(4,2) DEFAULT 0,
  task_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timesheet_entries_organization_id ON timesheet_entries(organization_id);
CREATE INDEX idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX idx_timesheet_entries_project_id ON timesheet_entries(project_id);
CREATE INDEX idx_timesheet_entries_entry_date ON timesheet_entries(entry_date);
```

### Approval Process Tables

#### Project Approval Workflows
```sql
CREATE TABLE project_approval_workflows (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_approval_workflows_uuid ON project_approval_workflows(uuid);
CREATE INDEX idx_project_approval_workflows_project_id ON project_approval_workflows(project_id);
CREATE INDEX idx_project_approval_workflows_active ON project_approval_workflows(is_active);
```

#### Approval Steps
```sql
CREATE TABLE approval_steps (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  workflow_id INTEGER NOT NULL REFERENCES project_approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  approver_type VARCHAR(50) NOT NULL CHECK (approver_type IN ('user', 'email')),
  approver_user_id INTEGER REFERENCES users(id),
  approver_email VARCHAR(255),
  approver_name VARCHAR(255),
  is_required BOOLEAN DEFAULT TRUE,
  auto_approve_after_days INTEGER, -- Auto-approve if no response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_steps_uuid ON approval_steps(uuid);
CREATE INDEX idx_approval_steps_workflow_id ON approval_steps(workflow_id);
CREATE INDEX idx_approval_steps_order ON approval_steps(workflow_id, step_order);
```

#### Approval Requests
```sql
CREATE TABLE approval_requests (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('timesheet', 'time_entry', 'project')),
  request_id INTEGER NOT NULL, -- ID of the timesheet, time_entry, or project
  workflow_id INTEGER NOT NULL REFERENCES project_approval_workflows(id),
  current_step_id INTEGER REFERENCES approval_steps(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_uuid ON approval_requests(uuid);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_type_id ON approval_requests(request_type, request_id);
CREATE INDEX idx_approval_requests_workflow ON approval_requests(workflow_id);
```

#### Approval Actions
```sql
CREATE TABLE approval_actions (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES approval_steps(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
  approver_type VARCHAR(50) NOT NULL CHECK (approver_type IN ('user', 'email')),
  approver_user_id INTEGER REFERENCES users(id),
  approver_email VARCHAR(255),
  approver_name VARCHAR(255),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_actions_uuid ON approval_actions(uuid);
CREATE INDEX idx_approval_actions_request_id ON approval_actions(approval_request_id);
CREATE INDEX idx_approval_actions_step_id ON approval_actions(step_id);
```

#### Email Approval Tokens
```sql
CREATE TABLE email_approval_tokens (
  id SERIAL PRIMARY KEY,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES approval_steps(id),
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_approval_tokens_token ON email_approval_tokens(token);
CREATE INDEX idx_email_approval_tokens_email ON email_approval_tokens(email);
CREATE INDEX idx_email_approval_tokens_expires ON email_approval_tokens(expires_at);
```

### Billing Tracking Tables

#### Billing Batches
```sql
CREATE TABLE billing_batches (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id), -- NULL for multi-project batches
  batch_name VARCHAR(255) NOT NULL,
  batch_type VARCHAR(50) NOT NULL CHECK (batch_type IN ('invoice', 'export', 'manual')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'paid', 'cancelled')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  invoice_number VARCHAR(255), -- QuickBooks invoice number or custom invoice number
  invoice_date DATE,
  due_date DATE,
  quickbooks_invoice_id VARCHAR(255), -- QB invoice ID for sync
  quickbooks_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (quickbooks_sync_status IN ('pending', 'synced', 'failed')),
  quickbooks_sync_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_batches_uuid ON billing_batches(uuid);
CREATE INDEX idx_billing_batches_organization_id ON billing_batches(organization_id);
CREATE INDEX idx_billing_batches_project_id ON billing_batches(project_id);
CREATE INDEX idx_billing_batches_status ON billing_batches(status);
CREATE INDEX idx_billing_batches_invoice_number ON billing_batches(invoice_number);
CREATE INDEX idx_billing_batches_quickbooks_id ON billing_batches(quickbooks_invoice_id);
```

#### Billing Items
```sql
CREATE TABLE billing_items (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  billing_batch_id INTEGER NOT NULL REFERENCES billing_batches(id) ON DELETE CASCADE,
  time_entry_id INTEGER REFERENCES time_entries(id), -- NULL for manual items
  timesheet_id INTEGER REFERENCES timesheets(id), -- NULL for individual time entries
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('time_entry', 'timesheet', 'manual')),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, -- Hours or units
  unit_rate DECIMAL(10,2) NOT NULL, -- Hourly rate or unit price
  total_amount DECIMAL(12,2) NOT NULL,
  is_billable BOOLEAN DEFAULT TRUE,
  billing_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_items_uuid ON billing_items(uuid);
CREATE INDEX idx_billing_items_batch_id ON billing_items(billing_batch_id);
CREATE INDEX idx_billing_items_time_entry_id ON billing_items(time_entry_id);
CREATE INDEX idx_billing_items_timesheet_id ON billing_items(timesheet_id);
CREATE INDEX idx_billing_items_billing_date ON billing_items(billing_date);
```

#### Billing History
```sql
CREATE TABLE billing_history (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  time_entry_id INTEGER REFERENCES time_entries(id),
  timesheet_id INTEGER REFERENCES timesheets(id),
  billing_batch_id INTEGER REFERENCES billing_batches(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'added_to_batch', 'removed_from_batch', 'billed', 'unbilled', 'paid', 'refunded')),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  amount DECIMAL(12,2),
  notes TEXT,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_history_uuid ON billing_history(uuid);
CREATE INDEX idx_billing_history_organization_id ON billing_history(organization_id);
CREATE INDEX idx_billing_history_time_entry_id ON billing_history(time_entry_id);
CREATE INDEX idx_billing_history_timesheet_id ON billing_history(timesheet_id);
CREATE INDEX idx_billing_history_billing_batch_id ON billing_history(billing_batch_id);
CREATE INDEX idx_billing_history_action ON billing_history(action);
CREATE INDEX idx_billing_history_performed_at ON billing_history(performed_at);
```

## Row-Level Security (RLS)

### Organization Isolation
All tables have RLS policies to ensure data isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for users table
CREATE POLICY users_organization_isolation ON users
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

## Database Functions

### Time Calculation Functions
```sql
-- Calculate total hours for a time entry
CREATE OR REPLACE FUNCTION calculate_time_entry_hours(
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL(8,2) AS $$
BEGIN
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600;
END;
$$ LANGUAGE plpgsql;

-- Get active timer for user
CREATE OR REPLACE FUNCTION get_active_timer(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  start_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT te.id, te.project_id, te.start_time
  FROM time_entries te
  WHERE te.user_id = user_uuid
    AND te.is_timer_active = TRUE
    AND te.organization_id = current_setting('app.current_organization_id')::UUID;
END;
$$ LANGUAGE plpgsql;
```

## Database Views

### Time Summary Views
```sql
-- Daily time summary for users
CREATE VIEW daily_time_summary AS
SELECT 
  te.organization_id,
  te.user_id,
  DATE(te.start_time) as entry_date,
  SUM(te.duration_minutes) / 60.0 as total_hours,
  COUNT(*) as entry_count
FROM time_entries te
WHERE te.start_time IS NOT NULL
  AND te.end_time IS NOT NULL
GROUP BY te.organization_id, te.user_id, DATE(te.start_time);

-- Project time summary
CREATE VIEW project_time_summary AS
SELECT 
  p.organization_id,
  p.id as project_id,
  p.name as project_name,
  c.name as customer_name,
  SUM(te.duration_minutes) / 60.0 as total_hours,
  COUNT(DISTINCT te.user_id) as user_count,
  COUNT(*) as entry_count
FROM projects p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN time_entries te ON p.id = te.project_id
WHERE te.start_time IS NOT NULL
  AND te.end_time IS NOT NULL
GROUP BY p.organization_id, p.id, p.name, c.name;
```

## Database Migrations

### Prisma Schema
```prisma
// This would be the Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  domain    String?  @unique
  settings  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users      User[]
  customers  Customer[]
  projects   Project[]
  timeEntries TimeEntry[]
  timesheets Timesheet[]

  @@map("organizations")
}

// ... other models
```

## Performance Optimization

### Indexes
- Primary keys on all tables
- Foreign key indexes for joins
- Composite indexes for common queries
- Partial indexes for filtered queries

### Query Optimization
- Use EXPLAIN ANALYZE for query analysis
- Implement proper pagination
- Use database functions for complex calculations
- Consider materialized views for heavy aggregations

### Maintenance
- Regular VACUUM and ANALYZE
- Monitor query performance
- Update table statistics
- Consider partitioning for large tables