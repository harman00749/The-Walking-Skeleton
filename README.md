# TaskMatrix — Sprint 14/15 Feature Complete

TaskMatrix is a deployed Fullstack project-management application that now completes the full task data lifecycle. Authenticated users can create, read, update, and optimistically delete MongoDB task records they own. A server-side Stripe Test Mode Checkout flow provides the Sprint 15 monetization demonstration.

## Track

**Fullstack Developer — REST API CRUD Finalization & Gateway Monetization**

## Technology Stack

- React 19, TypeScript, React Router, Vite, and responsive CSS
- Node.js, Express 5, and TypeScript
- MongoDB Atlas and Mongoose
- JWT authentication and bcrypt password hashing
- Zod payload validation
- Stripe-hosted Checkout in Test Mode
- Helmet, CORS, authentication/payment rate limiting, and standardized JSON errors
- Vercel frontend and Render backend

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
6. Run `npm run dev`.
7. Open `http://localhost:5173`.

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

## Deployment

### Render backend

- Build: `npm install --include=dev && npm run build --workspace server`
- Start: `npm run start --workspace server`
- Health: `/api/health`
- Environment: `NODE_ENV`, `CLIENT_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `STRIPE_SECRET_KEY`

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

Import `docs/TaskMatrix-Sprint15.postman_collection.json` to validate authentication, full CRUD, malformed payload handling, and the owner-only contract.

## QA Demo

Within three minutes: sign in, create a task, edit it, delete it without reloading, explain the `authorId` ownership check, start Stripe Test Checkout, complete the test transaction, and show the verified success route. Do not display `.env` files or secrets.
