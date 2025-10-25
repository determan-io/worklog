import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WorkLog API',
      version: '1.0.0',
      description: 'Multi-tenant time tracking API for organizations, customers, and projects',
      contact: {
        name: 'WorkLog Support',
        email: 'support@worklog.com',
        url: 'https://worklog.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
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
          description: 'JWT token obtained from Keycloak',
        },
        organizationHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Organization-ID',
          description: 'Organization ID for multi-tenant requests',
        },
      },
      schemas: {
        Organization: {
          type: 'object',
          required: ['id', 'name', 'created_at'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique organization identifier',
            },
            name: {
              type: 'string',
              description: 'Organization name',
            },
            domain: {
              type: 'string',
              description: 'Organization domain',
            },
            settings: {
              type: 'object',
              description: 'Organization settings',
            },
            subscription_plan: {
              type: 'string',
              enum: ['free', 'pro', 'enterprise'],
            },
            is_active: {
              type: 'boolean',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        User: {
          type: 'object',
          required: ['id', 'organization_id', 'email', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            organization_id: {
              type: 'string',
              format: 'uuid',
            },
            keycloak_id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'employee', 'client'],
            },
            is_active: {
              type: 'boolean',
            },
            last_login_at: {
              type: 'string',
              format: 'date-time',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TimeEntry: {
          type: 'object',
          required: ['id', 'organization_id', 'user_id', 'project_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            organization_id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            project_id: {
              type: 'string',
              format: 'uuid',
            },
            task_description: {
              type: 'string',
            },
            start_time: {
              type: 'string',
              format: 'date-time',
            },
            end_time: {
              type: 'string',
              format: 'date-time',
            },
            duration_minutes: {
              type: 'integer',
              description: 'Duration in minutes',
            },
            duration_hours: {
              type: 'number',
              format: 'decimal',
              description: 'Duration in hours',
            },
            is_timer_active: {
              type: 'boolean',
            },
            is_billable: {
              type: 'boolean',
            },
            hourly_rate: {
              type: 'number',
              format: 'decimal',
            },
            notes: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  enum: [
                    'VALIDATION_ERROR',
                    'AUTHENTICATION_REQUIRED',
                    'AUTHORIZATION_DENIED',
                    'RESOURCE_NOT_FOUND',
                    'DUPLICATE_RESOURCE',
                    'RATE_LIMIT_EXCEEDED',
                    'INTERNAL_ERROR',
                  ],
                },
                message: {
                  type: 'string',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                request_id: {
                  type: 'string',
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
            },
            total: {
              type: 'integer',
            },
            pages: {
              type: 'integer',
            },
            has_next: {
              type: 'boolean',
            },
            has_prev: {
              type: 'boolean',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WorkLog API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }));

  // OpenAPI JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // OpenAPI YAML endpoint
  app.get('/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(specs);
  });
};

export { specs, swaggerUi };