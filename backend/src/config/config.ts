import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables in production
if (isProduction) {
  const requiredEnvVars = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}. ` +
      'Please set these variables before starting the application.'
    );
  }
  
  // Validate that production secrets are not using default values
  if (process.env.ADMIN_PASSWORD === 'change-this-password') {
    throw new Error(
      'ADMIN_PASSWORD must be changed from default value in production. ' +
      'Please set a strong password in environment variables.'
    );
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    path: process.env.DATABASE_PATH || './backend/database/dmv_registration.db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction 
      ? (() => { throw new Error('JWT_SECRET is required in production'); })()
      : 'fallback-secret-key-not-for-production'),
    expire: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isProduction
      ? (() => { throw new Error('JWT_REFRESH_SECRET is required in production'); })()
      : 'fallback-refresh-secret'),
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
    key: process.env.ENCRYPTION_KEY || (isProduction
      ? (() => { throw new Error('ENCRYPTION_KEY is required in production (32 characters)'); })()
      : 'fallback-encryption-key-32chars'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './backend/logs/app.log',
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || (isProduction
      ? (() => { throw new Error('ADMIN_EMAIL is required in production'); })()
      : 'admin@dmvreg.com'),
    password: process.env.ADMIN_PASSWORD || (isProduction
      ? (() => { throw new Error('ADMIN_PASSWORD is required in production'); })()
      : 'change-this-password'),
  },
};

export default config;
