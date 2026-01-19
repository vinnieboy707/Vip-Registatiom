import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    path: process.env.DATABASE_PATH || './backend/database/dmv_registration.db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-not-for-production',
    expire: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  
  dmv: {
    apiKey: process.env.DMV_API_KEY || '',
    baseUrl: process.env.DMV_API_BASE_URL || 'https://api.dmv.gov/v1',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32chars',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './backend/logs/app.log',
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@dmvreg.com',
    password: process.env.ADMIN_PASSWORD || 'change-this-password',
  },
};

export default config;
