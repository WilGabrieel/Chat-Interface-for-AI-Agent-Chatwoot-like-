# ROADMAP — Chat Interface para Agente IA

**Timeline:** 1 mês (4 semanas)
**Granularity:** Coarse (5 fases)
**Execution:** Paralelo (fases independentes onde possível)

---

## Overview: Phases by Timeline

```
Week 1      Week 2        Week 3        Week 4
├─────────┼────────────┼────────────┼────────────┤
│ Phase 1 │            │            │            │
│ Setup   │ Phase 2    │ Phase 3    │ Phase 4    │
│         │ Backend    │ Frontend   │ Polish     │
│         │            │ Phase 4    │ Deploy     │
└─────────┴────────────┴────────────┴────────────┘

Legend:
- Phase 1 & 2 podem ser paralelos (Schema + Backend)
- Phase 3 começa quando Phase 2 tem 80% pronto
- Phase 4 é blocking: precisa Phase 3 + Phase 2
- Phase 5 pode rodar em paralelo com Phase 4
```

---

## Phase 1: Setup & Database (Week 1)

**Goal:** Infraestrutura pronta, schema criado, API de auth funcional

**Owner:** Backend Engineer
**Duration:** 5 dias
**Parallel with:** Phase 2 Backend Core

### Tasks

#### 1.1: Project Scaffolding
- [ ] Initialize Node.js project (npm init)
- [ ] Setup Express server boilerplate
- [ ] Environment variables (.env.example)
- [ ] Docker + docker-compose.yml
- [ ] GitHub repo + .gitignore

**Acceptance Criteria:**
- `npm run dev` inicia servidor em localhost:3000
- Docker builds sem erro: `docker-compose up`

#### 1.2: Database Setup
- [ ] MySQL database criado (local + Railway staging)
- [ ] Prisma instalado e configurado
- [ ] Schema file criado (schema.prisma)
- [ ] Migrations geradas do schema

**Schema (Prisma):**
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
  tags Json // array
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
}

model Message {
  id String @id @default(cuid())
  conversationId String
  conversation Conversation @relation(fields: [conversationId], references: [id])
  sender String // "user_id" | "agent" | "contact"
  content String
  messageType String // "text" | "image" | "file"
  metadata Json? // confidence, intent, etc
  readAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

**Acceptance Criteria:**
- `npx prisma migrate dev` cria tabelas sem erro
- Seed script insere 2 users de teste

#### 1.3: Authentication Setup
- [ ] Password hashing (bcrypt library)
- [ ] JWT strategy (jsonwebtoken library)
- [ ] POST /auth/register endpoint
- [ ] POST /auth/login endpoint
- [ ] POST /auth/refresh endpoint
- [ ] JWT middleware para rotas protegidas

**Endpoints:**

```javascript
POST /auth/register
{
  email: "user@example.com",
  password: "securepass123",
  name: "João Silva",
  role: "admin"
}
→ { token, refreshToken, user }

POST /auth/login
{ email, password }
→ { token, refreshToken, user }

POST /auth/refresh
{ refreshToken }
→ { token }
```

**Acceptance Criteria:**
- Login retorna valid JWT
- Token expirado retorna 401
- Refresh endpoint renova token
- Password é hash no banco (nunca plain text)

#### 1.4: Environment & Deployment Prep
- [ ] .env variables definidas (DB_URL, JWT_SECRET, etc)
- [ ] Dockerfile pronto
- [ ] Docker image build sem erro
- [ ] Railway setup (container registry)

**Acceptance Criteria:**
- Docker image disponível para push
- ENV vars não hardcoded

---

## Phase 2: Backend Core (Week 1-2)

**Goal:** Webhook processing, message storage, Socket.io real-time

**Owner:** Backend Engineer
**Duration:** 6-8 dias
**Parallel with:** Phase 1 Setup, Phase 3 Frontend

### Tasks

#### 2.1: Webhook Integration (n8n)
- [ ] POST /webhook/message endpoint
- [ ] Validar assinatura do webhook (n8n signature)
- [ ] Parse payload (conversation, message data)
- [ ] Salvar em DB (conversations + messages tables)
- [ ] Emit Socket.io event para clientes conectados

**Payload esperado:**
```json
{
  "signature": "hmac-sha256",
  "event": "message_received",
  "conversationId": "uuid",
  "message": {
    "id": "msg-123",
    "content": "Oi, tudo bem?",
    "sender": "contact",
    "timestamp": "2026-03-26T14:00:00Z"
  },
  "contact": {
    "phone": "5585987654321",
    "name": "Maria"
  }
}
```

**Acceptance Criteria:**
- Webhook recebe e processa sem erro
- Mensagem salva no DB em < 500ms
- Socket.io event emitido imediatamente
- Validação de assinatura funciona

#### 2.2: Socket.io Setup
- [ ] Socket.io server ligado em Express
- [ ] Cliente Socket.io pode conectar
- [ ] Namespace por usuário (isolação)
- [ ] Heartbeat para detect dead connections
- [ ] Reconexão automática (client-side)

**Rooms/Events:**
```
Rooms:
- /conversations:user_{userId} → só esse user recebe

Events:
- "message:new" → nova mensagem chegou
- "conversation:updated" → conversa atualizada
- "user:typing" → alguém está digitando
- "connection" / "disconnect"
```

**Acceptance Criteria:**
- Client conecta e recebe welcome message
- Mensagens broadcast para right room apenas
- Reconexão automática após desconexão

#### 2.3: Message CRUD Endpoints
- [ ] GET /api/conversations — lista conversas do user
- [ ] GET /api/conversations/:id — pega uma conversa
- [ ] GET /api/conversations/:id/messages — pega histórico
- [ ] POST /api/messages/send — envia mensagem
- [ ] Paginação em message history (cursor-based)

**Endpoints:**

```javascript
GET /api/conversations
→ [{ id, contactName, lastMessage, lastMessageAt, status }, ...]

GET /api/conversations/:id
→ { id, contact, messages: [], status, ... }

GET /api/conversations/:id/messages?cursor=uuid&limit=50
→ { messages: [], nextCursor, hasMore }

POST /api/messages/send
{ conversationId, content, type: "text" }
→ { id, conversationId, content, createdAt, ... }
```

**Acceptance Criteria:**
- Todos endpoints retornam 200
- Pagination funciona (cursor-based)
- Permissão verificada (user só vê seu conversations)

#### 2.4: Message Send Flow
- [ ] POST /api/messages/send recebe e valida
- [ ] Salva em DB (messages table)
- [ ] Dispara webhook no n8n
- [ ] n8n envia para Evolution API
- [ ] Response async (não bloqueia)

**Flow:**
```
Client POST /api/messages/send
  ↓
Backend validates + saves to DB
  ↓
Immediately returns 200
  ↓
Async: POST to n8n webhook
  ↓
n8n processes + calls Evolution API
  ↓
Evolution sends WhatsApp message
```

**Acceptance Criteria:**
- Message endpoint responde em < 300ms
- N8n webhook é chamado após DB save
- Resposta não espera n8n (async)

#### 2.5: Database Indexing & Optimization
- [ ] Index em conversation_id (messages)
- [ ] Index em contact_phone (uniqueness)
- [ ] Index em createdAt (sorting)
- [ ] Index em status (filtering)

**Acceptance Criteria:**
- Query de 1000 messages < 100ms
- List conversations < 300ms com 100 conversations

---

## Phase 3: Frontend Dashboard (Week 2-3)

**Goal:** UI funcional para inbox, chat viewer, real-time messaging

**Owner:** Frontend Engineer
**Duration:** 8-10 dias
**Starts when:** Phase 2 tem 80% (backend ready para consume)

### Tasks

#### 3.1: React Setup & Architecture
- [ ] Vite project initialization
- [ ] Folder structure: components, hooks, pages, utils
- [ ] Zustand store setup (auth, conversations, messages)
- [ ] Axios + API client
- [ ] Socket.io client library
- [ ] Error boundary component

**Acceptance Criteria:**
- `npm run dev` inicia em localhost:5173
- Hot reload funciona
- Build produção gera bundle < 500KB

#### 3.2: Auth Pages
- [ ] Login page (email + password form)
- [ ] Logout functionality
- [ ] Protected routes (redirect se not logged in)
- [ ] Token persistence (localStorage)
- [ ] Refresh token logic

**Pages:**
```
/login
/dashboard (protected)
/dashboard/conversations/:id (protected)
```

**Acceptance Criteria:**
- Login redirects para /dashboard
- Logout limpa localStorage + redireciona
- Token refresh automático antes de expirar

#### 3.3: Inbox Component
- [ ] List view com conversas
- [ ] Click → abre chat viewer
- [ ] Search/filter por nome
- [ ] Unread badge
- [ ] Status visual (active/closed/paused)
- [ ] Last message preview
- [ ] Sort por última mensagem

**UI Layout:**
```
┌─────────────────┬──────────────────┐
│  Sidebar        │                  │
│ ┌─────────────┐ │                  │
│ │ Search      │ │                  │
│ └─────────────┘ │                  │
│ ┌─────────────┐ │  Chat Viewer     │
│ │ Conv 1      │ │  (see 3.4)       │
│ │ Conv 2 ✓ 5 │ │                  │
│ │ Conv 3      │ │                  │
│ └─────────────┘ │                  │
└─────────────────┴──────────────────┘
```

**Acceptance Criteria:**
- Inbox carrega em < 1s
- Click em conversa muda chat viewer
- Search funciona (client-side ou API?)

#### 3.4: Chat Viewer Component
- [ ] Exibe histórico de mensagens (scroll)
- [ ] Socket.io listener para novas mensagens
- [ ] Input field para responder
- [ ] Botão "Enviar"
- [ ] Loading indicator enquanto envia
- [ ] Error toast se falhar
- [ ] Avatar/nome do sender
- [ ] Timestamp de cada mensagem
- [ ] Auto-scroll quando nova mensagem chega

**UI:**
```
┌──────────────────────────┐
│ Conversa com Maria       │
├──────────────────────────┤
│                          │
│ [Agente] Olá!        13h │
│                          │
│ [Maria] Oi, tudo bom?  │
│         Preciso de ajuda │
│                       13:05│
│                          │
│ [Seu Supervisor]         │
│ Vou responder!       13:06│
│                          │
├──────────────────────────┤
│ [Input] Digita resposta  │
│ [Enviar]                 │
└──────────────────────────┘
```

**Acceptance Criteria:**
- Histórico carrega em < 500ms
- Novas mensagens aparecem em < 1s (WebSocket)
- Envio funciona (POST /api/messages/send)
- Error handling visible ao usuário

#### 3.5: Real-time Integration (Socket.io)
- [ ] Connect ao Socket.io server
- [ ] Join room `conversations:user_{userId}`
- [ ] Listen para "message:new" events
- [ ] Update local store quando evento chega
- [ ] UI atualiza automaticamente
- [ ] Reconexão automática se desconectar

**Acceptance Criteria:**
- Socket.io conecta em < 500ms
- Mensagens chegam em tempo real
- UI atualiza sem refresh da página

#### 3.6: UI Polish & Responsiveness
- [ ] CSS/Tailwind setup
- [ ] Dark mode support (optional v1)
- [ ] Mobile responsive (375+ width)
- [ ] Tablet layout (768+ width)
- [ ] Loading skeletons
- [ ] Error states
- [ ] Empty states

**Acceptance Criteria:**
- Lighthouse score > 80
- Mobile viewport funciona
- Sem quebras de layout em 375px

---

## Phase 4: Interactions & Insights (Week 3)

**Goal:** Painel de insights, feedback marking, analytics básico

**Owner:** Full-stack (Backend + Frontend)
**Duration:** 5-6 dias
**Starts when:** Phase 2 + Phase 3 completados

### Tasks

#### 4.1: Insights Calculation
- [ ] Cron job (diário) calcula métricas
- [ ] Total messages do dia
- [ ] Error rate (baseado em feedback)
- [ ] Avg response time (message arrival → first response)
- [ ] Top 5 error types
- [ ] Salva em DailyInsight table

**Job rodaria todo dia às 23h (UTC-3):**
```javascript
- Pega todas messages do dia
- Calcula total
- Filtra errors (marked_bad = true)
- Calcula avg response time
- Persiste em DailyInsight
```

**Acceptance Criteria:**
- Cron job roda sem erro
- Insights salvos corretamente
- Query devolvem dados esperados

#### 4.2: Insights API
- [ ] GET /api/insights?date=2026-03-26
- [ ] GET /api/insights/range?from=...&to=...
- [ ] Dados retornam com gráfico-ready format

**Response:**
```json
{
  "date": "2026-03-26",
  "totalMessages": 245,
  "errorRate": 0.18,
  "avgResponseTime": 3.2,
  "topErrors": [
    { type: "generic_response", count: 22 },
    { type: "timeout", count: 15 },
    { type: "irrelevant", count: 8 }
  ]
}
```

**Acceptance Criteria:**
- Endpoint retorna 200
- Dados combinam com BD

#### 4.3: Insights Frontend Component
- [ ] Dashboard com cards: Total messages, Error rate, Avg time
- [ ] Gráfico linha: erro rate últimos 7 dias
- [ ] Gráfico barra: top errors
- [ ] Filtro por período (hoje, semana, mês)
- [ ] Botão "Exportar CSV"

**UI Sketch:**
```
┌──────────────────────────────┐
│ INSIGHTS - March 26, 2026    │
├──────────────────────────────┤
│ [Today] [Week] [Month]       │
├──────────────────────────────┤
│ Total Msgs | Error Rate | Avg │
│    245     │   18%      | 3.2s │
├──────────────────────────────┤
│ Error Trend (7 days)         │
│ [Line chart]                 │
├──────────────────────────────┤
│ Top Errors                   │
│ 1. Generic Response  22      │
│ 2. Timeout          15      │
│ 3. Irrelevant        8      │
│ [Export CSV]                 │
└──────────────────────────────┘
```

**Acceptance Criteria:**
- Gráficos renderizam em < 1s
- Filtro de período funciona
- CSV export funciona

#### 4.4: Message Feedback Marking
- [ ] Backend: adiciona field `markedBad` em messages (boolean)
- [ ] Frontend: botão ❌ em cada message (supervisor)
- [ ] Click marca message como bad
- [ ] Visual indicator (cor vermelha ou badge)
- [ ] Query para insights usam isso

**Acceptance Criteria:**
- Marcação persiste no DB
- Insights recalculam corretamente

#### 4.5: Export Reports
- [ ] Gera CSV com dados do período selecionado
- [ ] Columns: date, total_messages, error_rate, avg_response_time
- [ ] Download via browser

**Acceptance Criteria:**
- CSV válido e completo
- Download funciona

---

## Phase 5: Polish, Testing & Deploy (Week 4)

**Goal:** MVP pronto para produção, testado, documentado, deployado no Railway

**Owner:** Full-stack + DevOps
**Duration:** 5 dias

### Tasks

#### 5.1: Testing
- [ ] Unit tests (backend): auth, message CRUD, calculations
- [ ] Integration tests: webhook → DB → Socket.io
- [ ] E2E tests: login → inbox → chat → send → insights
- [ ] Coverage target: > 70%

**Test Framework:**
- Backend: Jest
- Frontend: Vitest + React Testing Library
- E2E: Playwright

**Acceptance Criteria:**
- `npm test` (backend) retorna > 70% coverage
- `npm run test:ui` (frontend) passa
- E2E tests cobrem happy paths

#### 5.2: Performance Optimization
- [ ] Lazy load React components
- [ ] Code splitting (chunks)
- [ ] Message pagination (não carregar todas ao abrir)
- [ ] Database query optimization
- [ ] Cache strategy (headers)
- [ ] Image optimization (avatars)

**Lighthouse targets:**
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Acceptance Criteria:**
- Lighthouse audit > 80 em tudo
- Bundle size < 500KB
- LCP < 2.5s

#### 5.3: Security Audit
- [ ] OWASP top 10 checklist
- [ ] SQL injection test (pass)
- [ ] XSS test (pass)
- [ ] CORS headers corretos
- [ ] No hardcoded secrets
- [ ] Rate limiting ativo
- [ ] HTTPS only em prod

**Acceptance Criteria:**
- Security scan retorna 0 issues
- Secrets em .env (não tracked)

#### 5.4: Documentation
- [ ] README.md (setup instructions)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema diagram
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Architecture diagram

**Acceptance Criteria:**
- Novo dev consegue fazer `npm run dev` em < 10 min
- API docs completa e accurate

#### 5.5: Deployment to Railway
- [ ] Dockerfile final
- [ ] docker-compose.yml pronto
- [ ] Environment variables configuradas no Railway
- [ ] MySQL database criado no Railway
- [ ] Backend container push e deploy
- [ ] Frontend build otimizado + deploy (ou Vercel)
- [ ] Custom domain (se tiver)
- [ ] SSL certificate

**Acceptance Criteria:**
- App live em production
- Health check endpoint retorna 200
- Dashboard acessível e funcional

#### 5.6: Monitoring & Alerting
- [ ] Sentry setup (error tracking)
- [ ] Logs estruturados (Winston)
- [ ] Health check endpoint
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Alert se servidor down

**Acceptance Criteria:**
- Erros em produção logged no Sentry
- 99.5% uptime durante semana 1

#### 5.7: Final UAT & Sign-off
- [ ] Manual testing: você + supervisores
- [ ] Bugs found → fix imediato
- [ ] Performance verified
- [ ] Data backup tested
- [ ] Rollback procedure documented

**Acceptance Criteria:**
- Zero critical bugs
- Todos features funcionam como spec
- Você aprova para produção

---

## Critical Path

```
Phase 1 (Setup)
  ↓
Phase 2 (Backend) ← Can run parallel with Phase 1
  ↓
Phase 3 (Frontend) ← Starts when Phase 2 is 80%
  ↓
Phase 4 (Insights) ← Requires Phase 2 + 3
  ↓
Phase 5 (Deploy) ← Final stage
```

**Parallel Opportunities:**
- Phase 1 + 2: Database schema can be created while setting up project
- Phase 3: Frontend can mock API while Phase 2 is finishing
- Phase 4 + 5: Insights calculations can be implemented while Phase 3 is under test

---

## Risk Mitigation in Roadmap

| Risk | Phase | Mitigation |
|------|-------|-----------|
| n8n integration issues | 2 | Early testing with real n8n, fallback to manual webhook testing |
| WebSocket unreliability | 3 | Comprehensive Socket.io testing, reconnection strategy |
| Performance bottleneck | 4 | Load testing before Phase 5, optimization plan ready |
| Scope creep | All | Strict acceptance criteria, v2 backlog for extras |

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | Schema valid & migrations run | 100% |
| 2 | All endpoints working, tests pass | 100% |
| 3 | UI responsive, Socket.io connected | 100% |
| 4 | Insights calculated & displayed | 100% |
| 5 | Lighthouse > 80, Uptime > 99% | 100% |

---

**Ready to proceed to Phase 1 planning?**
