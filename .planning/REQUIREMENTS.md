# REQUIREMENTS — Chat Interface para Agente IA

**Status:** Draft (aguardando research synthesis)
**Aprovado por:** ⏳ (pendente)
**Data:** 2026-03-26

---

## 1. Funcional Requirements (User Stories)

### Feature 1: Inbox de Conversas
**User Story:** Como supervisor, quero ver uma lista de todas as conversas ativas para acompanhar o agente em ação.

**Acceptance Criteria:**
- [ ] Dashboard mostra lista de conversas ordenada por última mensagem
- [ ] Cada item mostra: nome do contato, última mensagem (preview), timestamp
- [ ] Clicando em um conversa, abre o chat viewer
- [ ] Badge mostra número de mensagens não lidas
- [ ] Search/filter por nome de contato
- [ ] Status visual: ativo, pausado, fechado
- [ ] Mobile: lista em scroll vertical, desktop: sidebar

**Dependencies:** Banco de dados com tabela `conversations` e `contacts`

---

### Feature 2: Chat Viewer em Tempo Real
**User Story:** Como supervisor, quero ver o histórico de mensagens de uma conversa e novas mensagens chegarem em tempo real.

**Acceptance Criteria:**
- [ ] Carrega últimas 50 mensagens do histórico
- [ ] Scroll para baixo = carrega mais mensagens antigas
- [ ] Mensagens novas aparecem automaticamente (< 1s delay)
- [ ] Visual diferenciado: mensagens do usuário vs agente vs sistema
- [ ] Timestamps legíveis em formato local
- [ ] Indica se o agente está "digitando"
- [ ] Scroll lock automático quando novas mensagens chegam
- [ ] Avatar/badge identifica sender de cada mensagem

**Technical Requirements:**
- WebSocket/Socket.io para real-time broadcast
- Backend escuta mensagens do webhook n8n
- Database log completo de mensagens

**Blocking Issue:** Nenhuma

---

### Feature 3: Enviar Respostas
**User Story:** Como supervisor, quero poder responder a um cliente direto pela interface (respondendo como o agente ou como supervisor).

**Acceptance Criteria:**
- [ ] Input field para digitar resposta
- [ ] Botão "Enviar" (ou Enter)
- [ ] Resposta aparece imediatamente no chat (optimistic update)
- [ ] Backend envia resposta para n8n workflow
- [ ] n8n envia via Evolution API para WhatsApp
- [ ] Indicador visual enquanto mensagem é enviada
- [ ] Tratamento de erro se falhar (retry?)
- [ ] Limite de caracteres visível

**Role-based:**
- Supervisor pode responder (salvado com sender="supervisor")
- Agente pode responder (salvado com sender="agent")

**Dependencies:**
- Backend endpoint: `POST /api/messages/send`
- n8n configurado para receber triggers de mensagens

---

### Feature 4: Painel de Insights
**User Story:** Como supervisor, quero ver padrões de erro/sucesso do agente para identificar onde melhorar.

**Acceptance Criteria:**
- [ ] Métricas do dia: total de mensagens, taxa de erro, avg response time
- [ ] Gráfico: erros por tipo (pergunta não respondida, resposta irrelevante, etc)
- [ ] Top 5 erros mais frequentes (listados)
- [ ] Tendência: hoje vs semana passada
- [ ] Filtro por período (hoje, semana, mês)
- [ ] Exportar relatório em CSV

**Definition of "Erro":**
- Mensagem marcada como ruim pelo supervisor
- Ou: resposta muito curta/genérica (< 3 caracteres?)
- Ou: tempo de resposta > 5s

**Nice-to-have:** Sugestão automática baseada em padrões

**Dependencies:**
- Tabela `insights_daily` no DB
- Webhook para marcar respostas como erros (feedback)

---

### Feature 5: Autenticação
**User Story:** Como sistema, quero garantir que só usuários autorizados acessem o dashboard.

**Acceptance Criteria:**
- [ ] Login com email + password
- [ ] JWT token retornado (+ refresh token)
- [ ] Token expirar em 24h
- [ ] Refresh endpoint para renovar token
- [ ] Logout limpa token do frontend
- [ ] Senha hash (bcrypt) no banco
- [ ] Roles: admin (você), supervisor (outros)
- [ ] Admin pode ver todas as conversas
- [ ] Supervisor só vê conversas atribuídas

**Security Requirements:**
- HTTPS only em produção
- CORS configurado
- Rate limiting em login (5 tentativas/min)
- Password policy: min 8 chars, mix (letter+number+special?)

**Dependencies:**
- Tabela `users` com role field
- JWT middleware no Express

---

## 2. Non-Functional Requirements

### Performance
| Requisito | Target | Prioridade |
|-----------|--------|-----------|
| Dashboard load time | < 2s (full page) | Critical |
| Message latency | < 1s (webhook → browser) | Critical |
| Chat history load | < 500ms | High |
| Search response | < 300ms | High |
| WebSocket reconnect | < 5s | Medium |

### Scalability
- Suportar 2-5 supervisores simultâneos (v1)
- 100-500 conversas ativas
- 1000+ mensagens/dia
- Preparado para escalar para 10+ supervisores (v2)

### Reliability
- Uptime: 99.5% em produção
- Retry automático de webhooks (3x, com backoff exponencial)
- Graceful degradation se WebSocket cair
- Backup automático do MySQL (diário)

### Security
- Sem hardcoded credentials
- Env vars para secrets
- Rate limiting (API endpoints)
- CORS whitelist
- SQL injection protection (ORM)
- XSS protection (sanitize inputs)
- CSRF tokens em forms

### Compatibility
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versions)
- Responsive: Desktop (1920+), Tablet (768+), Mobile (375+)
- Suporte a idiomas: Português (PT-BR)

---

## 3. Data Requirements

### Dados que Precisam ser Armazenados

**Conversations**
- conversation_id (UUID)
- contact_phone (WhatsApp ID)
- contact_name
- created_at
- last_message_at
- status (active, closed, paused)
- assigned_to (supervisor user_id)

**Messages**
- message_id (UUID)
- conversation_id
- sender (user_id ou "agent" ou "contact")
- content (text)
- message_type (text, image, file, system)
- metadata (JSON: confidence score, intent, etc)
- created_at
- read_at (nullable)

**Users**
- user_id (UUID)
- email (unique)
- password_hash
- name
- role (admin, supervisor)
- created_at
- updated_at

**Contacts**
- contact_id (UUID)
- phone (WhatsApp ID, unique)
- name
- avatar_url (nullable)
- tags (JSON array)
- last_interaction_at
- created_at

**Insights**
- insight_id
- date
- total_messages
- error_rate (percentage)
- avg_response_time (seconds)
- top_errors (JSON array)

### Retention Policy
- Mensagens: 6 meses (depois archive)
- Conversas: indefinido (soft delete)
- Insights: 12 meses
- Logs: 7 dias

---

## 4. Integration Requirements

### n8n Webhook Integration
**What:** n8n envia eventos para seu backend quando:
- Nova mensagem chega (usuário → agente)
- Agente responde
- Conversa é aberta/fechada

**Payload Expected:**
```json
{
  "event": "message_received",
  "conversation_id": "uuid",
  "contact": { "phone": "xxx", "name": "xxx" },
  "message": {
    "content": "...",
    "sender": "contact|agent",
    "timestamp": "2026-03-26T14:00:00Z"
  }
}
```

**Security:**
- n8n signing key validação
- IP whitelist (n8n server IP)
- SSL/TLS certificate pinning

### Evolution API Integration
**What:** Sua interface + backend integram com Evolution API para:
- Enviar mensagens (via n8n)
- Receber webhooks (via n8n)
- Histórico de mensagens

**Flow:**
1. Supervisor digita resposta na interface
2. Envia POST /api/messages/send
3. Backend dispara webhook no n8n
4. n8n manda para Evolution API
5. Evolution envia via WhatsApp

**Formato de mensagem:**
```json
{
  "to": "55xxxxxxxxxxxx",
  "message": "conteúdo...",
  "type": "text"
}
```

---

## 5. User Roles & Permissions

### Admin (Você)
- [ ] Ver todas as conversas
- [ ] Editar settings do dashboard
- [ ] Gerenciar outros supervisores
- [ ] Acessar logs/analytics
- [ ] Resetar passwords

### Supervisor
- [ ] Ver conversas atribuídas a ele
- [ ] Responder mensagens
- [ ] Marcar respostas como bom/ruim
- [ ] Ver insights do dia
- [ ] Não pode: mudar settings, deletar dados, gerenciar outros

---

## 6. Use Cases Principais (Happy Path)

### Use Case 1: Monitorar Agente em Tempo Real
```
1. Supervisor loga no dashboard
2. Vê inbox com conversas ativas
3. Clica em uma conversa
4. Vê histórico completo
5. Nova mensagem chega → aparece em <1s
6. Clica em outra conversa
   → chat muda instantaneamente
```

### Use Case 2: Responder para Contato
```
1. Supervisor lê conversa
2. Percebe que o agente deu resposta ruim
3. Digita resposta melhor no input
4. Clica "Enviar"
5. Resposta aparece no chat imediatamente
6. Contato recebe no WhatsApp (<5s)
```

### Use Case 3: Analisar Padrões de Erro
```
1. Supervisor abre painel de insights
2. Vê: 45% de respostas genéricas hoje
3. Clica em "Ver detalhes"
4. Lista mostra quais perguntas causam erro
5. Exporta CSV para análise offline
6. Usa isso para briefing do agente depois
```

---

## 7. Acceptance Criteria Globais (MVP Ready)

- [ ] Todas as 5 features implementadas (inbox, chat viewer, envio, insights, auth)
- [ ] Performance requirements atendidos (< 2s load, < 1s message latency)
- [ ] Security checklist passado (JWT, CORS, rate limiting, etc)
- [ ] Testes E2E: happy path de cada feature funciona
- [ ] Documentação: README + API docs completo
- [ ] Deploy: funciona em Railway com Docker
- [ ] Zero critical bugs encontrados em UAT
- [ ] Supervisores conseguem usar sem treinamento (UX intuitiva)

---

## 8. Out of Scope (v2+)

- Anotações/feedback salvas no chat (v2)
- Transfer de conversas entre supervisores
- Múltiplos canais (Telegram, Instagram, etc)
- Fine-tuning do agente pela interface
- Analytics avançadas (cohort analysis, funnels)
- Mobile app nativa (web-responsive por enquanto)

---

## 9. Riscos & Mitigações Específicas

| Risco | Mitigação |
|-------|-----------|
| n8n webhook unreliable | Retry logic + webhook logs + alertas |
| WebSocket drops | Reconexão automática + heartbeat |
| MySQL vira gargalo | Índices bem planejados, cache Redis v2 |
| Escalabilidade de supervisores | Socket.io rooms/namespaces por supervisor |
| Data privacy (WhatsApp) | Encryption em repouso (TBD), GDPR compliance v2 |

---

**Status de Aprovação:**

- [ ] Product Owner: ____
- [ ] Tech Lead: ____
- [ ] Stakeholders: ____

**Próximo:** Gerar ROADMAP.md com fases detalhadas
