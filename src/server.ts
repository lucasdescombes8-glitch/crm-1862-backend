import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contacts.routes';
import evenementRoutes from './routes/evenements.routes';
import optionRoutes from './routes/options.routes';
import devisRoutes from './routes/devis.routes';
import factureRoutes from './routes/factures.routes';
import tacheRoutes from './routes/taches.routes';
import adminRoutes from './routes/admin.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3741',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use(requestLogger);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (to be implemented with authentication middleware)
app.use('/api/contacts', contactRoutes);
app.use('/api/evenements', evenementRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/taches', tacheRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();
    logger.info('âœ“ Database connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`âœ“ Server running on http://localhost:${PORT}`);
      logger.info(`âœ“ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`âœ“ API documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
