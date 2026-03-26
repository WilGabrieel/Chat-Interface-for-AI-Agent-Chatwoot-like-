# Projeto: Interface de Gerenciamento de Conversas IA (Chatwoot-like)

**Status:** Iniciação
**Timeline:** 1 mês (início imediato)
**Última atualização:** 2026-03-26

---

## 1. Visão & Problema

### Visão
Criar uma **interface de gerenciamento de conversas em tempo real** para monitorar e ajustar um agente IA responsivo que está rodando no **n8n + Evolution API** (WhatsApp).

### Problema Principal
Hoje você tem:
- ✅ Agente IA rodando no n8n
- ✅ Webhooks do Evolution API conectados
- ❌ Sem visibilidade em tempo real das conversas
- ❌ Difícil ajustar comportamento do agente rapidamente
- ❌ Supervisores não conseguem acompanhar o que está acontecendo

### Contexto Técnico Existente
- **IA Agent:** Workflow em produção no n8n
- **Messaging:** Evolution API (WhatsApp) hospedado no Railway
- **Database:** MySQL (estrutura de conversas a definir)
- **Integradores:** n8n webhook → seu backend → frontend

---

## 2. Objetivos & Sucesso

### Objetivos de Negócio
1. **Visibilidade em tempo real** — Ver conversas do agente conforme acontecem
2. **Ajustes rápidos** — Identificar e corrigir comportamentos ruins do agente rapidamente
3. **Controle multi-usuário** — Você + supervisores acompanhando o mesmo dashboard

### Success Criteria (MVP)
- [ ] Dashboard carrega em < 2s
- [ ] Mensagens aparecem em tempo real (< 1s delay)
- [ ] Consegue enviar respostas de volta pela interface
- [ ] Painel de insights mostra padrões de erro
- [ ] Autenticação funciona (você + supervisores)
- [ ] Interface responsiva em desktop/tablet

---

## 3. Escopo & Constraints

### In Scope (v1)
1. **Inbox** — Lista de conversas compiladas por contato
2. **Chat Viewer** — Histórico + mensagens em tempo real
3. **Enviar Respostas** — Poder responder direto pela interface
4. **Painel de Insights** — Estatísticas básicas (respostas ruins, padrões de erro)
5. **Autenticação** — Login para você + supervisores
6. **Database Schema** — Criar migrations para MySQL

### Out of Scope (v2+)
- Feedback/anotações no chat
- Transfer de conversas entre supervisores
- Integração com múltiplos canais (Telegram, Instagram)
- IA training/fine-tuning direto pela interface
- Chat bot de backup/fallback

### Constraints
| Constraint | Impacto | Nota |
|-----------|--------|------|
| **Timeline** | 1 mês | Coarse phases, foco em MVP |
| **Database** | MySQL (não PostgreSQL) | Adaptação necessária no stack |
| **n8n Integration** | Webhook-driven | n8n envia eventos para backend |
| **Real-time** | WebSocket necessário | Para mensagens ao vivo |
| **Usuários** | 2-3 pessoas max (v1) | Escalabilidade para v2 |
| **Hosting** | Railway | Junto com Evolution API |

---

## 4. Stack Técnico (Recomendado)

### Frontend
- **Framework:** React 18+
- **UI Library:** Shadcn/ui ou Material-UI (componentes prontos)
- **Real-time:** Socket.io (WebSocket)
- **State Management:** Zustand ou Context API
- **Build:** Vite (mais rápido que Create React App)

### Backend
- **Runtime:** Node.js + Express
- **Database:** MySQL (host: será configurado)
- **Real-time:** Socket.io
- **ORM:** Prisma (migrations + type-safe queries)
- **Auth:** JWT + refresh tokens
- **Hosting:** Railway (container Docker)

### DevOps & Tooling
- **Version Control:** Git (planejamento versionado)
- **Database Migrations:** Prisma Migrations
- **API Documentation:** Swagger/OpenAPI
- **Testing:** Vitest (frontend), Jest (backend)
- **Docker:** Dockerfile para containerizar backend

---

## 5. Arquitetura de Dados (MySQL)

### Tabelas Necessárias (v1)
```
users
├── id (PK)
├── email
├── password_hash
├── role (admin, supervisor)
└── created_at

conversations
├── id (PK)
├── contact_id (FK → contacts)
├── user_id (FK → users, last_attended_by)
├── status (active, closed, paused)
├── last_message_at
└── created_at

messages
├── id (PK)
├── conversation_id (FK)
├── sender (user, agent, contact)
├── content
├── metadata (JSON - confidence, intent, etc)
├── created_at

contacts
├── id (PK)
├── phone (WhatsApp unique ID)
├── name
├── last_interaction
└── tags (JSON array)

insights_daily
├── id (PK)
├── date
├── total_messages
├── error_rate
├── avg_response_time
└── top_errors (JSON)
```

---

## 6. Fluxo de Dados

```
WhatsApp (Evolution API)
    ↓ (mensagem do usuário)
n8n Webhook
    ↓ (POST /api/webhook/message)
Backend (Express)
    ↓ (salva em MySQL)
Database (Conversations + Messages)
    ↓ (broadcast via Socket.io)
Frontend (React + Socket.io client)
    ↓ (mostra em tempo real)
Dashboard do Usuário
    ↓ (usuário responde)
Backend (Express)
    ↓ (POST /api/messages/send)
n8n Trigger
    ↓ (workflow executa agente)
Evolution API
    ↓ (envia resposta via WhatsApp)
Contato
```

---

## 7. Roadmap (Coarse, Paralelo)

### Phase 1 — Setup & Database (Semana 1)
- Git + GitHub setup
- MySQL schema + migrations (Prisma)
- Docker setup (backend)
- Auth endpoints (JWT)
- **Output:** Database pronto, API de auth funcional

### Phase 2 — Backend Core (Semana 1-2)
- Express server com Socket.io
- Webhook endpoint (/api/webhook/message)
- Messages CRUD + real-time broadcast
- Conversations list + filters
- **Output:** Backend 80% completo

### Phase 3 — Frontend Dashboard (Semana 2-3)
- React setup + Vite
- Inbox component (lista de conversas)
- Chat viewer (histórico + messages)
- Socket.io integration
- **Output:** Dashboard funcional (sem envio ainda)

### Phase 4 — Interactions & Insights (Semana 3)
- Send message endpoint + frontend
- Insights panel (gráficos básicos)
- Error detection/flagging
- **Output:** MVP completo

### Phase 5 — Polish & Deploy (Semana 4)
- Testes E2E
- Performance tuning
- Docker + Railway deployment
- Documentação
- **Output:** Produção ready

---

## 8. Métricas de Sucesso

### Technical Metrics
- Dashboard load time: < 2s
- Message latency (webhook → browser): < 1s
- Database response time: < 100ms
- WebSocket uptime: > 99.5%

### User Metrics
- Ao menos 10 conversas sendo acompanhadas
- Padrões de erro identificáveis no insights
- Zero downtime durante primeira semana
- Supervisores conseguem logar e usar

### Quality Metrics
- Test coverage: > 70%
- Lighthouse score: > 80
- Zero SQL injection vulnerabilities
- Rate limiting: 100 reqs/min por user

---

## 9. Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| MySQL não escalável com volume | Média | Alto | Índices bem planejados, caching Redis v2 |
| WebSocket drops em produção | Baixa | Alto | Reconexão automática, heartbeat |
| n8n webhook unreliable | Baixa | Alto | Retry logic, webhook logs |
| Feature creep (supervisores pedem mais) | Alta | Médio | Escopo fechado, v2 backlog |

---

## 10. Entregáveis Finais (v1)

- ✅ Código-fonte no GitHub
- ✅ Docker Compose (local dev)
- ✅ Database schema + migrations
- ✅ API documentation (Swagger)
- ✅ Frontend em produção (Railway)
- ✅ Monitoria básica (logs + sentry)
- ✅ README com setup instructions
- ✅ Handoff document para manutenção

---

## 11. Próximos Passos

1. ✅ PROJECT.md aprovado
2. → REQUIREMENTS.md (definir user stories + acceptance criteria)
3. → ROADMAP.md (quebrar em phases de execução)
4. → Phase 1: Database + Backend Setup
5. → Iterative planning por phase

---

**Pronto para criar REQUIREMENTS.md?**
