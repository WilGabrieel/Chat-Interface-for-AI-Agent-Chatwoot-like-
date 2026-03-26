import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { config } from '../config/env';
import { TokenResponse, RefreshTokenResponse } from '../types/auth';

const prisma = new PrismaClient();

/**
 * Register a new user
 * POST /auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role = 'supervisor' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
    });

    // Generate JWT access token (24 hour expiry)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token (7 day expiry)
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in database for revocation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const response: TokenResponse = {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      // Still return generic error message
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT access token (24 hour expiry)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token (7 day expiry)
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in database for revocation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const response: TokenResponse = {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken: providedToken } = req.body;

    if (!providedToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token signature
    let decoded: any;
    try {
      decoded = jwt.verify(providedToken, config.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database (enables revocation)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: providedToken },
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token has expired
    if (new Date() > storedToken.expiresAt) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token (24 hour expiry)
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: RefreshTokenResponse = {
      token: newToken,
    };

    res.json(response);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { register, login, refresh };
