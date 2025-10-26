# WorkLog Development Guide

## Getting Started

### Prerequisites
- Node.js 20+ and pnpm 8+
- PostgreSQL 16+
- Docker and Docker Compose
- Keycloak instance (local or cloud)
- Git

### Development Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/worklog.git
cd worklog
```

2. **Install dependencies**
```bash
# Install root dependencies
pnpm install

# Install dependencies for each app
pnpm run install:all
```

3. **Set up environment variables**
```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

4. **Start infrastructure services**
```bash
# Start PostgreSQL and Keycloak
docker-compose up -d

# Run database migrations
pnpm run db:migrate

# Seed development data
pnpm run db:seed
```

6. **Start development servers**
```bash
# Start all services
pnpm run dev

# Or start individually
pnpm run dev:api    # API server on port 3001
pnpm run dev:web    # Web app on port 3000
pnpm run dev:mobile # Mobile app (Expo)
```

## Infrastructure Services

### PostgreSQL Database
- **Host**: localhost:5432
- **Database**: worklog
- **Username**: worklog
- **Password**: worklog123

### Keycloak Authentication
- **Admin Console**: http://localhost:8080/admin
- **Realm**: worklog
- **Admin User**: admin / admin123
- **Test User**: user / user123

### Access Points
- **Keycloak Admin Console**: http://localhost:8080/admin
- **Worklog Realm**: http://localhost:8080/realms/worklog
- **Realm Account Management**: http://localhost:8080/realms/worklog/account

7. **Access API Documentation**
```bash
# Open Swagger UI in browser
open http://localhost:3001/api-docs

# View OpenAPI JSON specification
curl http://localhost:3001/api-docs.json
```

## Project Structure

```
worklog/
├── apps/
│   ├── web/                 # React web application
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── pages/       # Route-based pages
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── services/    # API services
│   │   │   ├── store/       # State management
│   │   │   ├── types/       # TypeScript types
│   │   │   └── utils/       # Utility functions
│   │   ├── public/          # Static assets
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── mobile/              # React Native mobile app
│   │   ├── src/
│   │   │   ├── components/  # Mobile components
│   │   │   ├── screens/     # Screen components
│   │   │   ├── navigation/  # Navigation setup
│   │   │   ├── services/    # API and storage services
│   │   │   ├── store/       # State management
│   │   │   ├── storage/     # Local database
│   │   │   └── types/       # TypeScript types
│   │   ├── app.json         # Expo configuration
│   │   └── package.json
│   └── api/                 # Node.js API server
│       ├── src/
│       │   ├── controllers/ # Request handlers
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   ├── routes/      # API routes
│       │   ├── models/      # Data models
│       │   ├── utils/       # Utility functions
│       │   └── config/      # Configuration
│       ├── prisma/          # Database schema and migrations
│       └── package.json
├── packages/
│   ├── shared/              # Shared types and utilities
│   │   ├── types/           # Common TypeScript types
│   │   ├── utils/           # Shared utility functions
│   │   └── constants/       # Shared constants
│   └── database/            # Database package
│       ├── schema.prisma    # Prisma schema
│       ├── migrations/      # Database migrations
│       └── seed/            # Seed data
├── docker-compose.yml       # Docker Compose configuration
├── keycloak-realm.json     # Keycloak realm configuration
├── docs/                    # Documentation
└── package.json            # Root package.json
```

## Development Workflow

### Code Organization

#### Frontend (Web & Mobile)
- **Components**: Reusable UI components with props interfaces
- **Pages/Screens**: Route-based components with business logic
- **Hooks**: Custom React hooks for shared logic
- **Services**: API client and external service integrations
- **Store**: State management with React Query
- **Types**: TypeScript interfaces and types

#### Backend (API)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions
- **Models**: Database models and Prisma schema
- **Utils**: Helper functions and utilities

### Git Workflow

1. **Create feature branch**
```bash
git checkout -b feature/time-tracking-timer
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add timer functionality for time tracking"
```

3. **Push and create PR**
```bash
git push origin feature/time-tracking-timer
# Create PR on GitHub
```

4. **Code review and merge**
- Review code changes
- Run tests and checks
- Merge to main branch

### Code Quality

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Husky Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  }
}
```

### Testing Strategy

#### Unit Tests
```typescript
// Example test for time entry service
describe('TimeEntryService', () => {
  it('should create time entry', async () => {
    const entry = {
      project_id: 'project-1',
      task_description: 'Test task',
      start_time: new Date(),
      end_time: new Date(),
    };
    
    const result = await timeEntryService.create(entry);
    expect(result.id).toBeDefined();
  });
});
```

#### Integration Tests
```typescript
// Example API test
describe('Time Entries API', () => {
  it('should create time entry via API', async () => {
    const response = await request(app)
      .post('/api/v1/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project_id: 'project-1',
        task_description: 'Test task',
        start_time: new Date(),
        end_time: new Date(),
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
  });
});
```

#### E2E Tests
```typescript
// Example Cypress test
describe('Time Tracking Flow', () => {
  it('should allow user to start and stop timer', () => {
    cy.visit('/');
    cy.login('user@example.com', 'password');
    cy.get('[data-testid="start-timer"]').click();
    cy.get('[data-testid="timer-display"]').should('be.visible');
    cy.get('[data-testid="stop-timer"]').click();
    cy.get('[data-testid="time-entry"]').should('be.visible');
  });
});
```

### Database Development

#### Prisma Schema
```prisma
model TimeEntry {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  startTime DateTime @map("start_time")
  endTime   DateTime? @map("end_time")
  duration  Int?     // in minutes
  
  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
  
  @@map("time_entries")
}
```

#### Migrations
```bash
# Create migration
pnpm exec prisma migrate dev --name add_time_entries

# Reset database
pnpm exec prisma migrate reset

# Generate Prisma client
pnpm exec prisma generate
```

#### Seed Data
```typescript
// prisma/seed.ts
async function main() {
  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      domain: 'test.com',
    },
  });
  
  // Create test user
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      keycloakId: 'test-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    },
  });
}
```

### OpenAPI Integration

#### Swagger Setup
```typescript
// apps/api/src/app.ts
import express from 'express';
import { setupSwagger } from './config/swagger';

const app = express();

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/v1', apiRoutes);
```

#### Generate API Client
```bash
# Generate TypeScript client from OpenAPI spec
pnpm run client:generate

# The generated client will be available in packages/api-client
```

#### API Documentation
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json
- **OpenAPI YAML**: http://localhost:3001/api-docs.yaml

### API Development

#### Controller Example
```typescript
export class TimeEntryController {
  async create(req: Request, res: Response) {
    try {
      const { project_id, task_description, start_time, end_time } = req.body;
      const user_id = req.user.id;
      const organization_id = req.user.organization_id;
      
      const timeEntry = await timeEntryService.create({
        organization_id,
        user_id,
        project_id,
        task_description,
        start_time,
        end_time,
      });
      
      res.status(201).json({
        data: timeEntry,
        message: 'Time entry created successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
  }
}
```

#### Service Example
```typescript
export class TimeEntryService {
  async create(data: CreateTimeEntryData) {
    // Validate input
    await this.validateTimeEntry(data);
    
    // Check for overlapping entries
    await this.checkOverlappingEntries(data);
    
    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...data,
        duration_minutes: this.calculateDuration(data.start_time, data.end_time),
      },
    });
    
    return timeEntry;
  }
  
  private calculateDuration(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }
}
```

### Frontend Development

**Recent Updates (January 2025):**
- ✅ **Customer Management**: Complete CRUD operations with search, filtering, and active/inactive status management
- ✅ **Project Management**: Full CRUD with active/inactive status, customer dropdown selection, search functionality, and **billing model selection** (Task-Based vs Weekly Timesheet)
- ✅ **Billing Models**: Projects now support two billing models - Task-Based (multiple entries per day) and Weekly Timesheet (weekly timecards)
- ✅ **Time Tracking**: Manual time entry only (timer functionality removed per requirements), with Edit/Delete buttons for entry management
- ✅ **UI Consistency**: Standardized button layouts, forms, and styling across customer, project, and time tracking pages
- ✅ **Form Validation**: Comprehensive Zod validation for customer and project forms with proper error handling
- ✅ **Search & Filter**: Implemented across customer and project pages with status filtering
- ✅ **Active/Inactive Management**: Customers and projects now support active/inactive status with UI controls

#### Component Example
```typescript
interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateCustomer(formData);
    if (result.success) {
      onSubmit(result.data);
    } else {
      setErrors(result.errors);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer name, email, phone, address fields */}
      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="is_active" 
          checked={formData.is_active}
          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
        />
        <label htmlFor="is_active">Active Customer</label>
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};
```

#### Hook Example
```typescript
export const useTimeEntries = (projectId?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['timeEntries', projectId],
    queryFn: () => timeEntryService.getByProject(projectId),
  });
  
  const createTimeEntry = useMutation({
    mutationFn: timeEntryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries']);
    },
  });
  
  return {
    timeEntries: data,
    isLoading,
    error,
    createTimeEntry,
  };
};
```

### Mobile Development

#### Screen Example
```typescript
export const TimerScreen: React.FC = () => {
  const { activeTimer, startTimer, stopTimer } = useTimer();
  const { projects } = useProjects();
  
  const handleStart = (projectId: string) => {
    startTimer(projectId);
  };
  
  const handleStop = () => {
    stopTimer(activeTimer.id);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time Tracking</Text>
      
      {activeTimer ? (
        <ActiveTimer
          timer={activeTimer}
          onStop={handleStop}
        />
      ) : (
        <ProjectList
          projects={projects}
          onSelect={handleStart}
        />
      )}
    </View>
  );
};
```

#### Storage Service Example
```typescript
export class LocalStorageService {
  private db: SQLite.Database;
  
  async init() {
    this.db = await SQLite.openDatabase('worklog.db');
    await this.createTables();
  }
  
  async createTimeEntry(entry: TimeEntry) {
    const query = `
      INSERT INTO time_entries (id, project_id, task_description, start_time, end_time, sync_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.executeSql(query, [
      entry.id,
      entry.project_id,
      entry.task_description,
      entry.start_time,
      entry.end_time,
      'pending',
    ]);
  }
  
  async getPendingSyncEntries() {
    const query = 'SELECT * FROM time_entries WHERE sync_status = ?';
    const result = await this.db.executeSql(query, ['pending']);
    return result.rows.raw();
  }
}
```

## Debugging

### API Debugging
```bash
# Enable debug logging
DEBUG=worklog:* pnpm run dev:api

# View API logs
docker-compose logs -f api
```

### Frontend Debugging
```bash
# Web app debugging
pnpm run dev:web
# Open browser dev tools

# Mobile app debugging
pnpm run dev:mobile
# Use Expo dev tools or React Native debugger
```

### Database Debugging
```bash
# Connect to database
docker-compose exec postgres psql -U worklog -d worklog

# View database logs
docker-compose logs -f postgres
```

## Performance Optimization

### Frontend Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize images and assets
- Use code splitting and lazy loading

### Backend Performance
- Implement database indexing
- Use connection pooling
- Add caching where appropriate
- Optimize database queries

### Mobile Performance
- Use FlatList for large lists
- Implement proper image optimization
- Use background tasks efficiently
- Optimize bundle size

## Deployment

### Development Deployment
```bash
# Build all applications
pnpm run build:all

# Start with Docker Compose
docker-compose up -d
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Reset database
pnpm run db:reset
```

#### Keycloak Issues
```bash
# Check Keycloak status
docker-compose ps keycloak

# View Keycloak logs
docker-compose logs keycloak

# Access Keycloak admin console
open http://localhost:8080/admin

# Access worklog realm
open http://localhost:8080/realms/worklog
```

#### Mobile App Issues
```bash
# Clear Expo cache
npx expo start --clear

# Reset React Native cache
npx react-native start --reset-cache

# Reinstall node_modules
rm -rf node_modules && pnpm install
```

### Getting Help
- Check the documentation in `/docs`
- Search existing issues on GitHub
- Create a new issue with detailed information
- Contact the development team