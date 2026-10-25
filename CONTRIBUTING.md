# Contributing to EduNode Server

Thanks for your interest in contributing! This document covers how to get set
up, our conventions, and how to submit changes.

## Code of Conduct

By participating, you are expected to uphold our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 22.x
- A MongoDB instance (local or Atlas)
- npm

### Setup

```bash
git clone https://github.com/EduNodeOrg/server.git
cd server
npm install
```

Create `config/config.env` with the required environment variables — see the
table in [README.md](README.md#configure). At minimum you need `MONGO_URI`,
`SESSION_SECRET`, and `JWT_SECRET`. **Never commit this file or any secrets.**

### Run

```bash
npm run dev        # nodemon with auto-reload
node server.js     # production-style start
```

The API listens on `PORT` (default `5001`); a WebSocket server runs on `5002`.

## How to Contribute

### Reporting Bugs

Open a [GitHub issue](https://github.com/EduNodeOrg/server/issues) with:

- A clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Relevant logs, request/response samples, or stack traces

**Do not file public issues for security vulnerabilities** — see
[SECURITY.md](SECURITY.md).

### Suggesting Features

Open a GitHub issue describing the problem you're solving and your proposed
approach before writing large amounts of code — it may save you rework.

### Submitting Pull Requests

1. Fork the repo and create a branch from `master`
   (`git checkout -b my-change`).
2. Make your changes following the conventions below.
3. Verify the server starts and the affected endpoints work — see
   [Testing](#testing).
4. Commit with a clear message describing *why* the change is needed.
5. Open a PR against `master` with a summary of the change and how you
   verified it.

Keep PRs focused — one fix or feature per PR makes review much faster.

## Conventions

- **Modules:** CommonJS (`require`/`module.exports`) throughout — do not
  introduce ESM or TypeScript.
- **Routes:** handlers live in `routes/` and are registered in `server.js`;
  business logic belongs in `services/` or `controllers/`.
- **Models:** Mongoose schemas in `models/`.
- **Style:** match the surrounding code — compact error handling at route
  boundaries, existing async/callback patterns.
- **Comments:** don't add comments to code you didn't change; keep new
  comments minimal and only where they add real clarity.

## Security Requirements

- Never commit secrets, API keys, or `.env` files.
- Preserve the security middleware — Helmet, `express-rate-limit`, and the
  CORS allowlist must stay enabled.
- The Stripe webhook (`/api/stripe/webhook`) requires raw request bodies —
  do not place a JSON body parser in front of it.
- Validate and sanitize user input before it reaches Mongoose queries,
  file handling, or email templates.
- Be careful touching auth code — sessions and JWTs coexist; check which
  mechanism a route uses before editing.

## Testing

There is currently no automated test suite. `test.js` is a scratch file, not
a test runner. To verify a change:

1. Start the server (`npm run dev`) and confirm it boots without errors.
2. Exercise the affected endpoints manually (curl, Postman, or the frontend).
3. For auth or payment changes, test the full flow including failure cases.

If you add a test framework, please document how to run it here.

## Project Layout

```
server.js      Express app entry (security, DB, route registration)
routes/        API route handlers
models/        Mongoose models
controllers/   Route controllers
middleware/    Auth/security middleware
services/      Business logic
config/        DB connection, env config
scripts/       One-off maintenance scripts
utils/         Helpers
```

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License, Version 2.0](LICENSE).
