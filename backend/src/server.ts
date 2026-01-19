import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { config } from './config/config';
import logger from './config/logger';
import './config/database'; // Initialize database

import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import titleTransferRoutes from './routes/titleTransferRoutes';
import feeRoutes from './routes/feeRoutes';

import { errorHandler, notFound, requestLogger } from './middleware/errorHandler';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Swagger API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DMV Vehicle Registration API',
      version: '1.0.0',
      description: 'Production-grade API for DMV vehicle registration and title transfer services',
      contact: {
        name: 'API Support',
        email: 'support@dmvreg.com',
      },
    },
    servers: [
      {
        url: config.env === 'production' ? 'https://api.dmvreg.com' : `http://localhost:${config.port}`,
        description: config.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./backend/src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/title-transfers', titleTransferRoutes);
app.use('/api/fees', feeRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'DMV Vehicle Registration API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.env} mode`);
  logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`❤️  Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
