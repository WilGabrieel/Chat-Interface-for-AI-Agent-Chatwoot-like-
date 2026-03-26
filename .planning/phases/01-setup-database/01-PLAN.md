---
phase: 01-setup-database
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - .env.example
  - .gitignore
  - Dockerfile
  - docker-compose.yml
  - prisma/schema.prisma
  - src/server.ts
  - src/config/env.ts
autonomous: true
requirements: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10]
must_haves:
  truths:
    - "Express server starts on localhost:3000 without errors"
    - "MySQL database is reachable from Express application"
    - "Prisma migrations run successfully and create all required tables"
    - "Auth endpoints validate requests and return proper responses"
    - "JWT tokens are generated with 24h expiry and can be validated"
    - "Passwords are hashed with bcrypt before storage"
    - "Docker builds and runs locally without errors"
  artifacts:
    - path: "package.json"
      provides: "Dependencies: express, prisma, bcryptjs, jsonwebtoken, dotenv, cors"
    - path: "prisma/schema.prisma"
      provides: "All 6 models: User, Contact, Conversation, Message, DailyInsight, RefreshToken"
    - path: ".env.example"
      provides: "Template for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV"
    - path: "Dockerfile"
      provides: "Container image definition for production deployment"
    - path: "src/server.ts"
      provides: "Express app initialization with middleware and routes"
    - path: "src/routes/auth.ts"
      provides: "POST /auth/register, /auth/login, /auth/refresh endpoints"
  key_links:
    - from: "src/routes/auth.ts"
      to: "prisma/schema.prisma"
      via: "User model query"
      pattern: "prisma.user.findUnique|create"
    - from: "src/middleware/auth.ts"
      to: "jsonwebtoken"
      via: "JWT verification"
      pattern: "jwt.verify|sign"
    - from: "src/server.ts"
      to: "prisma"
      via: "Database client initialization"
      pattern: "new PrismaClient|prisma\\.$"

---

<objective>
Set up Express.js project infrastructure, database schema, authentication system, and containerization for Phase 1 of the chat interface.

Purpose: Establish secure, scalable foundation for subsequent backend features (webhook handling, real-time messaging, API endpoints)

Output:
- Git repository with initial project structure
- Express server running locally
- MySQL database with Prisma schema and migrations
- JWT-based authentication system (register, login, refresh)
- Docker container ready for deployment
- Environment configuration template
</objective>

<execution_context>
@C:\Users\wilga\iCloudDrive\Documents\Squad\.planning\ROADMAP.md
@C:\Users\wilga\iCloudDrive\Documents\Squad\.planning\REQUIREMENTS.md
@C:\Users\wilga\iCloudDrive\Documents\Squad\.planning\PROJECT.md

Stack: Node.js + Express, MySQL + Prisma, JWT + bcrypt, Docker
Locked Decisions: Express.js, MySQL, JWT+Bcrypt, Docker
Timeline: 5 business days
Owner: Backend Engineer
</execution_context>

<context>
## Established Patterns (from STATE.md)

**Assumptions Confirmed:**
- n8n sends webhooks consistently (no polling needed)
- MySQL is reachable via Railway for staging/prod
- You control n8n workflow configuration
- No external payment integration in v1

**Stack Confirmed:**
- Frontend: React 18+, Vite, Socket.io client
- Backend: Node.js, Express, Prisma, JWT, bcryptjs
- Database: MySQL (local dev + Railway staging/prod)
- DevOps: Docker, docker-compose

**Schema Requirements (from ROADMAP.md):**
```
User: id, email (unique), passwordHash, name, role, createdAt, updatedAt
Contact: id, phone (unique), name, avatarUrl, tags (JSON), createdAt, updatedAt
Conversation: id, contactId, assignedToId, status, lastMessageAt, messages[], createdAt, updatedAt
Message: id, conversationId, sender, content, messageType, metadata (JSON), readAt, createdAt, updatedAt
DailyInsight: id, date (unique), totalMessages, errorRate, avgResponseTime, topErrors (JSON)
RefreshToken: id, userId, token, expiresAt, createdAt (for token rotation)
```

**Auth Requirements (from REQUIREMENTS.md Feature 5):**
- Login: email + password → JWT token (24h) + refresh token
- Register: email + password + name + role → user created with hashed password
- Refresh: refresh token → new JWT token
- Logout: frontend clears token (no backend action needed in v1)
- Roles: admin, supervisor (role-based access later in Phase 2)
- Security: bcrypt hashing, HTTPS in prod, CORS config, rate limiting (Phase 5)
- Password policy: min 8 chars (enforced in validation)

**Port Assignment:**
- Express: localhost:3000 (dev), process.env.PORT in prod
- MySQL: localhost:3306 (dev), Railway connection string (prod)
</context>

<tasks>

<task type="auto">
  <name>Task 1.1: Initialize Node.js Project & Dependencies</name>
  <files>package.json, package-lock.json</files>
  <action>
1. Create npm project in repository root: `npm init -y`
2. Install core dependencies:
   - express (web server)
   - prisma (ORM + migrations)
   - @prisma/client (runtime client)
   - bcryptjs (password hashing)
   - jsonwebtoken (JWT tokens)
   - dotenv (environment variables)
   - cors (cross-origin support)
   - helmet (security headers)
   - express-validator (input validation)
   - uuid (ID generation)

3. Install dev dependencies:
   - typescript (optional but recommended)
   - nodemon (auto-restart on changes)
   - jest (testing, Phase 5)
   - ts-node (run TypeScript directly)

4. Update package.json scripts:
   - "dev": "nodemon src/server.ts"
   - "build": "tsc" (if using TypeScript)
   - "start": "node dist/server.js" (if using TypeScript) OR "node src/server.js"
   - "test": "jest"
   - "prisma:migrate": "npx prisma migrate dev"
   - "prisma:seed": "node prisma/seed.js"

5. Create .npmrc for consistent installs:
   - legacy-peer-deps=false (or true if peer dep conflicts)

6. No hardcoded credentials in package.json
  </action>
  <verify>
    npm test succeeds (may be empty initially), npm run dev can start without error (will fail on env vars, but that's OK)
  </verify>
  <done>package.json exists with all dependencies listed, "npm install" successfully installs all packages</done>
</task>

<task type="auto">
  <name>Task 1.2: Create Project Structure & Express Server Boilerplate</name>
  <files>
    src/server.ts
    src/config/env.ts
    src/middleware/cors.ts
    src/middleware/errorHandler.ts
    .env.example
    .gitignore
    README.md
  </files>
  <action>
1. Create directory structure:
   ```
   src/
   ├── server.ts          # Express app initialization
   ├── config/
   │   ├── env.ts         # Environment variables loader
   │   └── database.ts    # Prisma client instance
   ├── routes/
   │   ├── auth.ts        # Authentication endpoints
   │   └── health.ts      # Health check (optional, useful for monitoring)
   ├── middleware/
   │   ├── cors.ts        # CORS configuration
   │   ├── auth.ts        # JWT verification middleware
   │   └── errorHandler.ts # Global error handler
   ├── controllers/       # (Task 1.5)
   └── types/             # TypeScript types
   prisma/
   ├── schema.prisma      # Task 1.3
   └── seed.js            # Task 1.4
   ```

2. Create src/config/env.ts:
   - Load variables from .env using dotenv.config()
   - Export: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, PORT
   - Validate required vars are present, throw error if missing
   - Example: `export const DB_URL = process.env.DATABASE_URL || "";`

3. Create src/server.ts (Express app):
   ```typescript
   import express from 'express';
   import { corsConfig } from './middleware/cors';
   import { errorHandler } from './middleware/errorHandler';
   import authRoutes from './routes/auth';

   const app = express();

   // Middleware
   app.use(express.json());
   app.use(corsConfig);

   // Routes
   app.use('/auth', authRoutes);
   app.get('/health', (req, res) => res.json({ status: 'ok' }));

   // Error handler (last)
   app.use(errorHandler);

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

4. Create src/middleware/cors.ts:
   - Allow frontend origin (localhost:5173 for dev, prod domain in env var)
   - Credentials: true for cookies/auth
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Headers: Content-Type, Authorization

5. Create src/middleware/errorHandler.ts:
   - Catch errors from routes
   - Log to console (structured logging in Phase 5)
   - Return { error: string, statusCode: number }
   - Don't expose stack traces in production

6. Create .env.example:
   ```
   NODE_ENV=development
   DATABASE_URL=mysql://user:password@localhost:3306/chat_db
   JWT_SECRET=your-secret-key-change-in-production
   JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

7. Create .gitignore:
   ```
   node_modules/
   .env
   .env.local
   dist/
   build/
   .DS_Store
   *.log
   coverage/
   .prisma/
   ```

8. Create README.md with setup instructions (basic, expanded in Phase 5)

  </action>
  <verify>
    File structure matches layout above, src/server.ts exports app, npm run dev starts (may fail on DATABASE_URL, that's expected), no TypeScript compilation errors if using ts-node
  </verify>
  <done>Directory structure created, Express app initializes successfully, middleware configured, .env.example available for developer reference</done>
</task>

<task type="auto">
  <name>Task 1.3: Define Prisma Schema & Database Models</name>
  <files>prisma/schema.prisma, prisma/.env (symlink or copy from .env)</files>
  <action>
1. Create prisma/schema.prisma with provider = "mysql" and exact URL from .env

2. Define all 6 models per ROADMAP.md schema:

   **User Model:**
   ```prisma
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     passwordHash String
     name      String
     role      String   // "admin" or "supervisor"
     conversations Conversation[]
     refreshTokens RefreshToken[]
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

   **Contact Model:**
   ```prisma
   model Contact {
     id        String   @id @default(cuid())
     phone     String   @unique
     name      String
     avatarUrl String?
     tags      Json     @default("[]")  // Array of tags
     conversations Conversation[]
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

   **Conversation Model:**
   ```prisma
   model Conversation {
     id            String   @id @default(cuid())
     contactId     String
     contact       Contact  @relation(fields: [contactId], references: [id])
     assignedToId  String?
     assignedTo    User?    @relation(fields: [assignedToId], references: [id])
     status        String   // "active", "closed", "paused"
     messages      Message[]
     lastMessageAt DateTime?
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt

     @@index([contactId])
     @@index([assignedToId])
   }
   ```

   **Message Model:**
   ```prisma
   model Message {
     id              String   @id @default(cuid())
     conversationId  String
     conversation    Conversation @relation(fields: [conversationId], references: [id])
     sender          String   // "user_id", "agent", "contact"
     content         String
     messageType     String   @default("text") // "text", "image", "file"
     metadata        Json?    // { confidence: number, intent: string, etc }
     readAt          DateTime?
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt

     @@index([conversationId])
     @@index([createdAt])
   }
   ```

   **DailyInsight Model:**
   ```prisma
   model DailyInsight {
     id              String   @id @default(cuid())
     date            DateTime @unique
     totalMessages   Int
     errorRate       Float    // 0.0 to 1.0
     avgResponseTime Float    // seconds
     topErrors       Json     // Array of { type: string, count: number }
     createdAt       DateTime @default(now())
   }
   ```

   **RefreshToken Model (for token rotation):**
   ```prisma
   model RefreshToken {
     id        String   @id @default(cuid())
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     token     String   @unique
     expiresAt DateTime
     createdAt DateTime @default(now())

     @@index([userId])
   }
   ```

3. Add indexes for performance (Phase 2 query optimization can expand):
   - conversations: contactId, assignedToId
   - messages: conversationId, createdAt
   - refreshTokens: userId

4. Validate schema:
   - No circular dependencies
   - All @relation fields have matching references
   - All model names match expectations from auth code
  </action>
  <verify>
    npx prisma validate succeeds with no errors, schema can be visualized with npx prisma studio
  </verify>
  <done>prisma/schema.prisma exists, all 6 models defined with correct fields and relationships, indexes applied, validation passes</done>
</task>

<task type="auto">
  <name>Task 1.4: Create Database Migrations & Seed Script</name>
  <files>prisma/migrations/*, prisma/seed.js</files>
  <action>
1. Create initial migration:
   - Run: `npx prisma migrate dev --name init`
   - This creates: prisma/migrations/{timestamp}_init/migration.sql
   - Prisma generates SQL from schema
   - If using local MySQL, creates chat_db database automatically
   - If Railway, uses provided connection string

2. Verify migration creates all tables:
   - Check migration.sql file
   - Tables: users, contacts, conversations, messages, daily_insights, refresh_tokens

3. Create prisma/seed.js for development:
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const bcrypt = require('bcryptjs');
   const prisma = new PrismaClient();

   async function main() {
     // Clear existing data (dev only)
     await prisma.message.deleteMany();
     await prisma.conversation.deleteMany();
     await prisma.contact.deleteMany();
     await prisma.refreshToken.deleteMany();
     await prisma.user.deleteMany();

     // Create test users
     const hashedPassword = await bcrypt.hash('TestPassword123', 10);

     const adminUser = await prisma.user.create({
       data: {
         email: 'admin@example.com',
         passwordHash: hashedPassword,
         name: 'Admin User',
         role: 'admin',
       },
     });

     const supervisorUser = await prisma.user.create({
       data: {
         email: 'supervisor@example.com',
         passwordHash: hashedPassword,
         name: 'Supervisor User',
         role: 'supervisor',
       },
     });

     // Create test contact
     const contact = await prisma.contact.create({
       data: {
         phone: '5585987654321',
         name: 'Maria Silva',
         avatarUrl: null,
         tags: ['importante', 'vip'],
       },
     });

     // Create test conversation
     const conversation = await prisma.conversation.create({
       data: {
         contactId: contact.id,
         assignedToId: supervisorUser.id,
         status: 'active',
         lastMessageAt: new Date(),
       },
     });

     // Create test messages
     await prisma.message.create({
       data: {
         conversationId: conversation.id,
         sender: 'contact',
         content: 'Olá, tudo bem?',
         messageType: 'text',
       },
     });

     await prisma.message.create({
       data: {
         conversationId: conversation.id,
         sender: 'agent',
         content: 'Oi Maria! Tudo certo por aqui.',
         messageType: 'text',
       },
     });

     console.log('Seeding complete. Test users:');
     console.log(`Admin: admin@example.com / TestPassword123`);
     console.log(`Supervisor: supervisor@example.com / TestPassword123`);
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

4. Update package.json to use seed:
   - Add to prisma block: `"seed": "node prisma/seed.js"`
   - Run: `npx prisma db seed` during development

5. Test migration:
   - Run: `npx prisma migrate dev --name init` (creates migration + runs it)
   - Or: `npx prisma db push` (if using dev environment, pushes schema to DB)
   - Verify all tables exist in MySQL
  </action>
  <verify>
    npx prisma migrate status shows "All migrations have been applied", npx prisma db seed runs without errors, MySQL has 6 tables (users, contacts, conversations, messages, daily_insights, refresh_tokens)
  </verify>
  <done>Initial migration created and applied, database tables exist in MySQL, seed script populates test data (2 users, 1 contact, 1 conversation, 2 messages)</done>
</task>

<task type="auto">
  <name>Task 1.5: Implement Authentication Routes (Register, Login, Refresh)</name>
  <files>
    src/routes/auth.ts
    src/controllers/authController.ts
    src/middleware/auth.ts
    src/types/auth.ts
  </files>
  <action>
1. Create src/types/auth.ts:
   ```typescript
   export interface AuthRequest {
     email: string;
     password: string;
     name?: string;
     role?: string;
   }

   export interface TokenResponse {
     token: string;
     refreshToken: string;
     user: {
       id: string;
       email: string;
       name: string;
       role: string;
     };
   }

   export interface AuthPayload {
     userId: string;
     email: string;
     role: string;
   }
   ```

2. Create src/middleware/auth.ts (JWT verification):
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import jwt from 'jsonwebtoken';

   export interface AuthenticatedRequest extends Request {
     user?: { userId: string; email: string; role: string };
   }

   export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
     const authHeader = req.headers.authorization;
     const token = authHeader?.split(' ')[1]; // Bearer {token}

     if (!token) {
       return res.status(401).json({ error: 'No token provided' });
     }

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET!);
       req.user = decoded as any;
       next();
     } catch (error) {
       return res.status(401).json({ error: 'Invalid or expired token' });
     }
   };
   ```

3. Create src/controllers/authController.ts:
   ```typescript
   import { Request, Response } from 'express';
   import bcrypt from 'bcryptjs';
   import jwt from 'jsonwebtoken';
   import { PrismaClient } from '@prisma/client';
   import { validationResult } from 'express-validator';

   const prisma = new PrismaClient();

   export const register = async (req: Request, res: Response) => {
     // Validation errors
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }

     const { email, password, name, role = 'supervisor' } = req.body;

     try {
       // Check if user exists
       const existingUser = await prisma.user.findUnique({ where: { email } });
       if (existingUser) {
         return res.status(409).json({ error: 'Email already registered' });
       }

       // Hash password
       const saltRounds = 10;
       const passwordHash = await bcrypt.hash(password, saltRounds);

       // Create user
       const user = await prisma.user.create({
         data: {
           email,
           passwordHash,
           name,
           role,
         },
       });

       // Generate tokens
       const token = jwt.sign(
         { userId: user.id, email: user.email, role: user.role },
         process.env.JWT_SECRET!,
         { expiresIn: '24h' }
       );

       const refreshToken = jwt.sign(
         { userId: user.id },
         process.env.JWT_REFRESH_SECRET!,
         { expiresIn: '7d' }
       );

       // Save refresh token to DB
       await prisma.refreshToken.create({
         data: {
           userId: user.id,
           token: refreshToken,
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
         },
       });

       res.status(201).json({
         token,
         refreshToken,
         user: {
           id: user.id,
           email: user.email,
           name: user.name,
           role: user.role,
         },
       });
     } catch (error) {
       console.error('Register error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   };

   export const login = async (req: Request, res: Response) => {
     // Validation errors
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }

     const { email, password } = req.body;

     try {
       // Find user
       const user = await prisma.user.findUnique({ where: { email } });
       if (!user) {
         return res.status(401).json({ error: 'Invalid credentials' });
       }

       // Compare password
       const validPassword = await bcrypt.compare(password, user.passwordHash);
       if (!validPassword) {
         return res.status(401).json({ error: 'Invalid credentials' });
       }

       // Generate tokens
       const token = jwt.sign(
         { userId: user.id, email: user.email, role: user.role },
         process.env.JWT_SECRET!,
         { expiresIn: '24h' }
       );

       const refreshToken = jwt.sign(
         { userId: user.id },
         process.env.JWT_REFRESH_SECRET!,
         { expiresIn: '7d' }
       );

       // Save refresh token to DB
       await prisma.refreshToken.create({
         data: {
           userId: user.id,
           token: refreshToken,
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
         },
       });

       res.json({
         token,
         refreshToken,
         user: {
           id: user.id,
           email: user.email,
           name: user.name,
           role: user.role,
         },
       });
     } catch (error) {
       console.error('Login error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   };

   export const refresh = async (req: Request, res: Response) => {
     const { refreshToken: providedToken } = req.body;

     if (!providedToken) {
       return res.status(400).json({ error: 'Refresh token required' });
     }

     try {
       // Verify refresh token
       const decoded = jwt.verify(providedToken, process.env.JWT_REFRESH_SECRET!) as any;

       // Check if token exists in DB (prevents revoked tokens)
       const storedToken = await prisma.refreshToken.findUnique({
         where: { token: providedToken },
       });

       if (!storedToken || new Date() > storedToken.expiresAt) {
         return res.status(401).json({ error: 'Invalid or expired refresh token' });
       }

       // Get user
       const user = await prisma.user.findUnique({
         where: { id: decoded.userId },
       });

       if (!user) {
         return res.status(401).json({ error: 'User not found' });
       }

       // Generate new access token
       const newToken = jwt.sign(
         { userId: user.id, email: user.email, role: user.role },
         process.env.JWT_SECRET!,
         { expiresIn: '24h' }
       );

       res.json({ token: newToken });
     } catch (error) {
       console.error('Refresh error:', error);
       res.status(401).json({ error: 'Invalid refresh token' });
     }
   };
   ```

4. Create src/routes/auth.ts:
   ```typescript
   import express from 'express';
   import { body } from 'express-validator';
   import { register, login, refresh } from '../controllers/authController';

   const router = express.Router();

   // POST /auth/register
   router.post(
     '/register',
     [
       body('email').isEmail().normalizeEmail(),
       body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
       body('name').trim().notEmpty().withMessage('Name required'),
       body('role').optional().isIn(['admin', 'supervisor']),
     ],
     register
   );

   // POST /auth/login
   router.post(
     '/login',
     [
       body('email').isEmail().normalizeEmail(),
       body('password').notEmpty(),
     ],
     login
   );

   // POST /auth/refresh
   router.post('/refresh', refresh);

   export default router;
   ```

5. Key implementation details:
   - Password: bcrypt with 10 salt rounds (production strength)
   - JWT access token: 24h expiry (per REQUIREMENTS.md)
   - Refresh token: 7d expiry, stored in DB (enables revocation)
   - Validation: express-validator checks email format, password length (min 8)
   - Errors: Never return "user not found" + "invalid password" separately (security: prevents email enumeration)
   - Refresh token endpoint: Only returns new access token, not new refresh token (security: minimizes token exposure)
  </action>
  <verify>
    POST /auth/register with valid data (email, password 8+ chars, name, role) returns 201 with token + refreshToken + user; POST /auth/login with valid credentials returns 200 with token + refreshToken; POST /auth/refresh with valid refreshToken returns 200 with new token; Invalid credentials return 401; Missing fields return 400
  </verify>
  <done>Auth endpoints implemented with bcrypt hashing, JWT token generation (24h access, 7d refresh), input validation, error handling</done>
</task>

<task type="auto">
  <name>Task 1.6: Create Dockerfile & Docker Compose for Development</name>
  <files>Dockerfile, docker-compose.yml, .dockerignore</files>
  <action>
1. Create Dockerfile for backend (multi-stage build):
   ```dockerfile
   # Stage 1: Build
   FROM node:18-alpine AS builder

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci

   COPY . .
   RUN npm run build  # if using TypeScript

   # Stage 2: Runtime
   FROM node:18-alpine

   WORKDIR /app

   # Install curl for health checks
   RUN apk add --no-cache curl

   COPY package*.json ./
   RUN npm ci --only=production

   # Copy built files (if using TypeScript) or source (if JavaScript)
   COPY --from=builder /app/dist ./dist
   # OR (if JavaScript):
   # COPY src ./src
   # COPY prisma ./prisma

   EXPOSE 3000

   # Health check
   HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:3000/health || exit 1

   CMD ["node", "dist/server.js"]
   # OR (if JavaScript): CMD ["node", "src/server.js"]
   ```

2. Create .dockerignore:
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   .env
   .DS_Store
   dist
   coverage
   .prisma
   ```

3. Create docker-compose.yml (for local development):
   ```yaml
   version: '3.8'

   services:
     # MySQL database
     mysql:
       image: mysql:8.0
       container_name: chat_db
       environment:
         MYSQL_ROOT_PASSWORD: rootpass
         MYSQL_DATABASE: chat_db
         MYSQL_USER: chatuser
         MYSQL_PASSWORD: chatpass
       ports:
         - "3306:3306"
       volumes:
         - mysql_data:/var/lib/mysql
       healthcheck:
         test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
         timeout: 20s
         retries: 10

     # Express backend
     backend:
       build: .
       container_name: chat_backend
       environment:
         NODE_ENV: development
         DATABASE_URL: mysql://chatuser:chatpass@mysql:3306/chat_db
         JWT_SECRET: dev-secret-change-in-production
         JWT_REFRESH_SECRET: dev-refresh-secret-change-in-production
         PORT: 3000
         FRONTEND_URL: http://localhost:5173
       ports:
         - "3000:3000"
       depends_on:
         mysql:
           condition: service_healthy
       volumes:
         - .:/app
         - /app/node_modules
       command: npm run dev
       restart: unless-stopped

   volumes:
     mysql_data:
   ```

4. Notes for docker-compose usage:
   - MySQL uses: mysql://chatuser:chatpass@mysql:3306/chat_db (service name "mysql" as host)
   - Backend waits for MySQL to be healthy before starting
   - Volumes: code mounted for hot reload (nodemon), node_modules separate to avoid conflicts
   - Ports: MySQL 3306, Backend 3000 (both exposed to host)

5. Build & run locally:
   - `docker-compose up` (starts both services)
   - `docker-compose down` (stops services)
   - `docker-compose logs backend` (view backend logs)
   - Migrations run automatically on first start (if configured in startup script)
  </action>
  <verify>
    docker-compose up succeeds, MySQL is healthy, backend starts on 3000, /health endpoint returns 200, app can connect to database from within container
  </verify>
  <done>Dockerfile created for production-ready image, docker-compose.yml configured for local dev with MySQL + Express, .dockerignore present</done>
</task>

<task type="auto">
  <name>Task 1.7: Initialize Git Repository & Commit</name>
  <files>.git/, .gitignore (updated from Task 1.2)</files>
  <action>
1. Initialize Git repository:
   - `git init` (if not already done)
   - `git config user.name "Your Name"` (set locally)
   - `git config user.email "your@email.com"` (set locally)

2. Verify .gitignore excludes:
   - node_modules/
   - .env (not .env.example)
   - dist/
   - .prisma/
   - *.log
   - .DS_Store
   - coverage/

3. Stage and commit:
   - `git add .`
   - Commit message: "feat(phase-1): initialize project with express, prisma, auth"

4. Create GitHub repository (if not already created):
   - Create repo on GitHub
   - `git remote add origin https://github.com/yourusername/repo.git`
   - `git branch -M main` (ensure main branch)
   - `git push -u origin main`

5. Verify:
   - GitHub repo has all files
   - .env is NOT in repo (only .env.example)
   - package-lock.json IS in repo (for reproducible builds)
  </action>
  <verify>
    git status shows clean working tree, git log shows initial commit, GitHub repo has all source files except .env, .gitignore is respected
  </verify>
  <done>Git repository initialized, code committed to GitHub, .env excluded from tracking, .gitignore properly configured</done>
</task>

<task type="auto">
  <name>Task 1.8: Test Auth Endpoints with Manual Requests</name>
  <files>(no files created, test only)</files>
  <action>
1. Start server:
   - `npm run dev` (starts nodemon on src/server.ts)
   - Wait for "Server running on port 3000"

2. Test health endpoint:
   - `curl http://localhost:3000/health`
   - Expected: `{"status":"ok"}`

3. Test register endpoint:
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@example.com",
       "password": "SecurePass123",
       "name": "New User",
       "role": "supervisor"
     }'
   ```
   Expected: 201 response with { token, refreshToken, user }

4. Test login endpoint:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@example.com",
       "password": "SecurePass123"
     }'
   ```
   Expected: 200 response with { token, refreshToken, user }

5. Test refresh endpoint:
   - Copy refreshToken from login response
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "..."}'
   ```
   Expected: 200 response with { token }

6. Test invalid credentials:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "newuser@example.com", "password": "WrongPassword"}'
   ```
   Expected: 401 response with { error: "Invalid credentials" }

7. Test validation errors:
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "invalid-email", "password": "short"}'
   ```
   Expected: 400 response with validation errors

8. Verify JWT in token:
   - Decode token using jwt.io or `node -e "console.log(JSON.parse(Buffer.from('TOKEN_PART_2', 'base64')))"`
   - Should contain: { userId, email, role, iat, exp }
   - exp should be ~24 hours in future

9. Test database:
   - Check MySQL users table: `select id, email, name, role from users;`
   - Verify passwordHash is NOT plain text
   - Verify refresh tokens are in refresh_tokens table
  </action>
  <verify>
    All 8 test scenarios (health, register, login, refresh, invalid credentials, validation, JWT contents, database) pass as expected
  </verify>
  <done>Auth endpoints working correctly, passwords are hashed, JWT tokens are valid with correct expiry, validation is enforced, error handling returns appropriate status codes</done>
</task>

</tasks>

<verification>
**Phase 1 Acceptance Criteria (All Must Pass):**

1. **Infrastructure Ready:**
   - ✅ Git repository initialized with code on GitHub (Task 1.7)
   - ✅ package.json includes all dependencies (Task 1.1)
   - ✅ npm install succeeds without errors (Task 1.1)
   - ✅ npm run dev starts server on localhost:3000 (Task 1.2)

2. **Database Ready:**
   - ✅ MySQL database exists locally (Task 1.4)
   - ✅ Prisma migrations run without errors (Task 1.4)
   - ✅ All 6 tables created (users, contacts, conversations, messages, daily_insights, refresh_tokens) (Task 1.3)
   - ✅ Seed script populates test data (Task 1.4)
   - ✅ Prisma client can query database successfully (Task 1.4)

3. **Authentication Working:**
   - ✅ POST /auth/register with valid data returns 201 + token (Task 1.5, 1.8)
   - ✅ POST /auth/login with valid credentials returns 200 + token (Task 1.5, 1.8)
   - ✅ POST /auth/refresh with refresh token returns 200 + new access token (Task 1.5, 1.8)
   - ✅ Invalid credentials return 401 (Task 1.5, 1.8)
   - ✅ Validation errors return 400 (Task 1.5, 1.8)
   - ✅ Passwords are hashed with bcrypt in database (Task 1.5, 1.8)
   - ✅ JWT tokens expire in 24 hours (Task 1.5)

4. **Containerization Ready:**
   - ✅ Dockerfile builds without errors (Task 1.6)
   - ✅ docker-compose.yml defines MySQL + Express (Task 1.6)
   - ✅ docker-compose up starts both services (Task 1.6)
   - ✅ Backend can connect to MySQL in container (Task 1.6)
   - ✅ .dockerignore excludes unnecessary files (Task 1.6)

5. **Environment & Security:**
   - ✅ .env.example has all required variables (Task 1.2)
   - ✅ .env is in .gitignore (not tracked) (Task 1.2, 1.7)
   - ✅ No hardcoded secrets in code (Task 1.2, 1.5, 1.6)
   - ✅ CORS configured (Task 1.2)
   - ✅ Password policy enforced: min 8 characters (Task 1.5)
</verification>

<success_criteria>
**Phase 1 Complete When:**

1. **All 8 Tasks Executed:**
   - [ ] Task 1.1: Node.js dependencies installed
   - [ ] Task 1.2: Project structure + Express boilerplate
   - [ ] Task 1.3: Prisma schema defined
   - [ ] Task 1.4: Migrations + seed script
   - [ ] Task 1.5: Auth endpoints implemented
   - [ ] Task 1.6: Docker + docker-compose
   - [ ] Task 1.7: Git initialized + code committed
   - [ ] Task 1.8: Auth endpoints tested manually

2. **Requirements Met:**
   - [ ] All AUTH requirements (AUTH-01 through AUTH-10) satisfied
   - [ ] Every acceptance criterion in VERIFICATION section passes
   - [ ] Zero blocking issues preventing Phase 2 start

3. **Deliverables:**
   - [ ] GitHub repo with complete code
   - [ ] .env.example for developer setup
   - [ ] Docker image buildable
   - [ ] Docker compose ready for local development
   - [ ] Database schema finalized
   - [ ] Auth API working in isolation

4. **Ready for Phase 2:**
   - [ ] Backend engineer can start Phase 2 (webhook handling) without waiting
   - [ ] Frontend engineer can mock auth endpoints for Phase 3 development
   - [ ] Database is stable and indexed for initial load
</success_criteria>

<output>
After completing all tasks, create `.planning/phases/01-setup-database/01-PLAN-SUMMARY.md` with:

```markdown
# Phase 1: Setup & Database — EXECUTION SUMMARY

**Status:** COMPLETED ✅
**Date Completed:** [ACTUAL DATE]
**Duration:** [ACTUAL DAYS]

## Tasks Completed
- [x] Task 1.1: Node.js + Dependencies
- [x] Task 1.2: Project Structure & Express
- [x] Task 1.3: Prisma Schema
- [x] Task 1.4: Migrations & Seed
- [x] Task 1.5: Auth Endpoints
- [x] Task 1.6: Docker & Compose
- [x] Task 1.7: Git Initialization
- [x] Task 1.8: Manual Testing

## Requirements Fulfilled
- ✅ AUTH-01 through AUTH-10 (Authentication feature complete)

## Artifacts Created
- `package.json` with express, prisma, bcryptjs, jsonwebtoken
- `prisma/schema.prisma` with 6 models
- `prisma/migrations/` with initial schema
- `src/server.ts` with Express app
- `src/routes/auth.ts` with register, login, refresh endpoints
- `src/middleware/auth.ts` with JWT verification
- `Dockerfile` for production image
- `docker-compose.yml` for local development
- `.env.example` with configuration template
- GitHub repository initialized

## Key Metrics
- Auth endpoints: 3 (register, login, refresh)
- Database tables: 6 (users, contacts, conversations, messages, insights, refresh_tokens)
- Server startup time: ~100ms
- Database query latency: < 50ms (local dev)

## Known Issues
[If any blockers discovered during execution]

## Next Steps
→ Phase 2: Backend Core (webhook handling, Socket.io, message CRUD)
```

Files created in: `.planning/phases/01-setup-database/`
</output>
