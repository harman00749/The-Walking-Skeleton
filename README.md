# TaskMatrix — Sprint 14 Walking Skeleton

TaskMatrix Sprint 14 is a standalone Fullstack authentication MVP demonstrating an end-to-end secure user pipeline: registration, bcrypt password hashing, JWT login, protected Express APIs, React route protection, and logout.

## Track

**Fullstack Developer — Node.js Secure Authentication & JWT Integration**

## Technology Stack

- React, TypeScript, React Router, Vite, CSS
- Node.js, Express, TypeScript
- MongoDB Atlas and Mongoose
- bcryptjs password hashing
- JSON Web Tokens (`jsonwebtoken`)
- Zod request validation
- Helmet, CORS, and authentication rate limiting
- Vercel frontend deployment and Render backend deployment

## Required Sprint 14 Features

- User schema with name, email, and password
- Password salted and hashed with bcrypt before MongoDB persistence
- `POST /api/auth/register`
- `POST /api/auth/login`
- Signed JWT returned after successful registration and login
- JWT persisted in browser `localStorage` as required by the sprint brief
- JWT verification middleware protecting `/api/tasks` and `/api/auth/me`
- Missing or expired token redirects the React client to `/login`
- Logout clears the token and closes the protected session

## Local Setup

1. Run `npm install` from the repository root.
2. Create `server/.env` using `.env.example` as the reference.
3. Use a MongoDB URI whose database name is `taskmatrix-auth`.
4. Set a random `JWT_SECRET` containing at least 32 characters.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.

Never commit `server/.env`, MongoDB credentials, JWT secrets, or production tokens.

## API Routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Deployment health check |
| POST | `/api/auth/register` | Public | Create an account and return JWT |
| POST | `/api/auth/login` | Public | Verify credentials and return JWT |
| GET | `/api/auth/me` | Protected | Return authenticated profile |
| GET | `/api/tasks` | Protected | Demonstrate protected TaskMatrix data |

## Deployment

- Render uses `render.yaml` to build and start the Express API.
- Vercel uses `vercel.json` to build the React SPA.
- Set `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api` in Vercel.
- Set `CLIENT_ORIGIN=https://YOUR-VERCEL-SITE.vercel.app` in Render.
- Add `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` only in Render environment settings.

## QA Demo

Register a new user, show the MongoDB user document with a bcrypt hash beginning with `$2`, log out, log back in, open the protected dashboard, and then prove that a missing token forces a redirect to the login page. Do not expose credentials or secrets during the recording.
