# WorkLog Approval Process Design

## Overview
WorkLog implements a flexible approval process that supports both user-based and email-based approvals. Each project can have its own approval workflow with managers and customers who may not have system accounts.

## Key Design Principles

### 1. Dual ID System
- **Internal Correlation ID**: Integer-based ID for internal database operations and relationships
- **UUID**: Used for all API access and external references
- **Benefits**: 
  - Better database performance with integer primary keys
  - Secure API access with non-sequential UUIDs
  - Easy correlation between related records

### 2. Flexible Approval Workflow
- **Project-Level Configuration**: Each project defines its own approval requirements
- **Mixed Approval Types**: Support both registered users and email-only approvers
- **Hierarchical Approval**: Support multiple approval levels (manager, customer, etc.)

## Data Model Updates

### Enhanced Tables with Dual ID System

#### Time Entries (Updated)
```sql
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  task_description TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  is_timer_active BOOLEAN DEFAULT FALSE,
  is_billable BOOLEAN DEFAULT TRUE,
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_time_entries_uuid ON time_entries(uuid);
CREATE INDEX idx_time_entries_status ON time_entries(status);
```

#### Timesheets (Updated)
```sql
CREATE TABLE timesheets (
  id SERIAL PRIMARY KEY,                    -- Internal correlation ID
  uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- API access ID
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  total_hours DECIMAL(8,2) DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id, week_start_date)
);

CREATE INDEX idx_timesheets_uuid ON timesheets(uuid);
CREATE INDEX idx_timesheets_status ON timesheets(status);
```

### New Approval Tables

#### Project Approval Workflows
```sql
CREATE TABLE project_approval_workflows (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_approval_workflows_project_id ON project_approval_workflows(project_id);
CREATE INDEX idx_project_approval_workflows_uuid ON project_approval_workflows(uuid);
```

#### Approval Steps
```sql
CREATE TABLE approval_steps (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  workflow_id INTEGER NOT NULL REFERENCES project_approval_workflows(id),
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

CREATE INDEX idx_approval_steps_workflow_id ON approval_steps(workflow_id);
CREATE INDEX idx_approval_steps_uuid ON approval_steps(uuid);
```

#### Approval Requests
```sql
CREATE TABLE approval_requests (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
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
```

#### Approval Actions
```sql
CREATE TABLE approval_actions (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id),
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

CREATE INDEX idx_approval_actions_request_id ON approval_actions(approval_request_id);
CREATE INDEX idx_approval_actions_uuid ON approval_actions(uuid);
```

#### Email Approval Tokens
```sql
CREATE TABLE email_approval_tokens (
  id SERIAL PRIMARY KEY,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id),
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

## Approval Process Flow

### 1. Timesheet Submission
```typescript
interface TimesheetSubmission {
  timesheet_uuid: string;
  project_uuid: string;
  approver_emails: string[];
  custom_message?: string;
}

// Process:
// 1. Create approval request
// 2. Generate email approval tokens
// 3. Send approval emails
// 4. Update timesheet status to 'submitted'
```

### 2. Email-Based Approval
```typescript
interface EmailApproval {
  token: string;
  action: 'approve' | 'reject';
  comments?: string;
  approver_name?: string;
}

// Process:
// 1. Validate token and check expiration
// 2. Record approval action
// 3. Move to next step or complete workflow
// 4. Send notification emails
```

### 3. User-Based Approval
```typescript
interface UserApproval {
  approval_request_uuid: string;
  step_uuid: string;
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
}

// Process:
// 1. Verify user permissions
// 2. Record approval action
// 3. Move to next step or complete workflow
// 4. Update request status
```

## API Endpoints

### Approval Management
```http
# Submit timesheet for approval
POST /api/v1/timesheets/{uuid}/submit
{
  "approver_emails": ["manager@company.com", "client@customer.com"],
  "custom_message": "Please review this week's timesheet"
}

# Get approval status
GET /api/v1/approval-requests/{uuid}

# User-based approval
POST /api/v1/approval-requests/{uuid}/approve
{
  "step_uuid": "step-uuid",
  "action": "approve",
  "comments": "Looks good!"
}

# Email-based approval (public endpoint)
POST /api/v1/approvals/email
{
  "token": "approval-token",
  "action": "approve",
  "comments": "Approved by manager",
  "approver_name": "John Manager"
}
```

### Email Approval Flow
```http
# Get approval details from token
GET /api/v1/approvals/email/{token}

# Submit email approval
POST /api/v1/approvals/email/{token}
{
  "action": "approve",
  "comments": "Approved",
  "approver_name": "Manager Name"
}
```

## Email Templates

### Approval Request Email
```html
<!DOCTYPE html>
<html>
<head>
    <title>Timesheet Approval Request</title>
</head>
<body>
    <h2>Timesheet Approval Required</h2>
    
    <p>Hello {{approver_name}},</p>
    
    <p>{{submitter_name}} has submitted a timesheet for your approval:</p>
    
    <ul>
        <li><strong>Project:</strong> {{project_name}}</li>
        <li><strong>Week:</strong> {{week_start}} to {{week_end}}</li>
        <li><strong>Total Hours:</strong> {{total_hours}}</li>
        <li><strong>Submitted:</strong> {{submitted_at}}</li>
    </ul>
    
    <p><strong>Message:</strong> {{custom_message}}</p>
    
    <div style="margin: 20px 0;">
        <a href="{{approve_url}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Approve</a>
        <a href="{{reject_url}}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-left: 10px;">Reject</a>
    </div>
    
    <p><small>This approval link expires on {{expires_at}}</small></p>
    
    <p>If you cannot click the buttons above, use these links:</p>
    <ul>
        <li>Approve: {{approve_url}}</li>
        <li>Reject: {{reject_url}}</li>
    </ul>
</body>
</html>
```

### Approval Confirmation Email
```html
<!DOCTYPE html>
<html>
<head>
    <title>Timesheet Approved</title>
</head>
<body>
    <h2>Timesheet Approved</h2>
    
    <p>Hello {{submitter_name}},</p>
    
    <p>Your timesheet has been approved by {{approver_name}}:</p>
    
    <ul>
        <li><strong>Project:</strong> {{project_name}}</li>
        <li><strong>Week:</strong> {{week_start}} to {{week_end}}</li>
        <li><strong>Total Hours:</strong> {{total_hours}}</li>
    </ul>
    
    <p><strong>Approver Comments:</strong> {{approver_comments}}</p>
    
    <p>Thank you for your time tracking!</p>
</body>
</html>
```

## Configuration Examples

### Project Approval Workflow Setup
```typescript
// Example: 2-step approval (Manager + Customer)
const workflow = {
  name: "Standard Project Approval",
  steps: [
    {
      step_order: 1,
      step_name: "Manager Approval",
      approver_type: "user",
      approver_user_id: manager_user_id,
      is_required: true,
      auto_approve_after_days: 3
    },
    {
      step_order: 2,
      step_name: "Customer Approval", 
      approver_type: "email",
      approver_email: "client@customer.com",
      approver_name: "Customer Contact",
      is_required: true,
      auto_approve_after_days: 7
    }
  ]
};
```

### Email-Only Approval Workflow
```typescript
// Example: Email-only approval for simple projects
const emailWorkflow = {
  name: "Email-Only Approval",
  steps: [
    {
      step_order: 1,
      step_name: "Client Approval",
      approver_type: "email",
      approver_email: "billing@client.com",
      approver_name: "Client Billing",
      is_required: true,
      auto_approve_after_days: 5
    }
  ]
};
```

## Security Considerations

### Token Security
- **Short Expiration**: Email tokens expire after 7 days
- **Single Use**: Tokens are invalidated after use
- **Secure Generation**: Cryptographically secure random tokens
- **Rate Limiting**: Limit approval attempts per token

### Data Protection
- **Email Encryption**: Sensitive data encrypted in emails
- **Audit Trail**: Complete approval history tracking
- **Access Control**: Role-based access to approval functions
- **Data Retention**: Configurable data retention policies

## Future Enhancements

### QuickBooks Online Integration
- **Invoice Generation**: Auto-generate invoices from approved timesheets
- **Customer Sync**: Sync customer data with QuickBooks
- **Project Mapping**: Map WorkLog projects to QuickBooks customers/items
- **Billing Export**: Export approved time entries to QuickBooks

### Advanced Features
- **Bulk Approvals**: Approve multiple timesheets at once
- **Delegation**: Allow approvers to delegate to others
- **Escalation**: Auto-escalate overdue approvals
- **Mobile Notifications**: Push notifications for approvals
- **Integration APIs**: Webhook support for external systems