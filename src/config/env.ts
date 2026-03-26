import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// Validate required environment variables
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.warn(`Warning: ${varName} is not set`);
  }
}

export const config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/chat_db',

  // JWT Secrets
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Frontend URL for CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Utility
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
