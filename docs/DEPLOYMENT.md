# Deployment Guide

## Production Architecture

- Mobile: Expo EAS builds to iOS/Android
- API: Dockerized Node service on ECS/Fargate, Cloud Run, or VM
- Data: PostgreSQL + Redis
- Realtime: Socket.IO for chat, ride telemetry, order shipping updates
- Payments: Stripe or Razorpay (RevenueCat optional mobile subscription flow)

## Steps

1. Provision Postgres and Redis
2. Apply `infra/sql/schema.sql`
3. Set server env vars and secrets
4. Deploy API container
5. Configure API gateway + TLS + strict CORS allowlist
6. Configure payment webhooks to `/api/subscriptions/webhook` and `/api/store/webhook`
7. Build mobile binaries with environment-specific API URL
8. Release via App Store / Play Console
9. Configure Firebase Admin env vars and verify `/api/notifications/test` delivery
10. Configure OTP providers (Twilio/SendGrid) and verify signup OTP delivery on both channels

## Observability

- Add Sentry SDK on server and mobile
- Add structured logs and metrics dashboards
- Add uptime checks on `/health`
- Alert on websocket disconnect spikes and payment webhook failures
- Alert on OTP delivery failures (Twilio/SendGrid API errors)
