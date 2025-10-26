# WorkLog

A multi-tenant business time tracking application designed for organizations to manage employee time across multiple customers and projects.

## Overview

WorkLog is a comprehensive time tracking solution that enables organizations to:
- Track employee time across multiple customers and projects
- Support both timesheet-based and task-based billing models
- Provide mobile and web interfaces for time tracking
- Manage multi-tenant organizations with role-based access control

## Architecture

### Multi-Tenant Structure
- **Organizations**: Top-level tenants with isolated data
- **Customers**: Belong to organizations, have multiple projects
- **Projects**: Linked to customers and SOWs (Statement of Work), support two billing models:
  - **Task-Based**: Multiple time entries per day, flexible tracking
  - **Weekly Timesheet**: Weekly timecards with one entry per day
- **SOWs**: Define project scope, deliverables, and billing terms

### Billing Models
1. **Timesheet Billing**: Standard weekly timesheets with hours per day
2. **Task-Based Billing**: Multiple time entries per day, direct project allocation

### User Roles
- **Organization Admin**: Full organization management
- **Organization Manager**: Project and user management
- **Organization Employee**: Time tracking and reporting
- **Client Viewer**: Read-only project access (optional)

## Tech Stack

### Frontend
- **Web App**: React + TypeScript + Vite + Tailwind CSS
- **Mobile App**: React Native + TypeScript + Expo

### Backend
- **API Server**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Keycloak (OAuth2/OIDC)
- **API Documentation**: OpenAPI 3.0 with Swagger UI

### Development Tools
- **Code Quality**: ESLint, Prettier, Husky
- **Testing**: Jest, Cypress
- **API Docs**: Swagger/OpenAPI
- **Containerization**: Docker + Docker Compose

## Project Structure

```
worklog/
├── apps/
│   ├── web/                 # React web application
│   ├── mobile/              # React Native mobile app
│   └── api/                 # Node.js API server
├── packages/
│   ├── shared/              # Shared types and utilities
│   └── database/            # Prisma schema and migrations
├── infrastructure/
│   └── docker/              # Docker configurations
├── docs/                    # Project documentation
└── README.md               # This file
```

## Key Features

### Web Application
- Organization and user management
- **Customer Management**: Complete CRUD with search, filtering, and active/inactive status
- **Project Management**: Full CRUD with customer dropdown, search, and active/inactive status
- **Time Tracking**: Manual time entry with edit/delete capabilities
- Advanced reporting and analytics
- Timesheet management and approval
- Admin dashboard and settings
- **Consistent UI**: Standardized forms and buttons across all pages
- **Form Validation**: Comprehensive Zod validation for data integrity

### Mobile Application
- Employee time tracking
- Offline time tracking with sync
- Project selection and switching
- Simple, intuitive interface
- Background sync capabilities

### Core Functionality
- Multi-tenant data isolation
- Role-based access control
- Flexible time entry (timer + manual)
- Real-time time tracking
- Comprehensive reporting
- Data export capabilities

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm 8+
- PostgreSQL 14+
- Docker and Docker Compose
- Keycloak instance

### Development Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables
4. Start Keycloak instance
5. Run database migrations
6. Start development servers

### Environment Variables
See `.env.example` files in each app directory for required configuration.

## Documentation

- [API Documentation](./docs/api.md)
- [OpenAPI Specification](./docs/openapi.md)
- [Database Schema](./docs/database.md)
- [Approval Process](./docs/approval-process.md)
- [Billing](./docs/billing.md)
- [Mobile App Guide](./docs/mobile.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Guide](./docs/development.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Recent Updates (January 2025)

### Customer Management
- ✅ Complete CRUD operations with Zod validation
- ✅ Search and filter by active/inactive status
- ✅ Edit customer information and status
- ✅ Consistent UI with standardized forms

### Project Management
- ✅ Full CRUD with customer dropdown selection
- ✅ **Billing model selection** (Task-Based vs Weekly Timesheet)
- ✅ Active/inactive status management
- ✅ Search and filter functionality
- ✅ Edit project details and status
- ✅ Improved card/list layout

### Time Tracking
- ✅ Manual time entry only (timer removed per requirements)
- ✅ Edit and Delete buttons for time entries
- ✅ Enhanced button styling and layout
- ✅ Project and customer context display

### UI/UX Improvements
- ✅ Consistent button layouts across all pages
- ✅ Standardized form styling and validation
- ✅ Enhanced visual hierarchy
- ✅ Improved user experience

### Database Updates
- ✅ Added `is_active` field to Customer model
- ✅ Added `is_active` field to Project model
- ✅ Updated indexes for performance
- ✅ Dual-ID system (SERIAL + UUID) for optimal performance

## License

[License information to be added]

## Support

For support and questions, please [create an issue](../../issues) or contact the development team.