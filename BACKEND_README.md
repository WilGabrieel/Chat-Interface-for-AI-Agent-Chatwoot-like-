# Chat Interface Backend

Express.js backend for AI chat interface (Chatwoot-like) dashboard.

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Set up database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Server will run on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm test` - Run tests
- `npx prisma migrate dev` - Create and run database migrations
- `npx prisma db seed` - Seed database with test data

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
  - Body: `{ email, password, name, role? }`
  - Returns: `{ token, refreshToken, user }`

- `POST /auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, refreshToken, user }`

- `POST /auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Returns: `{ token }`

### Health Check

- `GET /health` - Server health status
  - Returns: `{ status, timestamp }`

## Database Schema

- **users** - User accounts with roles (admin, supervisor)
- **contacts** - WhatsApp contacts
- **conversations** - Conversations between contacts and agents
- **messages** - Individual messages in conversations
- **daily_insights** - Daily statistics and analytics
- **refresh_tokens** - JWT refresh tokens for token rotation

## Development Notes

### TypeScript

This project uses TypeScript. Ensure `npx tsc --init` has been run to generate `tsconfig.json`.

### Environment Variables

See `.env.example` for all required variables.

### Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- Refresh tokens are stored in database for revocation
- CORS is configured to allow frontend origin only

## Project Structure

```
src/
├── server.ts              # Express app initialization
├── config/
│   └── env.ts            # Environment configuration
├── routes/
│   └── auth.ts           # Authentication routes
├── controllers/
│   └── authController.ts # Auth business logic
├── middleware/
│   ├── cors.ts           # CORS configuration
│   ├── auth.ts           # JWT verification
│   └── errorHandler.ts   # Global error handling
├── types/
│   └── auth.ts           # TypeScript types
└── utils/                # Utility functions

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seed.js              # Seed script

tests/                    # Test files
```

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` in `.env`
- Ensure MySQL server is running
- Verify credentials are correct

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process using port 3000

### Prisma Schema Issues
- Run `npx prisma validate` to check schema
- Run `npx prisma studio` to inspect database GUI

## Phase 2+

See `.planning/ROADMAP.md` for next phases:
- Phase 2: Backend Core (webhook handling, real-time messaging)
- Phase 3: Frontend Dashboard (React + Vite)
- Phase 4: Interactions & Insights
- Phase 5: Polish & Deploy

## Contact

For questions, see project documentation in `.planning/`
