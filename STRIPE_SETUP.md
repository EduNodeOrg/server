# Stripe Integration — Backend Setup

## Environment Variables

Add to local `.env` and Heroku config vars:

```bash
STRIPE_SECRET_KEY=sk_live_...       # Secret key from Stripe Dashboard
STRIPE_PRO_PRICE_ID=price_...       # Pro tier price ID (€6.99/mo recurring)
STRIPE_WEBHOOK_SECRET=whsec_...     # Webhook signing secret
```

Heroku:
```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_... --app edunode
heroku config:set STRIPE_PRO_PRICE_ID=price_... --app edunode
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_... --app edunode
```

## Stripe Dashboard Setup

1. **Get API keys** — Developers → API keys → copy Secret key
2. **Create Pro product** — Products → Add product → "EduNode Pro" with recurring €6.99/mo price → copy Price ID
3. **Register webhook** — Developers → Webhooks → Add endpoint:
   - URL: `https://edunode.herokuapp.com/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the signing secret (`whsec_...`)

## API Endpoints

### `POST /api/stripe/create-checkout-session` (auth required)
**Headers:** `x-auth-token: <JWT>`
**Body:** `{ successUrl?: string, cancelUrl?: string }`
**Response:** `{ url: "https://checkout.stripe.com/...", sessionId: "cs_..." }`

### `POST /api/stripe/create-portal-session` (auth required)
**Headers:** `x-auth-token: <JWT>`
**Body:** `{ returnUrl?: string }`
**Response:** `{ url: "https://billing.stripe.com/..." }`

### `GET /api/stripe/subscription-status` (auth required)
**Headers:** `x-auth-token: <JWT>`
**Response:** `{ status, plan, currentPeriodEnd }`

### `POST /api/stripe/webhook` (Stripe only)
- Verifies `stripe-signature` header against raw body
- Returns `{ received: true }`

## User Schema Fields

Added to `models/User.js`:
- `stripeCustomerId` — Stripe customer (`cus_...`)
- `subscriptionId` — Stripe subscription (`sub_...`)
- `subscriptionStatus` — `active | canceled | past_due | none | ...`
- `subscriptionPlan` — `free | pro`
- `currentPeriodEnd` — Date

## Important Implementation Notes

- **Webhook raw body**: Mounted in `server.js` BEFORE `bodyParser.json()` so signature verification works.
- **Customer reuse**: A Stripe customer is created on first checkout and stored on the user.
- **Source of truth**: Subscription state is updated via webhooks, not via the success redirect.
- **Metadata**: `userId` is attached to checkout sessions and subscriptions for webhook lookup.
