# Sprint 16 QA Demo — 3 Minutes Maximum

## 0:00–0:25 — Production application

- Open the Vercel URL and sign in.
- State that Sprint 16 extends the same TaskMatrix main branch, MongoDB database, and deployments.

## 0:25–1:20 — AI micro-feature

- Open **My tasks** and click **AI steps** on an existing MongoDB task.
- Click **Generate 5 steps** and show the loading state followed by the sanitized checklist.
- Explain that React calls the JWT-protected Express endpoint and never receives the Gemini key.

## 1:20–2:30 — Validation proof in Postman

- Open `TaskMatrix-Sprint16.postman_collection.json`.
- Run **Login and Store JWT** if a token is not already stored.
- Run the successful AI request.
- Run **Malformed AI Payload — Required Demo**.
- Show `400 Bad Request` and `error.code: VALIDATION_ERROR`; explain that Gemini and MongoDB are never called for this payload.

## 2:30–3:00 — Hardening summary

- Show the `loginLimiter` and `aiSuggestionLimiter` definitions briefly.
- State the limits: five failed logins per 15 minutes and five AI requests per minute.
- Mention standardized `404/500` errors and the absence of `console.log()` in production backend source.

Never show `.env`, JWTs, MongoDB credentials, Stripe keys, Gemini keys, or raw Authorization headers.

