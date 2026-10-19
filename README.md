# TaskMatrix — Sprint 14, 15, 16 & 17 

TaskMatrix is a deployed Fullstack project-management application with secure authentication, owner-scoped MongoDB CRUD, Stripe Test Mode Checkout, and a hardened server-side Gemini microservice. Authenticated users can turn an existing task into five sanitized implementation sub-steps without exposing the AI key to React.

## Track

**Fullstack Developer — AI Endpoint Architecture & Backend Hardening**

## Technology Stack

- React 19, TypeScript, React Router, Vite, and responsive CSS
- Node.js, Express 5, and TypeScript
- MongoDB Atlas and Mongoose
- JWT authentication and bcrypt password hashing
- Zod payload validation
- Google Generative AI Node SDK with server-only secrets
- Stripe-hosted Checkout in Test Mode
- Helmet, CORS, login/AI/payment rate limiting, and standardized JSON errors
- Vercel frontend and Render backend

## Sprint 16 Deliverables

### P0 — Error handling and payload validation

- Every asynchronous auth, task, payment, and AI controller forwards failures through `try/catch` to one error boundary
- Consistent `{ success: false, error: { code, message, details? } }` responses
- Explicit `400`, `401`, `403`, `404`, `409`, `429`, `500`, `502`, and `503` behavior
- Invalid JSON, Mongoose cast/validation failures, duplicate keys, missing routes, and unknown failures are sanitized
- Strict Zod request schemas reject unknown keys before they reach MongoDB or Gemini

### P1 — Server-side AI microservice

- Protected `POST /api/ai/suggest` endpoint
- Official `@google/generative-ai` SDK runs only inside Express
- `GEMINI_API_KEY` is read only from the server environment
- Structured JSON generation plus Zod output validation
- Control-character, markdown-prefix, duplicate, length, and count sanitization before output reaches React
- Responsive AI modal with skeleton loading, retry, error, empty, results, and copy-checklist states
- Existing `Task` and `User` collections remain unchanged in compliance with Code Freeze

### P2 — Security and throttling

- Login: five failed requests per 15 minutes; successful requests do not consume the failure budget
- Registration: five requests per hour
- AI: five requests per minute
- Checkout: ten requests per 15 minutes
- JWT required before AI suggestions can be generated
- No `console.log()` statements in production backend source

## Sprint 15 Deliverables

### Secure task CRUD

- `POST`, `GET`, `PUT`, and `DELETE` endpoints for the primary `Task` resource
- JWT required for every task endpoint
- Immutable `authorId` assigned from the verified JWT, never accepted from the client
- List queries filtered by the authenticated user
- Explicit ownership comparison before single read, update, or delete
- `403 Forbidden` when another authenticated user targets a task they do not own
- Strict Zod schemas block unknown fields and invalid status, priority, or date values

### Client integration

- Database-backed Add Task and Edit Task forms
- Owner-scoped task list with status, priority, description, and due date
- Optimistic deletion filters the task from React state before the API finishes
- Failed deletion restores the previous state and reports the failure
- Loading, empty, success, and error feedback without a page reload

### Stripe Test Mode

- Authenticated `Upgrade to Pro` trigger
- Stripe Checkout Session created only by the Express server
- Test secret remains server-side
- Stripe-hosted payment page redirects to success or cancelled routes
- Success route retrieves the Checkout Session from the server
- Checkout `client_reference_id` must match the authenticated JWT user before the result is displayed

## Local Setup

1. Run `npm install` from the repository root.
2. Create `server/.env` using `.env.example` as the reference.
3. Use a MongoDB URI whose database name is `taskmatrix-auth`.
4. Set a random `JWT_SECRET` containing at least 32 characters.
5. Add a Stripe **Test Mode** secret key as `STRIPE_SECRET_KEY` to exercise checkout.
6. Add a Google AI Studio key as `GEMINI_API_KEY` and keep `GEMINI_MODEL=gemini-2.5-flash`.
7. Run `npm run dev`.
8. Open `http://localhost:5173`.

Never commit `server/.env`, MongoDB credentials, JWT secrets, Stripe secret keys, or production tokens.

## API Routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Friendly API status |
| GET | `/api/health` | Public | Deployment and database health |
| POST | `/api/auth/register` | Public | Create account and return JWT |
| POST | `/api/auth/login` | Public | Verify credentials and return JWT |
| GET | `/api/auth/me` | Protected | Return authenticated profile |
| POST | `/api/tasks` | Protected | Create an owned task |
| GET | `/api/tasks` | Protected | List only the user's tasks |
| GET | `/api/tasks/:id` | Owner only | Read one task |
| PUT | `/api/tasks/:id` | Owner only | Update one task |
| DELETE | `/api/tasks/:id` | Owner only | Delete one task |
| POST | `/api/ai/suggest` | Protected + throttled | Generate sanitized task sub-steps |
| POST | `/api/payments/create-checkout-session` | Protected | Create Stripe Test Checkout |
| GET | `/api/payments/sessions/:sessionId` | Checkout owner | Verify Checkout result |

## Task Payload

```json
{
  "title": "Ship secure CRUD",
  "description": "Verify the complete task lifecycle.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-10-18"
}
```

Allowed statuses are `todo`, `in-progress`, and `done`. Allowed priorities are `low`, `medium`, and `high`.

## Stripe Test Checkout

1. Enable Test Mode in the Stripe Dashboard.
2. Copy the Test Mode secret key beginning with `sk_test_`.
3. Add it to `server/.env` locally and `STRIPE_SECRET_KEY` in Render.
4. Never put the secret key in Vercel or React code.
5. From the dashboard, click **Upgrade to Pro**.
6. Use Stripe's documented test card `4242 4242 4242 4242`, any future expiry, and any three-digit CVC.
7. Confirm the application returns to `/payment-success` and verifies `paymentStatus: paid`.

This project uses a one-time USD 9 Test Mode payment strictly for the sprint demonstration. Real money is not processed.

## AI Suggestion Contract

Request:

```json
{
  "taskTitle": "Deploy TaskMatrix",
  "taskDescription": "Deploy the React client and Express API.",
  "count": 5
}
```

Successful response:

```json
{
  "success": true,
  "message": "AI sub-steps generated successfully.",
  "data": {
    "subtasks": [
      "Prepare production environment variables",
      "Deploy the Express API to Render",
      "Deploy the React client to Vercel",
      "Verify CORS and protected API requests",
      "Run a production smoke test"
    ]
  }
}
```

Malformed bodies return `400 VALIDATION_ERROR`; excessive calls return `429 AI_RATE_LIMITED`; missing server configuration returns `503 AI_NOT_CONFIGURED`. Provider details and secret values are never returned.

## Deployment

### Render backend

- Build: `npm install --include=dev && npm run build --workspace server`
- Start: `npm run start --workspace server`
- Health: `/api/health`
- Environment: `NODE_ENV`, `CLIENT_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `STRIPE_SECRET_KEY`

### Vercel frontend

- Build: `npm run build --workspace client`
- Output: `client/dist`
- Environment: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`

After each `main` branch update, verify both deployments and ensure Render's `CLIENT_ORIGIN` exactly matches the Vercel production domain.

## Verification

```text
npm run typecheck
npm run build
npm audit
```

Import `docs/TaskMatrix-Sprint16.postman_collection.json` to validate authentication, a successful AI request, malformed payload blocking, missing-route handling, and throttling headers.

## QA Demo

Within three minutes: sign in, open a database-backed task, generate five AI sub-steps, show the secure server endpoint, then use Postman to send an empty `taskTitle` and prove the API returns `400 VALIDATION_ERROR` without crashing. Briefly identify the login/AI rate limits and show the deployed Vercel URL. Do not display `.env` files or secrets.

