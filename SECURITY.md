# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them using
[GitHub private vulnerability reporting](https://github.com/EduNodeOrg/server/security/advisories/new)
for this repository.

If you prefer, you may also reach out to the project maintainers directly
through the contact channels listed on
[edunode.org](https://edunode.org).

Please include the following details in your report:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Affected versions or commit SHAs, if known
- Any suggested mitigations, if you have them

## Response Timeline

- We will acknowledge receipt of your report within **7 days**.
- We will provide an initial assessment and, where possible, an estimated
  remediation timeline within **30 days**.
- We will keep you informed of our progress and coordinate disclosure with you.

## Scope

This repository is the backend API server for edunode.org. Security issues of
particular concern include:

- **Authentication & authorization** — Passport/Google OAuth, JWT handling,
  session management, Web3 wallet logins
- **Payment flows** — Stripe subscription and webhook handling
  (`/api/stripe/webhook`)
- **Blockchain interactions** — Stellar/Soroban transactions, IPFS pinning
  credentials
- **Injection & validation** — MongoDB query injection, unsanitized input
  reaching Mongoose queries or email templates
- **Rate limiting & abuse** — endpoints protected by `express-rate-limit`
- **Secrets exposure** — API keys or credentials committed to the repository
  (rotate immediately and report)
- **File uploads** — `multer`-handled uploads and image processing via `jimp`

## Supported Versions

Security fixes are applied to the `master` branch, which is what runs in
production on Heroku. There are no long-term support branches.

| Version | Supported |
|---|---|
| `master` (latest) | Yes |
| Older commits/tags | No |

## Security Measures in Place

- HTTP security headers via [Helmet](https://helmetjs.github.io/)
- Rate limiting via `express-rate-limit`
- CORS restricted to an allowlist of origins
- Session store in MongoDB (`connect-mongodb-session`) with secrets from
  environment variables
- Secrets and credentials kept out of version control (`config/config.env` is
  gitignored)
- A backend hardening pass was performed; see
  `server_security_hardening.patch` for the historical record

## Preferred Languages

We accept vulnerability reports in English.
