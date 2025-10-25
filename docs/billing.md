# WorkLog Billing Tracking System

## Overview
The billing tracking system ensures accurate financial records by tracking what has been billed, preventing double-billing, and maintaining a complete audit trail of billing activities.

## Key Requirements

### 1. Billing Status Tracking
- Track billing status for time entries and timesheets
- Prevent double-billing of the same time
- Support partial billing (e.g., billable vs non-billable hours)
- Maintain billing history and audit trail

### 2. Integration Points
- **QuickBooks Online**: Track QB invoice IDs and sync status
- **Manual Invoicing**: Track custom invoice numbers
- **Export Tracking**: Track CSV/PDF exports for billing

### 3. Billing Workflow
- **Draft**: Time entry created, not yet billed
- **Ready for Billing**: Approved and ready to be included in billing
- **Billed**: Included in an invoice or export
- **Paid**: Invoice has been paid (future enhancement)

## Database Schema

### Billing Status Tables

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

### Updated Time Entries Table
```sql
-- Add billing status to existing time_entries table
ALTER TABLE time_entries ADD COLUMN billing_status VARCHAR(50) DEFAULT 'unbilled' 
  CHECK (billing_status IN ('unbilled', 'ready_for_billing', 'billed', 'paid'));

ALTER TABLE time_entries ADD COLUMN billing_batch_id INTEGER REFERENCES billing_batches(id);
ALTER TABLE time_entries ADD COLUMN billing_item_id INTEGER REFERENCES billing_items(id);
ALTER TABLE time_entries ADD COLUMN billed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE time_entries ADD COLUMN billed_by INTEGER REFERENCES users(id);

CREATE INDEX idx_time_entries_billing_status ON time_entries(billing_status);
CREATE INDEX idx_time_entries_billing_batch_id ON time_entries(billing_batch_id);
```

### Updated Timesheets Table
```sql
-- Add billing status to existing timesheets table
ALTER TABLE timesheets ADD COLUMN billing_status VARCHAR(50) DEFAULT 'unbilled' 
  CHECK (billing_status IN ('unbilled', 'ready_for_billing', 'billed', 'paid'));

ALTER TABLE timesheets ADD COLUMN billing_batch_id INTEGER REFERENCES billing_batches(id);
ALTER TABLE timesheets ADD COLUMN billing_item_id INTEGER REFERENCES billing_items(id);
ALTER TABLE timesheets ADD COLUMN billed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE timesheets ADD COLUMN billed_by INTEGER REFERENCES users(id);

CREATE INDEX idx_timesheets_billing_status ON timesheets(billing_status);
CREATE INDEX idx_timesheets_billing_batch_id ON timesheets(billing_batch_id);
```

## Billing Workflow

### 1. Time Entry Lifecycle
```
Draft → Submitted → Approved → Ready for Billing → Billed → Paid
```

### 2. Billing Process
```typescript
interface BillingWorkflow {
  // 1. Mark time entries as ready for billing
  markReadyForBilling(timeEntryIds: string[]): Promise<void>;
  
  // 2. Create billing batch
  createBillingBatch(data: CreateBillingBatchData): Promise<BillingBatch>;
  
  // 3. Add items to batch
  addItemsToBatch(batchId: string, itemIds: string[]): Promise<void>;
  
  // 4. Generate invoice/export
  generateInvoice(batchId: string): Promise<InvoiceData>;
  
  // 5. Mark as billed
  markAsBilled(batchId: string, invoiceNumber: string): Promise<void>;
  
  // 6. Sync with QuickBooks (future)
  syncWithQuickBooks(batchId: string): Promise<void>;
}
```

## API Endpoints

### Billing Management
```http
# Get billing status for time entries
GET /api/v1/time-entries/billing-status?project_id={uuid}&status=unbilled

# Mark time entries as ready for billing
POST /api/v1/time-entries/mark-ready-for-billing
{
  "time_entry_uuids": ["uuid1", "uuid2"],
  "notes": "Ready for monthly billing"
}

# Create billing batch
POST /api/v1/billing-batches
{
  "project_id": "project-uuid",
  "batch_name": "January 2024 Billing",
  "batch_type": "invoice",
  "currency": "USD",
  "due_date": "2024-02-15"
}

# Add items to billing batch
POST /api/v1/billing-batches/{batch_uuid}/items
{
  "time_entry_uuids": ["uuid1", "uuid2"],
  "timesheet_uuids": ["uuid3", "uuid4"]
}

# Generate invoice
POST /api/v1/billing-batches/{batch_uuid}/generate-invoice
{
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-31"
}

# Mark batch as billed
PUT /api/v1/billing-batches/{batch_uuid}/mark-billed
{
  "invoice_number": "INV-2024-001",
  "billed_at": "2024-01-31T10:00:00Z"
}
```

### Billing Reports
```http
# Get billing summary
GET /api/v1/reports/billing-summary?start_date=2024-01-01&end_date=2024-01-31

# Get unbilled time entries
GET /api/v1/reports/unbilled-time?project_id={uuid}

# Get billing history
GET /api/v1/billing-history?time_entry_id={uuid}
```

## Billing Status Queries

### Check Billing Status
```sql
-- Get unbilled time entries for a project
SELECT 
  te.uuid,
  te.task_description,
  te.duration_hours,
  te.hourly_rate,
  te.billing_status,
  p.name as project_name,
  c.name as customer_name
FROM time_entries te
JOIN projects p ON te.project_id = p.id
JOIN customers c ON p.customer_id = c.id
WHERE te.organization_id = ? 
  AND te.project_id = ?
  AND te.billing_status = 'unbilled'
  AND te.is_billable = true
ORDER BY te.start_time;

-- Get billing summary by project
SELECT 
  p.name as project_name,
  c.name as customer_name,
  COUNT(te.id) as total_entries,
  SUM(te.duration_hours) as total_hours,
  SUM(te.duration_hours * te.hourly_rate) as total_amount,
  COUNT(CASE WHEN te.billing_status = 'unbilled' THEN 1 END) as unbilled_entries,
  SUM(CASE WHEN te.billing_status = 'unbilled' THEN te.duration_hours ELSE 0 END) as unbilled_hours,
  SUM(CASE WHEN te.billing_status = 'unbilled' THEN te.duration_hours * te.hourly_rate ELSE 0 END) as unbilled_amount
FROM time_entries te
JOIN projects p ON te.project_id = p.id
JOIN customers c ON p.customer_id = c.id
WHERE te.organization_id = ?
  AND te.is_billable = true
GROUP BY p.id, p.name, c.name
ORDER BY total_amount DESC;
```

## QuickBooks Integration (Future)

### Sync Status Tracking
```typescript
interface QuickBooksSync {
  billing_batch_id: string;
  quickbooks_invoice_id?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_date?: Date;
  error_message?: string;
  retry_count: number;
}

// Sync workflow
async function syncWithQuickBooks(batchId: string) {
  const batch = await getBillingBatch(batchId);
  
  try {
    // Create invoice in QuickBooks
    const qbInvoice = await quickbooksClient.createInvoice({
      customer_id: batch.customer.qb_customer_id,
      line_items: batch.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.unit_rate
      })),
      invoice_date: batch.invoice_date
    });
    
    // Update batch with QB invoice ID
    await updateBillingBatch(batchId, {
      quickbooks_invoice_id: qbInvoice.id,
      quickbooks_sync_status: 'synced',
      quickbooks_sync_date: new Date()
    });
    
    // Mark all items as billed
    await markItemsAsBilled(batch.items.map(item => item.id));
    
  } catch (error) {
    await updateBillingBatch(batchId, {
      quickbooks_sync_status: 'failed',
      error_message: error.message
    });
    throw error;
  }
}
```

## Billing Validation Rules

### Prevent Double-Billing
```typescript
// Validation before adding to billing batch
async function validateBillingItem(timeEntryId: string) {
  const timeEntry = await getTimeEntry(timeEntryId);
  
  if (timeEntry.billing_status === 'billed') {
    throw new Error('Time entry has already been billed');
  }
  
  if (timeEntry.billing_status === 'ready_for_billing' && timeEntry.billing_batch_id) {
    throw new Error('Time entry is already in a billing batch');
  }
  
  if (!timeEntry.is_billable) {
    throw new Error('Time entry is not billable');
  }
  
  return true;
}
```

### Billing Status Transitions
```typescript
const BILLING_STATUS_TRANSITIONS = {
  'unbilled': ['ready_for_billing'],
  'ready_for_billing': ['unbilled', 'billed'],
  'billed': ['paid'],
  'paid': [] // Final state
};

function canTransitionBillingStatus(from: string, to: string): boolean {
  return BILLING_STATUS_TRANSITIONS[from]?.includes(to) || false;
}
```

## Reporting and Analytics

### Billing Dashboard Metrics
```typescript
interface BillingMetrics {
  total_unbilled_hours: number;
  total_unbilled_amount: number;
  total_billed_this_month: number;
  total_paid_this_month: number;
  average_days_to_bill: number;
  billing_efficiency: number; // Percentage of time entries billed
}

// Get billing metrics for dashboard
async function getBillingMetrics(organizationId: string, dateRange: DateRange) {
  return {
    total_unbilled_hours: await getUnbilledHours(organizationId),
    total_unbilled_amount: await getUnbilledAmount(organizationId),
    total_billed_this_month: await getBilledAmount(organizationId, dateRange),
    total_paid_this_month: await getPaidAmount(organizationId, dateRange),
    average_days_to_bill: await getAverageDaysToBill(organizationId),
    billing_efficiency: await getBillingEfficiency(organizationId)
  };
}
```

## Security and Audit

### Billing Audit Trail
```typescript
// Log all billing actions
async function logBillingAction(action: BillingAction) {
  await createBillingHistory({
    organization_id: action.organization_id,
    time_entry_id: action.time_entry_id,
    timesheet_id: action.timesheet_id,
    billing_batch_id: action.billing_batch_id,
    action: action.type,
    previous_status: action.previous_status,
    new_status: action.new_status,
    amount: action.amount,
    notes: action.notes,
    performed_by: action.user_id,
    performed_at: new Date()
  });
}
```

### Access Control
```typescript
// Billing permissions
const BILLING_PERMISSIONS = {
  'admin': ['create_batch', 'mark_billed', 'view_all_billing'],
  'manager': ['create_batch', 'mark_billed', 'view_project_billing'],
  'employee': ['view_own_billing'],
  'client': ['view_project_billing']
};
```

This billing tracking system ensures accurate financial records, prevents double-billing, and provides a complete audit trail for all billing activities while preparing for future QuickBooks Online integration.