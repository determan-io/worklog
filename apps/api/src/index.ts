import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient();

// Create Express app
const app: express.Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging and compression
app.use(morgan('combined'));
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
import organizationsRouter from './routes/organizations';
import timeEntriesRouter from './routes/timeEntries';
import projectsRouter from './routes/projects';
import customersRouter from './routes/customers';
import sowsRouter from './routes/sows';
import timesheetsRouter from './routes/timesheets';
import billingRouter from './routes/billing';
import projectMembershipsRouter from './routes/projectMemberships';
import usersRouter from './routes/users';

app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/time-entries', timeEntriesRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/sows', sowsRouter);
app.use('/api/v1/timesheets', timesheetsRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1', projectMembershipsRouter);

app.use('/api/v1', (req, res) => {
  res.json({
    message: 'WorkLog API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      organizations: '/api/v1/organizations',
      users: '/api/v1/users',
      customers: '/api/v1/customers',
      sows: '/api/v1/sows',
      projects: '/api/v1/projects',
      'time-entries': '/api/v1/time-entries',
      timesheets: '/api/v1/timesheets',
      billing: '/api/v1/billing'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WorkLog API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/v1`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
