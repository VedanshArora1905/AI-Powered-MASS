## AI-Powered MASS – Multi-Agent Support System

AI-powered customer support system with a multi-agent architecture, built as a Turborepo monorepo.

### Tech Stack

- **Monorepo**: Turbo (`apps/*`, `packages/*`)
- **Backend**: Hono (`apps/api`)
- **Frontend**: React + Vite (`apps/web`)
- **Database**: PostgreSQL (Neon) with Prisma
- **ORM Package**: `@mass/db` (Prisma client + schema + seed)
- **Shared Types**: `@mass/shared` (placeholder for future shared contracts)
- **AI Behavior**: Router + Support/Order/Billing agents with simulated streaming (ready to swap to a real LLM)

### Project Structure

- `apps/api`: Hono backend
  - `src/routes`: route definitions (chat, agents)
  - `src/controllers`: controller layer (HTTP <-> services)
  - `src/services`: business logic, router + sub-agents
  - `src/middleware`: error handling, logging, rate limiting
- `apps/web`: React chat UI
  - Two-pane layout (conversations + chat)
  - Agent capabilities panel
  - Streaming responses and typing indicator
- `packages/db`: Prisma schema, client, and seed data
- `packages/shared`: placeholder for shared contracts / RPC types

### Getting Started

#### 1. Install dependencies

From repo root:

```bash
npm install
```

#### 2. Configure database

This project expects a PostgreSQL database. The easiest path is a Neon project.

In `packages/db/.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

#### 3. Migrate and seed

```bash
cd packages/db

npx prisma migrate dev --name init
npm run prisma:seed
```

This seeds:

- A demo user (`demo@mass.dev`)
- Sample orders + payments
- Conversations and messages touching support, orders, and billing flows

#### 4. Run the apps

In two terminals from repo root:

```bash
# Terminal 1 – API
npm run dev -- --filter @mass/api

# Terminal 2 – Web
npm run dev -- --filter @mass/web
```

Then open the web app (default Vite port, e.g. `http://localhost:5173`).

### API Overview

Base URLs:

- API: `http://localhost:3001`

#### Chat

- `POST /api/chat/messages`
  - Synchronous chat interaction (JSON)
- `POST /api/chat/messages/stream`
  - Streaming interaction, returns NDJSON:
    - `{"type":"meta","conversationId":"...","agentType":"ORDER"}`
    - `{"type":"delta","delta":"Order "}` (multiple lines)
- `GET /api/chat/conversations`
  - List conversations for a user (currently demo user)
- `GET /api/chat/conversations/:id`
  - Get conversation + messages
- `DELETE /api/chat/conversations/:id`
  - Delete conversation

#### Agents

- `GET /api/agents`
  - List router + support/order/billing agents with descriptions and tools
- `GET /api/agents/:type/capabilities`
  - Get capabilities for a specific agent type

#### Health

- `GET /health`

### Multi-Agent Design

#### Router Agent

- Inspects the latest user message and routes to one of:
  - Support agent
  - Order agent
  - Billing agent
- Simple keyword / pattern based classifier (easily swappable for ML/LLM).

#### Sub-Agents

- **Support Agent**
  - Tool: conversation history (queries last messages from DB)
  - Returns contextual troubleshooting guidance
- **Order Agent**
  - Tools: fetch order details, check delivery status
  - Uses `Order` records in DB keyed by external ID (e.g. `ORD-1001`)
- **Billing Agent**
  - Tools: payment history, refund status
  - Uses `Payment` records in DB associated with orders and user

Each agent is implemented as a service with a `handle` method and uses Prisma to talk to tools (database queries).

### Streaming & Typing Indicator

- Backend streaming is implemented as an async generator in `chatService`, exposed via `POST /api/chat/messages/stream`.
- It emits NDJSON events with metadata (conversation + agent type) and token deltas.
- The frontend:
  - Optimistically adds the user message.
  - Creates a placeholder agent bubble and updates it as token deltas arrive.
  - Drives an “Agent is typing…” indicator from the streaming lifecycle.

### Rate Limiting

- In-memory token bucket implemented as Hono middleware (`rateLimit`).
- Applied to:
  - `POST /api/chat/messages`
  - `POST /api/chat/messages/stream`
- Default policy: 30 requests per minute per IP with `429` and `Retry-After`.

### Notes / Future Work

- Replace simulated agent replies with a real LLM via Vercel AI SDK.
- Move shared API contracts into `packages/shared` and optionally add Hono RPC for full end-to-end types.
- Persist authenticated users instead of a single demo user.
- Add automated tests around router decision logic and tool usage.


