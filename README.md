# Rideforge - Production-Ready Motorcycle Riding Platform

Rideforge is a full-stack rider platform built from your product requirements:
- Expo React Native mobile app with creative rider-first UI
- Node.js/Express TypeScript backend
- JWT auth with OAuth-ready endpoints
- GPS ride logging, route studio, online/offline map pack flow
- GPS ride logging with real-distance calculation and ride history summary
- Personal chat + group chat + local rider help request network
- Ecommerce store with online order placement and live shipping updates
- Rewards engine: points from ride completion and challenge completion
- Ride rewards enforced at `1 point per 100 km` with cumulative carry-over
- Points redemption in store checkout
- PostgreSQL persistence + Redis caching/session storage
- Payment provider abstraction: Stripe, Razorpay, RevenueCat
- Real-time events via Socket.IO
- Firebase Admin push pipeline (FCM) for chat/order notifications
- WhatsApp location sharing (manual + safety auto-share while riding)
- Dual onboarding: Rider and Riding Club registration with OTP verification
- Club directory, membership requests, and admin approval workflows
- OTP delivery providers: Twilio (SMS) + SendGrid (email)

## Monorepo Structure

- `apps/mobile`: Expo React Native application
- `apps/server`: Express API + Socket.IO server
- `packages/shared`: Shared TypeScript contracts
- `docs/openapi/openapi.yaml`: OpenAPI spec
- `docs/RELEASE_CHECKLIST.md`: Concrete go-live checklist
- `docs/FIREBASE_SETUP.md`: Firebase server/mobile setup
- `docs/DB_MIGRATION_CHECK.md`: Existing DB migration + verification commands
- `docs/NOTIFICATION_EVENTS.md`: Push notification event coverage matrix
- `infra/sql/schema.sql`: PostgreSQL schema
- `infra/docker`: Docker and compose setup
- `.github/workflows/ci.yml`: CI pipeline

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL and Redis, then backend:

```bash
npm run dev --workspace @rideforge/server
```

3. Start mobile app:

```bash
npm run start --workspace @rideforge/mobile
```

4. Optional run both:

```bash
npm run dev
```

If you already have an existing database, add these columns before running the updated rewards logic:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ride_distance_total_km NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ride_reward_km_remainder NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_cents INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee_cents INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
```

For the Ride & Events feature enhancements, ensure these columns exist:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'event';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
```

For Rider/Club onboarding and club membership flows, run:

```powershell
psql "$env:DATABASE_URL" -f "infra/sql/migrations/2026-02-22_signup_clubs_onboarding.sql"
```

## Server Environment

Copy `apps/server/.env.example` to `.env` and configure:
- `DATABASE_URL`
- `REDIS_URL`
- `PAYMENT_PROVIDER` (`stripe`, `razorpay`, `revenuecat`)
- Provider secrets (`STRIPE_*`, `RAZORPAY_*`, `REVENUECAT_API_KEY`)
- OTP providers:
  - `OTP_PROVIDER_MODE=live`
  - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE`
  - `OTP_REQUIRE_LIVE_PROVIDERS=true` for production enforcement
  - `OTP_EXPOSE_DEV_CODES=false` for production

## Deployment

- Follow `docs/DEPLOYMENT.md`
- Complete `docs/RELEASE_CHECKLIST.md` before production cutover
- Configure Firebase using `docs/FIREBASE_SETUP.md` if push notifications are required

## Security Notes

- Replace default `JWT_SECRET` in production
- Keep CORS allowlist strict
- Rotate payment webhook secrets periodically
- Enforce idempotency keys for order creation (`idempotency-key` header)
- Keep Redis-backed rate limits enabled
