# PROJECT STATE — Chat Interface para Agente IA

**Last Updated:** 2026-03-26 18:15 UTC
**Current Phase:** 01 — Setup & Database (COMPLETED)
**Status:** ✅ Phase 1 Complete, Ready for Phase 2

---

## Project Summary

**Name:** Chat Interface para Agente IA (Chatwoot-like)
**Purpose:** Dashboard de monitoramento em tempo real para agente IA no n8n + Evolution API
**Users:** 2-3 supervisores (você + team)
**Timeline:** 4 semanas
**Stack:** React + Node.js/Express + MySQL + Socket.io

---

## Artifacts Created

- ✅ `.planning/PROJECT.md` — Vision, goals, constraints, architecture
- ✅ `.planning/REQUIREMENTS.md` — 5 features + acceptance criteria
- ✅ `.planning/ROADMAP.md` — 5 phases com subtasks detalhadas
- ✅ `.planning/config.json` — Workflow preferences (parallel, coarse granularity)
- ⏳ `.planning/RESEARCH.md` — (aguardando agents completarem)

---

## Next Steps

### Immediate (Next Meeting)
1. ✅ PROJECT.md approved? → Sign-off date: ___
2. ✅ REQUIREMENTS.md changes needed? → List below
3. ✅ ROADMAP timing realistic? → Adjust if needed
4. Confirm MySQL setup (local + Railway)
5. Confirm n8n webhook configuration

### Phase 1 Completed (2026-03-26)
- ✅ GitHub repo created & code pushed
- ✅ Local dev environment configured (Node.js, packages, Docker)
- ✅ Prisma schema validated (npx prisma validate)
- ✅ Environment variables prepared (.env, .env.example)
- ✅ TypeScript compilation successful (npm run build)
- ✅ All 8 tasks completed

### Phase 2 Start (Next)
- [ ] Socket.io integration for real-time messaging
- [ ] Webhook handler for n8n integration
- [ ] Conversations and Messages APIs
- [ ] WebSocket rooms per conversation

---

## Known Unknowns (TBD)

| Item | Owner | Notes |
|------|-------|-------|
| MySQL hosting details | You | Local dev, Railway staging, Railway prod? |
| n8n webhook auth method | You | How to validate webhook signature? |
| Evolution API webhook format | You | Exact payload structure? |
| User avatar handling | Tech lead | Store in S3 or base64 in DB? |
| Rate limiting strategy | Tech lead | Per-user or per-IP? |
| Image/file message support | Product | Defer to v2? |

---

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| React + Vite frontend | Fast builds, great DX | 2026-03-26 |
| MySQL over PostgreSQL | Your existing infrastructure | 2026-03-26 |
| Socket.io for real-time | Mature, proven, good fallbacks | 2026-03-26 |
| Webhook-driven n8n | Simpler than polling | 2026-03-26 |
| Coarse phases | 4-week timeline, parallel execution | 2026-03-26 |

---

## Risks Identified

### High Priority

| Risk | Impact | Owner | Mitigation |
|------|--------|-------|-----------|
| n8n webhook unreliable | Can't receive messages | Backend | Retry logic + webhook logs + monitoring |
| WebSocket drops in prod | Real-time broken | Backend | Auto-reconnect + heartbeat |
| MySQL scalability | Slow queries at scale | DBA | Indexing strategy, caching v2 |

### Medium Priority

| Risk | Impact | Owner | Mitigation |
|------|--------|-------|-----------|
| Feature creep | Timeline slip | Product | Strict scope, v2 backlog |
| Auth tokens not refreshed | User suddenly logged out | Frontend | Auto-refresh before expiry |
| Deploy day issues | Can't launch | DevOps | Dry run on staging first |

### Low Priority

| Risk | Impact | Owner | Mitigation |
|------|--------|-------|-----------|
| CSS framework friction | Slower frontend dev | Frontend | Use component library (Shadcn) |
| Docker build times | Slower iteration | DevOps | Cache layers, optimize Dockerfile |

---

## Research Findings (In Progress)

**Agents Running:**
1. UI Libraries research (Socket.io + component libraries)
2. Backend architecture best practices
3. n8n + Evolution API integration patterns

**To be synthesized when complete:**
- Recommended component library (Shadcn vs Material vs Ant)
- Backend folder structure best practices
- Webhook security validation methods
- Open-source examples (repos to reference)

---

## Communication Plan

### Daily
- Team standup (async or sync): what did you do, what's blocked?

### Weekly
- Sprint review (Friday): demo what's working
- Sprint planning (Monday): confirm next week's focus

### Bi-weekly
- Project sync with stakeholders: are we on track?

### On-Demand
- Blocker meetings: when something breaks the critical path

---

## Success Criteria at Finish Line

- [ ] Dashboard live at `https://yourdomain.com`
- [ ] All 5 features working (inbox, chat, send, insights, auth)
- [ ] WebSocket real-time < 1s latency (verified)
- [ ] Dashboard load < 2s (Lighthouse tested)
- [ ] Zero critical bugs found in UAT
- [ ] You + supervisors can use without training
- [ ] Database backed up daily
- [ ] Monitoring alerts configured

---

## Budget / Resources Needed

### Infrastructure
- MySQL server (Railway managed?)
- Node.js/Express hosting (Railway container)
- Object storage for avatars (S3 or similar)
- SSL certificate (auto via Railway)
- **Est. cost:** $20-50/month

### Tools
- GitHub (free for public, $4/mo if private)
- Sentry (free tier for error tracking)
- UptimeRobot (free tier)
- **Est. cost:** $0-10/mo

### Team
- 1 Backend engineer (lead)
- 1 Frontend engineer (lead)
- 1 DevOps/Fullstack (for deployment)
- **Est. effort:** 80-100 hours total

---

## Assumptions

1. **n8n is stable** — It sends consistent webhooks, doesn't drop events
2. **MySQL reachable from Railway** — Network configuration allows connection
3. **Evolution API is reliable** — Messages reach destination 99%+ of the time
4. **No external payment integration needed** — v1 is monitoring only
5. **GDPR/compliance concerns deferred to v2** — v1 focuses on functionality
6. **You control the n8n workflow** — Can modify it to send webhooks

---

## Dependencies on External Systems

```
Your app
  ↓ (depends on)
n8n (user's workflow)
  ↓ (depends on)
Evolution API (WhatsApp gateway)
  ↓ (depends on)
WhatsApp API
```

**Failure scenarios:**
- If Evolution API is down → messages don't flow to your dashboard
- If n8n workflow breaks → webhook never fires
- If your MySQL is down → app can't start

**Mitigation:** Health checks for each, alerts configured

---

## File Structure (After Completion)

```
.
├── .planning/                    # GSD artifacts
│   ├── PROJECT.md               # This project vision
│   ├── REQUIREMENTS.md          # Feature specs
│   ├── ROADMAP.md               # Phase breakdown
│   ├── STATE.md                 # This file
│   ├── RESEARCH.md              # Investigation findings
│   ├── config.json              # Workflow config
│   ├── phase-1/                 # Plans per phase
│   │   ├── PLAN.md
│   │   └── VERIFICATION.md
│   └── ...
├── backend/                     # Node.js/Express
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Route handlers
│   │   ├── models/              # Prisma models
│   │   ├── middleware/          # Auth, error handling
│   │   ├── socket/              # Socket.io handlers
│   │   └── utils/               # Helpers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/                   # Jest tests
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page routes
│   │   ├── hooks/               # Custom hooks
│   │   ├── store/               # Zustand stores
│   │   ├── api/                 # API client
│   │   └── utils/               # Helpers
│   ├── public/                  # Static assets
│   ├── tests/                   # Vitest tests
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── docker-compose.yml           # Local dev stack
├── .env.example                 # Env template
├── .gitignore
├── README.md                    # Setup guide
└── package.json                 # Root (if monorepo)
```

---

## How to Use This File

- **For handoffs:** Share STATE.md when pausing work
- **For onboarding:** New team member reads STATE.md to get up to speed
- **For status updates:** Reference "Status" section in standup
- **For problem-solving:** Check "Known Unknowns" and "Risks" sections

---

**Project initialized and ready. Next: `/gsd:plan-phase 1`**
