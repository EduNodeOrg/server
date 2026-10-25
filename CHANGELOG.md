# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project documentation: `AGENTS.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `CHANGELOG.md`, `CONTRIBUTING.md`

### Changed

- CORS configuration updated; deployed to Heroku on the `heroku-24` stack

### Fixed

- Mailgun API errors no longer crash the server (error handling added)

## [0.1.1] - 2025-05-28

### Added

- Comprehensive backend security hardening (Helmet, `express-rate-limit`,
  CORS allowlist, session/JWT hardening)
- Editable sent email campaigns (removed blocking frontend/backend validation)
- Email marketing subsystem: campaigns, templates, analytics, webhooks
  (`EMAIL_MARKETING_README.md`)
- Stripe subscriptions and webhook handling (`STRIPE_SETUP.md`)
- NFT certificates on Stellar/Soroban with IPFS pinning (nft.storage,
  web3.storage, Pinata)
- AI tutor features via OpenAI and Google Gemini
- Realtime messaging via `ws` and Socket.IO
- Web3 wallet logins (Freighter, Albedo, MetaMask) alongside Google OAuth and
  email/password auth

[Unreleased]: https://github.com/EduNodeOrg/server/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/EduNodeOrg/server/releases/tag/v0.1.1
