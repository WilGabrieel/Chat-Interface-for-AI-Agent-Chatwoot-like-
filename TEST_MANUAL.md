# Manual Testing Guide - Phase 1 Auth Endpoints

## Prerequisites

Before running these tests, ensure:
- MySQL 8.0 is installed and running on localhost:3306
- Database `chat_db` is created with user `chatuser:chatpass` (or update .env)
- Node.js 18+ is installed
- Dependencies are installed: `npm install`

## Setup Steps (First Time)

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if you have different MySQL credentials
   ```

2. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed test data (optional):**
   ```bash
   npx prisma db seed
   ```

4. **Start the server:**
   ```bash
   npm run dev
   # Server should be listening on http://localhost:3000
   ```

## Test Scenarios

### 1. Health Check Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T18:00:00.000Z"
}
```

---

### 2. Register New User

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

**Expected Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clue1234567890ab",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "supervisor"
  }
}
```

**Test Cases:**
- ✅ Valid email, password (8+ chars), name, role
- ❌ Email already exists (return 409)
- ❌ Invalid email format (return 400)
- ❌ Password < 8 chars (return 400)
- ❌ Missing name (return 400)
- ❌ Invalid role (return 400)

---

### 3. Login with Credentials

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "TestPassword123"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clue1234567890ab",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Test Cases:**
- ✅ Valid credentials (seeded: admin@example.com / TestPassword123)
- ❌ Wrong password (return 401)
- ❌ Non-existent email (return 401)
- ❌ Generic error message (never reveal if user exists)

---

### 4. Refresh Access Token

Copy the `refreshToken` from the login response, then:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Cases:**
- ✅ Valid refresh token returns new access token
- ❌ Invalid refresh token (return 401)
- ❌ Expired refresh token (return 401)
- ❌ Missing refresh token (return 400)
- Note: New access token should have updated `iat` (issued at)

---

### 5. Test JWT Token Contents

Decode the access token to verify contents. Using jwt.io or Node.js:

```bash
node -e "
const token = 'YOUR_TOKEN_HERE';
const parts = token.split('.');
const decoded = JSON.parse(Buffer.from(parts[1], 'base64'));
console.log(JSON.stringify(decoded, null, 2));
"
```

**Expected Payload:**
```json
{
  "userId": "clue1234567890ab",
  "email": "admin@example.com",
  "role": "admin",
  "iat": 1616809200,
  "exp": 1616895600  // ~24 hours later
}
```

**Verify:**
- `userId`, `email`, `role` are correct
- `iat` (issued at) is current time (±5s)
- `exp` (expiry) is ~86400 seconds (24 hours) in the future

---

### 6. Database Verification

Connect to MySQL and verify data:

```bash
mysql -u chatuser -p chat_db
```

Check tables:

```sql
-- Users table
SELECT id, email, name, role FROM users;

-- Should show test users (password hashes start with $2a$10$)
SELECT id, email, LEFT(passwordHash, 20) as hash_preview FROM users;

-- Refresh tokens table
SELECT id, userId, LEFT(token, 20) as token_preview, expiresAt FROM refresh_tokens;

-- Verify passwordHash is NOT plain text
SELECT email, LENGTH(passwordHash) as hash_length FROM users;
-- Should be ~60 characters for bcrypt hashes
```

---

## Validation Checklist

- [ ] Health endpoint returns 200 with `status: "ok"`
- [ ] Register creates user with hashed password (60 chars)
- [ ] Register returns JWT token with 24h expiry
- [ ] Register prevents duplicate emails (409)
- [ ] Register validates: email format, password min 8 chars, name required
- [ ] Login accepts valid credentials and returns tokens
- [ ] Login rejects invalid password with generic error (401)
- [ ] Login rejects non-existent user (401, generic error)
- [ ] Refresh generates new token with updated `iat`
- [ ] JWT tokens contain: userId, email, role, iat, exp
- [ ] Passwords in database are bcrypt hashes (NOT plain text)
- [ ] Refresh tokens are stored in database and can be revoked
- [ ] CORS headers are present in responses (Access-Control-Allow-Origin)

---

## Troubleshooting

### MySQL Connection Error
```
Error: P1001: Can't reach database server at `localhost:3306`
```
- Check MySQL is running: `mysql -u root`
- Check DATABASE_URL in .env

### Authentication Fails
```
Error: Invalid credentials
```
- Run seed script: `npx prisma db seed`
- Verify test users exist: `select * from users;`

### TypeScript Compilation Error
```bash
npm run build
```
- Ensure all dependencies are installed: `npm install`
- Check tsconfig.json is present

### Port 3000 Already in Use
- Change PORT in .env
- Or kill the process: `lsof -i :3000`

---

## Automated Testing (Phase 5)

For Phase 5, implement:
- Jest test suite for all auth endpoints
- Integration tests with real database
- Mocking for external dependencies
- GitHub Actions CI/CD

See `.planning/ROADMAP.md` Phase 5 for details.
