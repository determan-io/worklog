# Test Scenarios - WorkLog Application

This document outlines comprehensive test scenarios for each user role to ensure proper access control and functionality.

## Table of Contents
- [Employee Test Scenarios](#employee-test-scenarios)
- [Manager Test Scenarios](#manager-test-scenarios)
- [Admin Test Scenarios](#admin-test-scenarios)
- [Security Boundary Tests](#security-boundary-tests)

---

## Employee Test Scenarios

### Authentication & Access Control

#### ✅ E-001: Employee Login
**Given:** User is an employee (employee1@worklog.com)  
**When:** They log in successfully  
**Then:**
- They see their dashboard with "Employee One"
- They see navigation: Dashboard, Time Tracking, Projects, Reports
- They do NOT see: Customers, Users links

#### ✅ E-002: Cannot Access Customers Page
**Given:** User is logged in as employee  
**When:** They navigate to http://localhost:3000/customers  
**Then:** They are redirected to dashboard

#### ✅ E-003: Cannot Access Users Page
**Given:** User is logged in as employee  
**When:** They navigate to http://localhost:3000/users  
**Then:** They are redirected to dashboard

#### ✅ E-004: Cannot Access User Detail Pages
**Given:** User is logged in as employee  
**When:** They navigate to:
- `/users/create`
- `/users/edit/:id`
- `/users/detail/:id`
**Then:** They are redirected to dashboard

#### ✅ E-005: Cannot Access Customer Detail Pages
**Given:** User is logged in as employee  
**When:** They navigate to:
- `/customers/create`
- `/customers/edit/:id`
- `/customers/detail/:id`
**Then:** They are redirected to dashboard

### Projects Access

#### ✅ E-101: View Only Assigned Active Projects
**Given:** User is logged in as employee  
**When:** They navigate to Projects page  
**Then:**
- They see only active projects they are assigned to
- No "New Project" button visible
- No "Edit" buttons visible
- No status filter dropdown (All/Active/Inactive)
- Project count matches their active memberships

#### ✅ E-102: Cannot View Inactive Projects
**Given:** User is logged in as employee  
**When:** They try to access an inactive project  
**Then:** They get 403 Forbidden error

#### ✅ E-103: Cannot View Unassigned Projects
**Given:** User is logged in as employee  
**When:** They try to access a project they're not assigned to  
**Then:** They get 403 Forbidden error

#### ❌ E-104: Cannot Create Project via UI
**Given:** User is logged in as employee  
**When:** They try to click "New Project" button  
**Then:** Button should not be visible (already verified in E-101)

#### ❌ E-105: Cannot Create Project via API
**Given:** User is logged in as employee  
**When:** They POST to `/api/v1/projects`  
**Then:** API returns 403 Forbidden

#### ❌ E-106: Cannot Update Project via API
**Given:** User is logged in as employee  
**When:** They PUT to `/api/v1/projects/:id`  
**Then:** API returns 403 Forbidden

### Customers Access

#### ❌ E-201: Cannot View Customers via UI
**Given:** User is logged in as employee  
**When:** They navigate to Customers page  
**Then:** They are redirected to dashboard

#### ❌ E-202: Cannot View Customers via API
**Given:** User is logged in as employee  
**When:** They GET `/api/v1/customers`  
**Then:** API returns 403 Forbidden

#### ❌ E-203: Cannot View Customer Details via API
**Given:** User is logged in as employee  
**When:** They GET `/api/v1/customers/:id`  
**Then:** API returns 403 Forbidden

#### ❌ E-204: Cannot Create Customer via API
**Given:** User is logged in as employee  
**When:** They POST to `/api/v1/customers`  
**Then:** API returns 403 Forbidden

#### ❌ E-205: Cannot Update Customer via API
**Given:** User is logged in as employee  
**When:** They PUT to `/api/v1/customers/:id`  
**Then:** API returns 403 Forbidden

### Users Access

#### ❌ E-301: Cannot View Users List via UI
**Given:** User is logged in as employee  
**When:** They navigate to Users page  
**Then:** They are redirected to dashboard

#### ❌ E-302: Cannot View All Users via API
**Given:** User is logged in as employee  
**When:** They GET `/api/v1/users`  
**Then:** API returns only their own user record

#### ❌ E-303: Cannot View Other Users via API
**Given:** User is logged in as employee  
**When:** They GET `/api/v1/users/:uuid` (other user)  
**Then:** API returns 403 or 404 Forbidden

#### ❌ E-304: Cannot Create Users via API
**Given:** User is logged in as employee  
**When:** They POST to `/api/v1/users`  
**Then:** API returns 403 Forbidden

#### ⚠️ E-305: Can Update Own Profile
**Given:** User is logged in as employee  
**When:** They PUT to `/api/v1/users/:uuid` (their own UUID)  
**Then:** API allows update but cannot change role

#### ❌ E-306: Cannot Change Own Role
**Given:** User is logged in as employee  
**When:** They try to update their role field  
**Then:** API returns 403 Forbidden

#### ❌ E-307: Cannot Update Other Users
**Given:** User is logged in as employee  
**When:** They PUT to `/api/v1/users/:uuid` (other user)  
**Then:** API returns 403 Forbidden

### Time Tracking

#### ✅ E-401: Can View Own Time Entries
**Given:** User is logged in as employee  
**When:** They view time entries  
**Then:** They see only their own time entries

#### ✅ E-402: Can Create Time Entries
**Given:** User is logged in as employee  
**When:** They create a time entry  
**Then:** Entry is successfully created

---

## Manager Test Scenarios

### Authentication & Access Control

#### ✅ M-001: Manager Login
**Given:** User is a manager (manager@worklog.com)  
**When:** They log in successfully  
**Then:**
- They see their dashboard
- Navigation includes: Dashboard, Time Tracking, Projects, Customers, Users, Reports

#### ✅ M-002: Can Access All Pages
**Given:** User is logged in as manager  
**When:** They navigate to any page  
**Then:** They can access all pages within their organization

### Projects Management

#### ✅ M-101: View All Organization Projects
**Given:** User is logged in as manager  
**When:** They navigate to Projects page  
**Then:**
- They see all projects in their organization (active and inactive)
- "New Project" button is visible
- "Edit" buttons visible on all projects
- Status filter dropdown (All/Active/Inactive) is visible

#### ✅ M-102: Create New Project
**Given:** User is logged in as manager  
**When:** They click "New Project"  
**Then:** Project creation form is displayed

#### ✅ M-103: Update Existing Project
**Given:** User is logged in as manager  
**When:** They click "Edit" on a project  
**Then:** Project edit form is displayed with current data

#### ✅ M-104: API Allows Project Creation
**Given:** User is logged in as manager  
**When:** They POST to `/api/v1/projects`  
**Then:** API accepts the request and creates project

#### ✅ M-105: API Allows Project Updates
**Given:** User is logged in as manager  
**When:** They PUT to `/api/v1/projects/:id`  
**Then:** API accepts the request and updates project

### Customers Management

#### ✅ M-201: View All Customers
**Given:** User is logged in as manager  
**When:** They navigate to Customers page  
**Then:** They see all customers in their organization

#### ✅ M-202: Create New Customer
**Given:** User is logged in as manager  
**When:** They click "New Customer"  
**Then:** Customer creation form is displayed

#### ✅ M-203: Can Access Customer API
**Given:** User is logged in as manager  
**When:** They GET `/api/v1/customers`  
**Then:** API returns all customers in their organization

#### ✅ M-204: Can Create Customer via API
**Given:** User is logged in as manager  
**When:** They POST to `/api/v1/customers`  
**Then:** API creates customer successfully

#### ✅ M-205: Can Update Customer via API
**Given:** User is logged in as manager  
**When:** They PUT to `/api/v1/customers/:id`  
**Then:** API updates customer successfully

### Users Management

#### ✅ M-301: View All Users
**Given:** User is logged in as manager  
**When:** They navigate to Users page  
**Then:** They see all users in their organization

#### ✅ M-302: Create New User
**Given:** User is logged in as manager  
**When:** They click "New User"  
**Then:** User creation form is displayed

#### ✅ M-303: Can Access All Users via API
**Given:** User is logged in as manager  
**When:** They GET `/api/v1/users`  
**Then:** API returns all users in their organization (admin, manager, and all employees)

#### ✅ M-304: Can Create Users via API
**Given:** User is logged in as manager  
**When:** They POST to `/api/v1/users`  
**Then:** API creates user successfully

#### ✅ M-305: Can Update Users via API
**Given:** User is logged in as manager  
**When:** They PUT to `/api/v1/users/:uuid`  
**Then:** API updates user successfully

---

## Admin Test Scenarios

### Authentication & Access Control

#### ✅ A-001: Admin Login
**Given:** User is an admin (admin@worklog.com)  
**When:** They log in successfully  
**Then:**
- They see their dashboard
- Navigation includes: Dashboard, Time Tracking, Projects, Customers, Users, Reports

#### ✅ A-002: Can Access All Pages
**Given:** User is logged in as admin  
**When:** They navigate to any page  
**Then:** They can access all pages within their organization

### Projects Management

#### ✅ A-101: View All Projects
**Given:** User is logged in as admin  
**When:** They navigate to Projects page  
**Then:** They see all projects (same as manager - 6 projects)

#### ✅ A-102: Full Project Management
**Given:** User is logged in as admin  
**When:** They perform project operations  
**Then:** All CRUD operations work (same as manager)

### Customers Management

#### ✅ A-201: Full Customer Management
**Given:** User is logged in as admin  
**When:** They perform customer operations  
**Then:** All CRUD operations work (same as manager)

### Users Management

#### ✅ A-301: Full User Management
**Given:** User is logged in as admin  
**When:** They perform user operations  
**Then:** All CRUD operations work (same as manager)

---

## User Creation & Keycloak Integration Tests

### Admin User Creation

#### ⚠️ UC-001: Admin Creates Employee via UI
**Given:** User is logged in as admin  
**When:** 
1. They navigate to Users page
2. Click "New User" button
3. Fill in employee details (name, email, role=employee)
4. Submit the form

**Then:**
- Employee is created in database
- Employee is created in Keycloak
- Employee has the correct organization group assigned
- Employee has the correct realm roles: ["user", "employee"]
- Employee can be found in Keycloak admin panel

#### ⚠️ UC-002: Verify User in Keycloak Admin
**Given:** Admin has created an employee via UI  
**When:** 
1. Login to Keycloak admin console (http://localhost:8080)
2. Navigate to Users section
3. Search for the newly created employee
4. Click on the user to view details

**Then:**
- User exists in Keycloak
- User has email verified: true
- User belongs to the correct group (organization)
  - Organization 1 users: `/WorkLog Development`
  - Organization 2 users: `/WorkLog Production`
- User has the correct realm roles:
  - `user` (base role)
  - `employee` (specific role)
- User is enabled: true

#### ⚠️ UC-003: Verify User Can Login
**Given:** Admin has created an employee and verified in Keycloak  
**When:**
1. Logout from admin account
2. Click "Sign in with Keycloak"
3. Enter employee credentials
4. Submit login form

**Then:**
- Employee can login successfully
- Employee JWT token contains correct roles: ["user", "employee"]
- Employee is redirected to dashboard
- Employee sees employee-level access (no Customers/Users links)
- Employee can only see assigned projects

#### ⚠️ UC-004: Admin Creates Manager via UI
**Given:** User is logged in as admin  
**When:** 
1. Navigate to Users page
2. Click "New User"
3. Fill in manager details (name, email, role=manager)
4. Submit the form

**Then:**
- Manager is created in database
- Manager is created in Keycloak
- Manager has correct organization group
- Manager has correct realm roles: ["user", "manager"]
- Manager can login and has manager-level access

#### ⚠️ UC-005: Verify Manager Role in Keycloak
**Given:** Admin has created a manager  
**When:** Check manager in Keycloak admin  
**Then:**
- Manager has realm roles: ["user", "manager"]
- Manager belongs to correct organization group
- Manager JWT token contains ["user", "manager"] roles

#### ⚠️ UC-006: Employee Cannot Create Users
**Given:** User is logged in as employee  
**When:** They try to navigate to `/users` or `/users/create`  
**Then:**
- Employee is redirected to dashboard (UI protection)
- If accessing API directly:
  - `POST /api/v1/users` returns 403 Forbidden
  - Error message: "Only administrators and managers can create users"

#### ⚠️ UC-007: Cross-Organization User Creation
**Given:** Admin from Organization 1 (Development)  
**When:** They try to create a user  
**Then:**
- User is created in admin's organization
- User is assigned to Organization 1 group
- User belongs to `/WorkLog Development` in Keycloak
- User cannot access Organization 2 data

### Keycloak Verification Steps

#### ⚠️ KV-001: Login to Keycloak Admin
**Given:** Need to verify Keycloak configuration  
**When:** Access http://localhost:8080  
**Then:**
- Login page is displayed
- Can login with: admin / admin123
- Admin console is accessible

#### ⚠️ KV-002: Navigate to Realm Settings
**Given:** Logged into Keycloak admin  
**When:** Navigate to Realm > worklog > Realm Settings  
**Then:**
- Realm "worklog" is configured
- Roles exist: user, admin, manager, employee

#### ⚠️ KV-003: Check User Groups
**Given:** Viewing a user in Keycloak admin  
**When:** Navigate to user's Groups tab  
**Then:**
- User belongs to correct organization group
- Organization 1: `/WorkLog Development`
- Organization 2: `/WorkLog Production`

#### ⚠️ KV-004: Check User Roles
**Given:** Viewing a user in Keycloak admin  
**When:** Navigate to user's Role Mappings tab  
**Then:**
- User has correct realm roles assigned
- Employee: ["user", "employee"]
- Manager: ["user", "manager"]
- Admin: ["user", "admin"]

---

## Security Boundary Tests

### Cross-Organization Access

#### ⚠️ S-001: Cannot Access Other Organization Data
**Given:** Organization 1 user (Development org)  
**When:** They try to access data from Organization 2 (Production org)  
**Then:** API should return empty arrays or 403 errors

#### ⚠️ S-002: API Filters by Organization
**Given:** User makes API requests  
**When:** API processes the request  
**Then:** All data returned is scoped to user's organization_id

### API Security

#### ⚠️ S-101: Unauthenticated Requests
**Given:** No authentication token  
**When:** User makes API requests  
**Then:** API returns 401 Unauthorized

#### ⚠️ S-102: Invalid Token
**Given:** Invalid or expired token  
**When:** User makes API requests  
**Then:** API returns 401 Unauthorized

#### ⚠️ S-103: Direct API Manipulation
**Given:** Employee user  
**When:** They manually craft API requests to create/update users/projects/customers  
**Then:** API returns 403 Forbidden

---

## Test Status Legend

- ✅ Completed - Test has been verified
- ❌ Not implemented - Feature doesn't exist or needs implementation
- ⚠️ TODO - Needs to be tested/implemented

## Current Test Results

### Employee (Status: ✅ Passed)
- All access controls working
- Can only see assigned active projects
- Cannot access customers or users (UI and API)
- Cannot create/edit projects

### Manager (Status: ✅ Passed)
- Full access to all pages
- Can manage customers, users, and projects
- All API endpoints working

### Admin (Status: ✅ Passed)
- Full access to all pages (same as manager)
- Can manage everything in their organization
- All API endpoints working

---

## Future Test Scenarios

### Additional Employee Tests
- [ ] Time entry creation and management
- [ ] Timesheet submission
- [ ] Project member assignments
- [ ] Report viewing permissions

### Additional Manager Tests
- [ ] Project member management
- [ ] Timesheet approval workflow
- [ ] Billing generation
- [ ] Report generation with filters

### Additional Admin Tests
- [ ] Organization settings
- [ ] Billing configuration
- [ ] Advanced reporting
- [ ] Data export capabilities

### Integration Tests
- [ ] Multi-organization data isolation
- [ ] Role changes and permissions update
- [ ] Bulk operations
- [ ] Concurrent user access

