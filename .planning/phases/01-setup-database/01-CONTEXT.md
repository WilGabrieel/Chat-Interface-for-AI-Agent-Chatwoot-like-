# Phase 1: Setup & Database - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Duration:** Week 1 (5 days)
**Owner:** Backend Engineer

---

## Phase Boundary

**Goal:** Infraestrutura pronta, schema criado, API de auth funcional

**What This Phase Delivers:**
- Git repository com estrutura inicial
- Express server rodando localmente
- Prisma + MySQL configured
- Database schema criado (users, contacts, conversations, messages, insights)
- Migrations geradas e testadas
- Authentication endpoints (register, login, refresh)
- JWT middleware
- Docker + docker-compose.yml pronto
- Environment variables configurados
- `.gitignore` adequado

**Out of Scope (Phase 1):**
- Webhook handlers (Phase 2)
- Frontend (Phase 3)
- Insights calculations (Phase 4)
- Production deployment (Phase 5)

---

## Implementation Decisions

### Locked (from PROJECT.md + ROADMAP.md)

**Framework & Runtime**
- Express.js for server
- Node.js 18+ runtime
- Vite for frontend build (not Phase 1 concern)

**Database & ORM**
- MySQL (user has existing instance)
- Prisma ORM (for migrations + type safety)
- Schema: users, contacts, conversations, messages, insights_daily
- Indices on: conversation_id, contact_phone, createdAt, status

**Authentication**
- JWT tokens (jsonwebtoken library)
- Bcrypt for password hashing
- 24h token expiry
- Refresh token rotation
- JWT middleware for protected routes

**Environment & Secrets**
- .env file for secrets (JWT_SECRET, DB_URL, etc)
- .env.example tracked in repo (no secrets)
- NODE_ENV: development, production

**Containerization**
- Dockerfile for backend
- docker-compose.yml for local dev (MySQL + Express)
- Healthcheck endpoints

### Claude's Discretion

**Project Structure**
- Folder organization: `src/`, `prisma/`, `tests/`, `config/`, `utils/`
- Naming conventions (camelCase, PascalCase for classes)
- Middleware stack order and setup

**HTTP Status Codes**
- 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Server Error
- Consistent error response format

**Database Validation**
- Password requirements (min 8 chars, complexity)
- Email validation (regex or library)
- Phone number format (WhatsApp format)

**Prisma Seed Data**
- 2-3 test users (admin + supervisor)
- 1-2 test contacts
- Helper script for development

**Dependencies**
- Express, Prisma, JWT, Bcrypt, Dotenv, CORS, Morgan (logging)
- Dev: Nodemon, Jest, ESLint, Prettier

---

## Canonical References

**Upstream artifacts (MUST READ before planning):**

- `.planning/PROJECT.md` — Architecture decisions, tech stack, data model
- `.planning/REQUIREMENTS.md` — Feature specs, data schema, security requirements
- `.planning/ROADMAP.md` — Phase breakdown, task details (Section 2 Phase 2 has full schema)
- `.planning/STATE.md` — Assumptions, dependencies, risks

**No external specs** — All requirements fully captured in upstream artifacts.

---

## Specific Ideas

### Database Schema (from REQUIREMENTS.md section 3)

```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  passwordHash String
  name String
  role String // "admin" | "supervisor"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Contact {
  id String @id @default(cuid())
  phone String @unique
  name String
  avatarUrl String?
  tags Json
  conversations Conversation[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Conversation {
  id String @id @default(cuid())
  contactId String
  contact Contact @relation(fields: [contactId], references: [id])
  assignedToId String?
  assignedTo User? @relation(fields: [assignedToId], references: [id])
  status String // "active" | "closed" | "paused"
  messages Message[]
  lastMessageAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([contactId])
  @@index([status])
  @@index([lastMessageAt])
}

model Message {
  id String @id @default(cuid())
  conversationId String
  conversation Conversation @relation(fields: [conversationId], references: [id])
  sender String // "user_id" | "agent" | "contact"
  content String
  messageType String // "text" | "image" | "file"
  metadata Json?
  readAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([conversationId])
  @@index([createdAt])
}

model DailyInsight {
  id String @id @default(cuid())
  date DateTime @unique
  totalMessages Int
  errorRate Float
  avgResponseTime Float
  topErrors Json
  createdAt DateTime @default(now())
}
```

### Authentication Flow

```
User POST /auth/register
  → Validate email, password
  → Hash password (bcrypt)
  → Create user record
  → Return JWT + refreshToken
  → Client stores in localStorage

User POST /auth/login
  → Validate email/password
  → Generate JWT (24h expiry)
  → Generate refreshToken (longer expiry, stored in DB)
  → Return both tokens

Protected endpoints
  → Check Authorization: Bearer {JWT}
  → Verify JWT (jsonwebtoken.verify)
  → Attach user to request object
  → Continue if valid, return 401 if not
```

### Docker Setup

```yaml
# docker-compose.yml (local dev)
version: '3.8'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: chat_app
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://root:root@mysql:3306/chat_app
      JWT_SECRET: dev_secret_xxx
    depends_on:
      - mysql
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  mysql_data:
```

---

## Deferred Ideas

- OAuth/SSO authentication (v2)
- Social login (v2)
- Multi-language support (v2)
- Two-factor authentication (v2)
- Advanced password policies (v2)

---

**Phase:** 1 — Setup & Database (Week 1)
**Context gathered:** 2026-03-26 via ROADMAP.md + requirements synthesis
