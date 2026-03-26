# RESEARCH — Chat Interface Architecture & Technologies

**Gathered:** 2026-03-26
**Status:** Complete
**Source:** 3 parallel research agents (UI/Frontend, Backend, Integration)

---

## 1. Frontend Stack Research

### UI Component Libraries Comparison

| Library | Best For Chat? | Verdict |
|---------|---|---|
| **Shadcn/ui** | ✅ YES (Recommended) | Lightweight, customizable, Tailwind-based, WAI-ARIA native |
| Material-UI | ⚠️ Partial | Too heavy for chat, better for dashboards |
| Ant Design | ❌ No | Designed for B2B data/tables, overkill |

**Winner:** `Shadcn/ui` — Starts fast, infinite customization, perfect for chat UIs

### Chat-Specific Components

**Recommended:** `@chatscope/chat-ui-kit-react` (GitHub stars: ⭐⭐⭐)

Provides pre-built components:
- `MessageList` — Scrollable message history
- `MessageInput` — Input field with send button
- `Conversation` — Container component
- Styling hooks for customization

**Alternatives:**
- `assistant-ui` — If AI-focused (composable, modern)
- `ChatKit` — Avoid (discontinued)

### Real-Time Technology Stack

| Solution | Verdict | Reasoning |
|----------|---------|-----------|
| **Socket.io** | ✅ Good | WebSocket with fallbacks, manual auth required |
| **Supabase Realtime** | ⭐ **BEST** | PostgreSQL + auth + real-time integrated, open-source, proven at scale |
| Firebase | Avoid | Vendor lock-in, expensive at scale |

**Winner:** `Supabase Realtime` — Best combo of real-time + persistence + auth

### Frontend Recommended Stack

```
React 18+ + Vite
├── UI Components: Shadcn/ui (customizable)
├── Chat Library: @chatscope/chat-ui-kit-react
├── Styling: Tailwind CSS
├── State: Zustand or Context API
├── Real-time: Socket.io client (or Supabase client SDK)
└── HTTP Client: Axios
```

### Open-Source References

- **Chatwoot** ([github.com/chatwoot/chatwoot](https://github.com/chatwoot/chatwoot)) — Full-stack live chat (Rails + React)
- **Papercups** — Open-source live chat alternative
- **Tiledesk** — Messaging with widget
- **Socket.IO examples** — [socket.io/socket.io GitHub](https://github.com/socketio/socket.io)

---

## 2. Backend Architecture Research

### Express + Socket.io Suitability

**For 10-20 conversations: ✅ IDEAL**

Node.js 20+ LTS provides:
- Excellent long-lived connection handling
- Non-blocking I/O for real-time
- Rich ecosystem for webhooks/auth

**Socket.io features:**
- Automatic reconnection
- Room management (isolated conversations)
- WebSocket + long-polling fallback
- Efficient broadcasting

### Message Queue: Redis vs RabbitMQ

| Criteria | Redis | RabbitMQ |
|----------|-------|----------|
| **Use Case** | Fire-and-forget, caching, pub/sub | Durable, guaranteed delivery |
| **For Your Scale** | ✅ Sufficient | Overkill initially |
| **Migrate To** | When > 100 conversations | When reliability critical |

**Recommendation:** Start with **Socket.io direct**, add Redis caching in Phase 4 if needed.

### ORM: Prisma vs TypeORM

| Criteria | Prisma | TypeORM |
|----------|--------|---------|
| **Dev Experience** | Excellent | Good |
| **Type Safety** | Auto-generated | Manual |
| **Performance** | Rust query engine | Fine-grained control |
| **Learning Curve** | Gentle | Steeper |
| **Ideal For** | MVP/Startup | Legacy systems |

**Winner:** `Prisma` — Faster development, excellent migrations, auto types

### Authentication: JWT Best Practices

**Standard pattern: JWT + Refresh Tokens**

Configuration:
```javascript
Access Token: 15-30 minutes expiry
Refresh Token: 7 days expiry (in HttpOnly cookie)
Secret: Environment variable (never hardcoded)
HTTPS: Required in production
```

Libraries:
- `jsonwebtoken` — Token generation/validation
- `cookie-parser` — HttpOnly cookie handling
- `bcryptjs` — Password hashing (10 salt rounds)

### Webhook Handling Pattern

```
Incoming webhook → Validate signature → Save to DB → Broadcast via Socket.io
```

Best practice: **At-least-once delivery with idempotency keys**
- Use message ID for deduplication
- Store processed message IDs in cache/DB
- Return 200 OK even if already processed

### Backend Recommended Stack

```
Node.js 20+ LTS + Express
├── ORM: Prisma (MySQL)
├── Real-time: Socket.io
├── Authentication: JWT + Bcrypt + HttpOnly cookies
├── Queue (Later): Redis for caching + pub/sub
├── Webhook: Built-in validation + retry logic
├── Testing: Jest (unit) + Supertest (integration)
└── DevOps: Docker + docker-compose
```

### Open-Source References

- **PnP SharePoint WebHooks** ([GitHub](https://github.com/pnp/sp-dev-samples/tree/master/samples/WebHooks.Nodejs.Socket.IO)) — Webhook + Socket.io template
- **Webhook Socket.io Example** ([roccomuso/node-webhooks](https://github.com/roccomuso/node-webhooks))
- **Socket.IO Chat Example** ([socket.io/socket.io](https://github.com/socketio/socket.io/tree/main/examples/chat))

---

## 3. n8n + Evolution API Integration Research

### Evolution API → n8n → Backend Flow

```
[WhatsApp Message]
        ↓ (via Evolution API webhook)
[n8n Webhook Node (Catch Hook)]
        ↓ (HTTP POST)
[Your Backend API]
        ↓ (processes)
[Database + Socket.io broadcast]
```

### n8n Webhook Configuration

**Mode:** Incoming Webhook (Catch Hook)

```
HTTP Method: POST
Path: /webhook/evolution-whatsapp
Authentication: Header Auth
  - Header: X-API-Key
  - Value: ${WEBHOOK_SECRET}
Response Mode: Using 'Respond to Webhook' node
```

### Evolution API Payload Structure

**Incoming message:**
```json
{
  "event": "messages.upsert",
  "instanceId": "seu_numero_whatsapp",
  "data": {
    "key": {
      "remoteJid": "5511987654321@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE52FCA9..."
    },
    "message": {
      "conversation": "Olá! Como posso ajudar?"
    },
    "messageTimestamp": 1679520000,
    "pushName": "João Silva",
    "status": "DELIVERED"
  }
}
```

**With media (images, documents):**
```json
{
  "data": {
    "message": {
      "documentMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "mimetype": "application/pdf",
        "title": "documento.pdf",
        "fileName": "documento.pdf"
      }
    }
  }
}
```

**Key fields:**
- `remoteJid` — Sender phone number
- `conversation` — Message text
- `messageTimestamp` — Unix timestamp
- `id` — Unique message ID (for deduplication)
- `fromMe` — Boolean (true = sent, false = received)

### n8n → Backend Communication

**HTTP Request Node configuration:**

```json
{
  "method": "POST",
  "url": "https://your-backend.com/api/v1/messages",
  "headers": {
    "Authorization": "Bearer ${BACKEND_TOKEN}",
    "X-Idempotency-Key": "{{ $json.data.key.id }}"
  },
  "body": {
    "from": "{{ $json.data.key.remoteJid }}",
    "text": "{{ $json.data.message.conversation }}",
    "messageId": "{{ $json.data.key.id }}",
    "timestamp": "{{ $json.data.messageTimestamp }}"
  }
}
```

### Retry Logic & Delivery Guarantees

**n8n built-in retry:**
- Max retries: 5
- Delay: Exponential backoff (1s → 5s)
- Timeout: Configurable per request

**At-least-once delivery pattern:**
1. n8n sends webhook to your backend
2. Your backend validates `X-Idempotency-Key`
3. Check if message ID already exists
4. If duplicate: Return 200 OK
5. If new: Process and save
6. Always return 200 OK to acknowledge

**Backend implementation example:**
```javascript
app.post('/api/v1/messages', async (req, res) => {
  const { messageId, from, text } = req.body;

  // Check if already processed
  const existing = await Message.findOne({ messageId });
  if (existing) return res.status(200).json({ status: 'duplicate' });

  // Save and broadcast
  const message = await Message.create({ messageId, from, text });
  io.emit('message:new', message);

  return res.status(200).json({ status: 'ok', id: message._id });
});
```

### n8n Example Workflow (JSON)

```json
{
  "nodes": [
    {
      "name": "Webhook - Evolution API",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "evolution-whatsapp",
        "httpMethod": "POST",
        "authentication": "headerAuth",
        "headerAuth": { "header": "X-API-Key", "value": "secret" },
        "responseMode": "responseNode"
      }
    },
    {
      "name": "HTTP Request - Backend",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-backend.com/api/v1/messages",
        "authentication": "bearerToken",
        "body": {
          "json": {
            "from": "={{ $json.data.key.remoteJid }}",
            "text": "={{ $json.data.message.conversation }}",
            "messageId": "={{ $json.data.key.id }}"
          }
        }
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "statusCode": 200,
        "responseBody": "{{ { status: 'received' } }}"
      }
    }
  ]
}
```

### Evolution API Configuration

```yaml
webhookUrl: "https://your-n8n.com/webhook/evolution-whatsapp"
webhookAuthHeader: "X-API-Key"
webhookAuthValue: "${WEBHOOK_SECRET}"
events:
  - MESSAGES_UPSERT        # New messages received
  - MESSAGES_UPDATE        # Message read status
  - CONNECTION_UPDATE      # Connection changes
```

### Open-Source References

- [n8n Webhook Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Evolution API Documentation](https://doc.evolution-api.com/v2/en/configuration/webhooks)
- [n8n + Evolution API Example](https://n8n.io/workflows/11754-build-a-whatsapp-assistant-for-text-audio-and-images-using-gpt-4o-and-evolution-api/)
- [Idempotent Webhook Pattern](https://medium.com/@Modexa/idempotent-webhook-retries-in-n8n-without-duplicates-8380273a95a2)

---

## 4. Integrated Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│              COMPLETE SYSTEM ARCHITECTURE                 │
└──────────────────────────────────────────────────────────┘

FRONTEND (Browser)
├── React 18 + Vite
├── Shadcn/ui + Tailwind CSS
├── @chatscope/chat-ui-kit-react
├── Socket.io client
└── Zustand state management

         ↕ (WebSocket + HTTP)

BACKEND (Node.js + Express)
├── Express server
├── Socket.io (real-time)
├── Prisma + MySQL (data)
├── JWT + Bcrypt (auth)
├── Webhook validation
└── Docker container

         ↕ (HTTP webhooks)

N8N INTEGRATION
├── Webhook node (receives from Evolution)
├── HTTP Request node (sends to backend)
├── Respond to Webhook node
└── Retry/error handling

         ↕ (Webhooks)

EXTERNAL SYSTEMS
├── Evolution API (WhatsApp gateway)
├── MySQL Database
└── Docker Registry / Railway
```

---

## 5. Technology Decisions Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React + Shadcn/ui | Fast, customizable, DX-friendly |
| **Chat UI** | @chatscope/chat-ui-kit | 50% of work pre-built |
| **Real-time** | Socket.io | Reliable, fallbacks, proven |
| **Backend** | Express.js | Lightweight, rich ecosystem |
| **ORM** | Prisma | Type-safe, migrations, DX |
| **Database** | MySQL | Your existing infrastructure |
| **Auth** | JWT + Bcrypt | Standard, secure, stateless |
| **Webhooks** | n8n native | Built-in, no custom validation needed |
| **DevOps** | Docker | Portable, Railway-ready |

---

## 6. Risk Assessment

### High Priority

| Risk | Mitigation |
|------|-----------|
| n8n webhooks drop | Implement retry + logging, monitor webhook deliveries |
| Socket.io disconnects | Auto-reconnect, heartbeat, graceful degradation |
| MySQL query slow | Index properly, pagination, caching with Redis v2 |

### Medium Priority

| Risk | Mitigation |
|------|-----------|
| Evolution API rate limits | Implement rate limiting in backend, queue if needed |
| JWT token expiry UX | Auto-refresh before expiry, clear error messages |
| Cold start time | Optimize Docker image, lazy load modules |

---

## 7. Next Steps

1. ✅ **Research complete** — All 3 domains investigated
2. → **Update PLAN.md** with specific library versions
3. → **Phase 1 Execution** can begin (all unknowns clarified)
4. → **Implement with Shadcn/ui + chatscope** in Phase 3

---

**Research Status:** ✅ COMPLETE
**Ready for Phase 1 Execution:** Yes
**External Dependencies Validated:** Yes (n8n, Evolution API, libraries)
