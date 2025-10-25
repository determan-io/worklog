# WorkLog OpenAPI Documentation

## Overview
WorkLog uses OpenAPI 3.0 specification for API documentation, client generation, and server validation. The API is fully documented with Swagger UI for interactive testing and exploration.

## OpenAPI Specification

### Base Information
```yaml
openapi: 3.0.3
info:
  title: WorkLog API
  description: Multi-tenant time tracking API for organizations, customers, and projects
  version: 1.0.0
  contact:
    name: WorkLog Support
    email: support@worklog.com
    url: https://worklog.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://api.worklog.com/v1
    description: Production server
  - url: http://localhost:3001/api/v1
    description: Development server
```

### Security Schemes
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from Keycloak
    organizationHeader:
      type: apiKey
      in: header
      name: X-Organization-ID
      description: Organization ID for multi-tenant requests
```

### Common Schemas
```yaml
components:
  schemas:
    Organization:
      type: object
      required:
        - id
        - name
        - created_at
      properties:
        id:
          type: string
          format: uuid
          description: Unique organization identifier
        name:
          type: string
          description: Organization name
        domain:
          type: string
          description: Organization domain
        settings:
          type: object
          description: Organization settings
        subscription_plan:
          type: string
          enum: [free, pro, enterprise]
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    User:
      type: object
      required:
        - id
        - organization_id
        - email
        - role
      properties:
        id:
          type: string
          format: uuid
        organization_id:
          type: string
          format: uuid
        keycloak_id:
          type: string
        email:
          type: string
          format: email
        first_name:
          type: string
        last_name:
          type: string
        role:
          type: string
          enum: [admin, manager, employee, client]
        is_active:
          type: boolean
        last_login_at:
          type: string
          format: date-time
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Customer:
      type: object
      required:
        - id
        - organization_id
        - name
      properties:
        id:
          type: string
          format: uuid
        organization_id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string
        address:
          type: object
          properties:
            street:
              type: string
            city:
              type: string
            state:
              type: string
            zip:
              type: string
            country:
              type: string
        billing_settings:
          type: object
          properties:
            currency:
              type: string
              default: USD
            payment_terms:
              type: string
              default: Net 30
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Project:
      type: object
      required:
        - id
        - organization_id
        - customer_id
        - name
        - billing_model
      properties:
        id:
          type: string
          format: uuid
        organization_id:
          type: string
          format: uuid
        customer_id:
          type: string
          format: uuid
        sow_id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        billing_model:
          type: string
          enum: [timesheet, task-based]
        status:
          type: string
          enum: [planning, active, on-hold, completed, cancelled]
        start_date:
          type: string
          format: date
        end_date:
          type: string
          format: date
        budget_hours:
          type: number
          format: decimal
        hourly_rate:
          type: number
          format: decimal
        is_billable:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    TimeEntry:
      type: object
      required:
        - id
        - organization_id
        - user_id
        - project_id
      properties:
        id:
          type: string
          format: uuid
        organization_id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        project_id:
          type: string
          format: uuid
        task_description:
          type: string
        start_time:
          type: string
          format: date-time
        end_time:
          type: string
          format: date-time
        duration_minutes:
          type: integer
          description: Duration in minutes
        duration_hours:
          type: number
          format: decimal
          description: Duration in hours
        is_timer_active:
          type: boolean
        is_billable:
          type: boolean
        hourly_rate:
          type: number
          format: decimal
        notes:
          type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: object
          required:
            - code
            - message
          properties:
            code:
              type: string
              enum:
                - VALIDATION_ERROR
                - AUTHENTICATION_REQUIRED
                - AUTHORIZATION_DENIED
                - RESOURCE_NOT_FOUND
                - DUPLICATE_RESOURCE
                - RATE_LIMIT_EXCEEDED
                - INTERNAL_ERROR
            message:
              type: string
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  message:
                    type: string
            timestamp:
              type: string
              format: date-time
            request_id:
              type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
        total:
          type: integer
        pages:
          type: integer
        has_next:
          type: boolean
        has_prev:
          type: boolean
```

### API Endpoints

#### Authentication Endpoints
```yaml
paths:
  /auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and return JWT tokens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  expires_in:
                    type: integer
                  token_type:
                    type: string
                    default: Bearer
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Refresh access token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refresh_token
              properties:
                refresh_token:
                  type: string
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  expires_in:
                    type: integer

  /auth/logout:
    post:
      tags:
        - Authentication
      summary: User logout
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logout successful
```

#### Time Entries Endpoints
```yaml
  /time-entries:
    get:
      tags:
        - Time Entries
      summary: List time entries
      security:
        - bearerAuth: []
        - organizationHeader: []
      parameters:
        - name: project_id
          in: query
          schema:
            type: string
            format: uuid
        - name: user_id
          in: query
          schema:
            type: string
            format: uuid
        - name: start_date
          in: query
          schema:
            type: string
            format: date
        - name: end_date
          in: query
          schema:
            type: string
            format: date
        - name: is_timer_active
          in: query
          schema:
            type: boolean
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: List of time entries
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/TimeEntry'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      tags:
        - Time Entries
      summary: Create time entry
      security:
        - bearerAuth: []
        - organizationHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - project_id
              properties:
                project_id:
                  type: string
                  format: uuid
                task_description:
                  type: string
                start_time:
                  type: string
                  format: date-time
                end_time:
                  type: string
                  format: date-time
                is_billable:
                  type: boolean
                  default: true
                notes:
                  type: string
      responses:
        '201':
          description: Time entry created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/TimeEntry'
                  message:
                    type: string
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /time-entries/start-timer:
    post:
      tags:
        - Time Entries
      summary: Start timer for project
      security:
        - bearerAuth: []
        - organizationHeader: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - project_id
              properties:
                project_id:
                  type: string
                  format: uuid
                task_description:
                  type: string
      responses:
        '201':
          description: Timer started successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/TimeEntry'

  /time-entries/{id}/stop-timer:
    post:
      tags:
        - Time Entries
      summary: Stop active timer
      security:
        - bearerAuth: []
        - organizationHeader: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Timer stopped successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/TimeEntry'

  /time-entries/{id}:
    get:
      tags:
        - Time Entries
      summary: Get time entry by ID
      security:
        - bearerAuth: []
        - organizationHeader: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Time entry details
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/TimeEntry'

    put:
      tags:
        - Time Entries
      summary: Update time entry
      security:
        - bearerAuth: []
        - organizationHeader: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                task_description:
                  type: string
                start_time:
                  type: string
                  format: date-time
                end_time:
                  type: string
                  format: date-time
                is_billable:
                  type: boolean
                notes:
                  type: string
      responses:
        '200':
          description: Time entry updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/TimeEntry'

    delete:
      tags:
        - Time Entries
      summary: Delete time entry
      security:
        - bearerAuth: []
        - organizationHeader: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Time entry deleted successfully
        '404':
          description: Time entry not found
```

## OpenAPI Integration

### Swagger UI Setup
```typescript
// apps/api/src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WorkLog API',
      version: '1.0.0',
      description: 'Multi-tenant time tracking API',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001/api/v1',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        organizationHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Organization-ID',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
```

### Express Integration
```typescript
// apps/api/src/app.ts
import express from 'express';
import { specs, swaggerUi } from './config/swagger';

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WorkLog API Documentation',
}));

// OpenAPI JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});
```

### Route Documentation
```typescript
// apps/api/src/routes/timeEntries.ts
import { Router } from 'express';
import { TimeEntryController } from '../controllers/TimeEntryController';

const router = Router();
const controller = new TimeEntryController();

/**
 * @swagger
 * /time-entries:
 *   get:
 *     tags:
 *       - Time Entries
 *     summary: List time entries
 *     security:
 *       - bearerAuth: []
 *       - organizationHeader: []
 *     parameters:
 *       - name: project_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of time entries
 */
router.get('/', controller.list);

/**
 * @swagger
 * /time-entries:
 *   post:
 *     tags:
 *       - Time Entries
 *     summary: Create time entry
 *     security:
 *       - bearerAuth: []
 *       - organizationHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               task_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Time entry created successfully
 */
router.post('/', controller.create);

export default router;
```

### Client Generation
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api-docs.json \
  -g typescript-axios \
  -o packages/api-client \
  --additional-properties=typescriptThreePlus=true

# Generate React Query hooks
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api-docs.json \
  -g typescript-axios \
  -o packages/api-client \
  --additional-properties=typescriptThreePlus=true,useSingleRequestParameter=true
```

### Validation Middleware
```typescript
// apps/api/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validate = ajv.compile(schema);
    const valid = validate(req.body);
    
    if (!valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validate.errors,
        },
      });
    }
    
    next();
  };
};
```

## API Testing with OpenAPI

### Postman Collection
```json
{
  "info": {
    "name": "WorkLog API",
    "description": "Multi-tenant time tracking API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api/v1"
    },
    {
      "key": "accessToken",
      "value": ""
    },
    {
      "key": "organizationId",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{accessToken}}"
      }
    ]
  }
}
```

### Newman Tests
```bash
# Run Postman collection tests
newman run worklog-api.postman_collection.json \
  --environment worklog-dev.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

## Documentation Generation

### Automated Documentation
```bash
# Generate API documentation
npm run docs:generate

# Serve documentation locally
npm run docs:serve

# Build documentation for production
npm run docs:build
```

### CI/CD Integration
```yaml
# .github/workflows/api-docs.yml
name: API Documentation
on:
  push:
    branches: [main]
    paths: ['apps/api/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Generate API docs
        run: npm run docs:generate
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
```

## Benefits of OpenAPI Integration

### For Developers
- **Interactive Documentation**: Swagger UI for testing APIs
- **Client Generation**: Automatic client SDK generation
- **Type Safety**: TypeScript types generated from schema
- **Validation**: Request/response validation
- **Testing**: Automated API testing

### For API Consumers
- **Clear Documentation**: Comprehensive API reference
- **Code Examples**: Generated code samples
- **Interactive Testing**: Try APIs directly in browser
- **Schema Validation**: Understand data structures
- **Versioning**: Clear API versioning strategy

### For Maintenance
- **Consistency**: Enforced API consistency
- **Evolution**: Safe API evolution with versioning
- **Monitoring**: API usage and performance tracking
- **Compliance**: API standards compliance