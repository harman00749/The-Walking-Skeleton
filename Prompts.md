# Sprint 14 AI Architecture Log

This file records the architectural questions used while planning the TaskMatrix Walking Skeleton. AI output was treated as a draft and verified through code review, builds, API checks, and human validation.

## Query 1 — Password persistence

**Prompt:** How should a Mongoose user model guarantee that a plain-text password is never persisted?

**Decision:** Use a `pre("save")` hook, check `isModified("password")`, hash with bcrypt cost factor 12, and exclude the password field from normal queries and JSON output.

**Human validation:** Register a test user and inspect MongoDB Atlas. Confirm that the stored password begins with a bcrypt prefix such as `$2b$` and does not match the submitted password.

## Query 2 — JWT contract

**Prompt:** What is the smallest secure JWT payload and verification contract for a React and Express MVP?

**Decision:** Store the MongoDB user ID in `sub`, sign with a server-only secret, set issuer, audience, and expiration, and reject missing, malformed, or expired Bearer tokens.

**Human validation:** Call `/api/tasks` without a token, with a malformed token, and with a valid login token. Expect `401`, `401`, and `200` respectively.

## Query 3 — Protected React routing

**Prompt:** How should the React SPA prevent a user with a missing or expired JWT from seeing the dashboard?

**Decision:** Guard `/dashboard`, check token existence and expiration, redirect to `/login`, attach the Bearer token to protected API requests, and clear the session after any protected `401` response.

**Human validation:** Delete the token from browser localStorage and refresh `/dashboard`; confirm an automatic redirect to `/login`.

## Query 4 — Authentication abuse controls

**Prompt:** What lightweight protection should be applied to public register and login endpoints?

**Decision:** Validate strict payload schemas, normalize emails, return generic invalid-credential messages, apply request-size limits, and rate-limit authentication attempts.

**Human validation:** Submit malformed bodies and repeated login attempts, verifying structured `400` and `429` responses without server crashes.

---

# Sprint 15 AI Architecture Log

The following queries guided the Feature Complete sprint. Decisions were validated against the implementation, TypeScript compiler, production builds, API behavior, and the Stripe Test Mode contract.

## Query 5 — Task ownership enforcement

**Prompt:** How should an Express and Mongoose CRUD API prevent one authenticated user from reading, updating, or deleting another user's task?

**Decision:** Assign an immutable `authorId` exclusively from the verified JWT `sub` claim. Filter collection queries by `authorId`. For single-resource operations, load the document, return `404` when absent, compare `task.authorId` with `request.auth.userId`, and return `403 Forbidden` before mutation when they differ. Never accept `authorId` in request payloads.

**Human validation:** Create users A and B. Create a task as A, then attempt `GET`, `PUT`, and `DELETE /api/tasks/:id` using B's token. Confirm all three return `403` and the task remains unchanged.

## Query 6 — Strict CRUD payload validation

**Prompt:** What request validation contract keeps Task updates predictable and blocks ownership-field injection?

**Decision:** Use strict Zod create/update schemas with bounded title and description lengths, enum-based status and priority, ISO date-only due dates, and a non-empty partial update rule. Unknown keys such as `authorId` fail before reaching Mongoose.

**Human validation:** Send malformed status values, an empty PUT body, and a body containing `authorId`. Confirm structured `400 VALIDATION_ERROR` responses.

## Query 7 — Optimistic deletion recovery

**Prompt:** How can the React client delete a task instantly without losing data when the asynchronous API request fails?

**Decision:** Snapshot the current task array, immediately filter the target from state, issue the DELETE request in the background, and restore the snapshot with an error toast if the request rejects. Never reload the page.

**Human validation:** Delete normally and confirm the row disappears immediately. Then simulate a failed API request and confirm the row is restored with visible feedback.

## Query 8 — Secure Stripe Checkout boundary

**Prompt:** How should TaskMatrix add Stripe Checkout without exposing the secret key or trusting a success URL alone?

**Decision:** Create Checkout Sessions in the protected Express API using a server-only Test Mode key. Set the JWT user ID as `client_reference_id`. On the success route, retrieve the Session through a protected backend endpoint and require its reference ID to match the current JWT user before displaying verified payment status.

**Human validation:** Confirm no Stripe secret exists in the client bundle. Complete a test payment, verify `paymentStatus: paid`, then request another user's Checkout Session and expect `403`.

## Query 9 — Checkout abuse and failure states

**Prompt:** What minimum hardening should surround a demo payment endpoint?

**Decision:** Require JWT authentication, rate-limit Checkout creation, validate Session IDs, return sanitized `502/503` errors, keep the Test Mode key optional at server startup, and disable only the payment path when Stripe is not configured.

**Human validation:** Start without `STRIPE_SECRET_KEY` and confirm the rest of the application remains healthy while Checkout returns a structured `503`. Configure a test key and verify hosted Checkout opens successfully.
