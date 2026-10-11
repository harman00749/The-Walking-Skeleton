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
