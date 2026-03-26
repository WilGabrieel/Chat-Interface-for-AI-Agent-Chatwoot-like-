import express, { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh } from '../controllers/authController';

const router: Router = express.Router();

/**
 * POST /auth/register
 * Register a new user
 *
 * Body:
 *   - email: string (valid email)
 *   - password: string (min 8 characters)
 *   - name: string (required)
 *   - role: string (optional, default: 'supervisor', values: 'admin', 'supervisor')
 *
 * Response (201):
 *   {
 *     "token": "jwt-access-token",
 *     "refreshToken": "jwt-refresh-token",
 *     "user": {
 *       "id": "string",
 *       "email": "string",
 *       "name": "string",
 *       "role": "string"
 *     }
 *   }
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('role')
      .optional()
      .isIn(['admin', 'supervisor'])
      .withMessage('Role must be admin or supervisor'),
  ],
  register
);

/**
 * POST /auth/login
 * Login user and return access/refresh tokens
 *
 * Body:
 *   - email: string (valid email)
 *   - password: string
 *
 * Response (200):
 *   {
 *     "token": "jwt-access-token",
 *     "refreshToken": "jwt-refresh-token",
 *     "user": {
 *       "id": "string",
 *       "email": "string",
 *       "name": "string",
 *       "role": "string"
 *     }
 *   }
 *
 * Response (401):
 *   { "error": "Invalid credentials" }
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .notEmpty()
      .withMessage('Password required'),
  ],
  login
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 *
 * Body:
 *   - refreshToken: string
 *
 * Response (200):
 *   {
 *     "token": "new-jwt-access-token"
 *   }
 *
 * Response (401):
 *   { "error": "Invalid refresh token" }
 */
router.post('/refresh', refresh);

export default router;
