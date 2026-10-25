# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

EduNode Server is the backend API for [edunode.org](https://edunode.org) — an
education platform with courses, verifiable certificates, NFT credentials on
Stellar/Soroban, blogging, messaging, and email marketing.

- **Runtime:** Node.js 22.x, Express 4
- **Database:** MongoDB via Mongoose; sessions via `connect-mongodb-session`
- **Auth:** Passport (Google OAuth 2.0), JWT, email/password, Web3 wallet
  logins (Freighter, Albedo, MetaMask)
- **Blockchain:** Stellar SDK / Soroban; IPFS via nft.storage, web3.storage,
  Pinata
- **Payments:** Stripe (subscriptions + webhooks)
- **Email:** SendGrid, Mailgun, Mailjet, Nodemailer
- **AI:** OpenAI, Google Gemini (`@google/genai`)
- **Realtime:** `ws` WebSocket server + Socket.IO
- **License:** Apache-2.0

## Setup

```bash
npm install
```

Requires a `config/config.env` file (or equivalent env vars). See the env-var
table in `README.md` for the full list — at minimum `MONGO_URI`,
`SESSION_SECRET`, and `JWT_SECRET`.

## Commands

| Task | Command |
|---|---|
| Dev server (nodemon, auto-reload) | `npm run dev` |
| Production start | `node server.js` |
| NFT storage setup | `npm run setupNftStorage` |
| NFT storage test | `npm run test:nft` |

There is no lint, format, or unit-test harness configured. `test.js` is a
scratch file, not a test suite — do not rely on it. Verify changes by running
the server and exercising the relevant endpoints.

The API listens on `PORT` (default `5001`); a separate WebSocket server runs
on `5002`.

## Project Structure

```
server.js          App entry point (Express setup, security, DB, routes)
routes/            API route handlers (auth, courses, certificates, stripe, ...)
models/            Mongoose models
controllers/       Route controllers
middleware/        Auth/security middleware
services/          Business logic services
config/            DB connection, env config
scripts/           One-off scripts (email marketing init, template resets)
utils/             Helpers
public/            Static assets
universities.json  University reference data
passport.js        Passport strategy setup
sorobanUrl.js      Soroban RPC URL helper
```

## Conventions

- CommonJS modules (`require`/`module.exports`) — do not introduce ESM.
- Route handlers live in `routes/`; register them in `server.js`.
- Keep security middleware (Helmet, `express-rate-limit`, CORS allowlist) in
  place — this codebase was hardened after a security audit
  (`server_security_hardening.patch` documents that work; treat it as
  historical reference, do not re-apply it).
- Never commit secrets. API keys and credentials belong in
  `config/config.env` (gitignored) or Heroku config vars.
- Follow existing code style: callbacks/`async` patterns already in use,
  compact error handling at route boundaries.

## Deployment

Deployed on Heroku (`Procfile`: `web: node server.js`), stack `heroku-24`.
`npm run deployHeroku` commits and pushes to the `heroku` remote. The Stripe
webhook endpoint (`/api/stripe/webhook`) must be registered in the Stripe
dashboard.

## Caution Areas

- **Secrets:** `.env`/`config.env` files are gitignored — keep it that way.
- **Stripe webhook:** needs raw body parsing; don't wrap it in JSON body
  parsers.
- **Sessions vs JWT:** both auth mechanisms coexist — check which one a route
  expects before editing.
- **`universities.json`:** large generated reference file (~1.3 MB); avoid
  loading or diffing it unnecessarily.
