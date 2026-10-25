# EduNode Server

Backend API for [edunode.org](https://edunode.org) — an education platform with
courses, verifiable certificates, NFT credentials on Stellar/Soroban, blogging,
messaging, and email marketing.

## Tech Stack

- **Runtime:** Node.js 22.x, Express 4
- **Database:** MongoDB (Mongoose), session store via `connect-mongodb-session`
- **Auth:** Passport (Google OAuth 2.0), JWT, email/password, Web3 wallet logins
  (Freighter, Albedo, MetaMask)
- **Blockchain:** Stellar SDK / Soroban — NFT certificates, IPFS pinning via
  nft.storage, web3.storage, Pinata
- **Payments:** Stripe (subscriptions + webhooks)
- **Email:** SendGrid, Mailgun, Mailjet, Nodemailer — campaigns, templates,
  analytics, webhooks
- **AI:** OpenAI, Google Gemini (`@google/genai`) — tutor features
- **Realtime:** WebSocket (`ws`), Socket.IO
- **Security:** Helmet, express-rate-limit, CORS allowlist

## Getting Started

### Prerequisites

- Node.js 22.x
- A MongoDB instance (local or Atlas)

### Install

```bash
npm install
```

### Configure

Copy `config/config.env` (or create it) and set the required environment
variables:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Express session secret |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | API port (default `5001`; WebSocket server runs on `5002`) |
| `BASE_URL` / `CLIENT_URL` / `REDIRECT_URL` | Service and frontend URLs |
| `ALLOWED_ORIGINS` | Extra CORS origins |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` | Stripe |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | AI tutor providers |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_URL` / `MAILGUN_WEBHOOK_SIGNING_KEY` | Mailgun |
| `EDUNODE_GMAIL_EMAIL` / `EDUNODE_GMAIL_PASS` | Nodemailer Gmail transport |
| `NFT_STORAGE_API_KEY` | nft.storage IPFS pinning |
| `PINATA_API_KEY` / `PINATA_SECRET_API_KEY` | Pinata IPFS pinning |
| `DISCORD_TOKEN` | Discord bot |
| `ADMIN_SECRET_KEY` | Admin operations |

### Run

```bash
# Development (auto-reload via nodemon)
npm run dev

# Production
node server.js
```

The API listens on `PORT` (default `5001`) and the WebSocket server on `5002`.

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
```

See also:

- `EMAIL_MARKETING_README.md` — email marketing subsystem docs
- `STRIPE_SETUP.md` — Stripe configuration guide
- `IMPLEMENTATION_SUMMARY.md` — feature implementation notes

## Deployment

Deployed on Heroku (`Procfile`: `web: node server.js`). Set `NODE_ENV=production`
and configure all environment variables in the Heroku app settings. The Stripe
webhook endpoint (`/api/stripe/webhook`) must be registered in the Stripe
dashboard with the production URL.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

Copyright 2023-2026 EduNode contributors.
