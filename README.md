# ePocketShop Admin

Web admin dashboard for ePocketShop vendors. It is the web counterpart of the Flutter
`epocketshop-app` and talks to the same backends. Built with React (JavaScript), Vite and the
[Astryx design system](https://astryx.atmeta.com/) (`butter` theme).

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build in dist/
```

In development, `/api/wa` and `/api/shop` are proxied to the live services (see `vite.config.js`),
so no CORS setup is needed. A production build calls the services directly, so the backend must
allow your admin origin, or you must front it with a reverse proxy and set `VITE_WA_API_URL` /
`VITE_SHOP_API_URL`. See `.env.example`.

## Features

- Sign in, register with OTP, password reset
- Dashboard: revenue, orders, setup checklist
- Orders: period/status filters, order detail, payment status updates, CSV export
- Products: create, edit, pause, delete, images, extras and options
- Sales channels: store link, WhatsApp share, social links, QR code
- AI sales agent and analytics (embedded, with open-in-new-tab fallback)
- Customers: search, SMS broadcast, loyalty stamps and redemption
- Loyalty rules, verification (2 tiers), plans & billing, settings (profile, payments, bank)

## More features

- Notifications bell: new orders, unpaid orders older than 24h, out of and low stock (polls every minute; optional desktop alerts)
- Search (Ctrl/Cmd+K) across pages, quick actions, recent orders and products
- Products: bulk pause / resume / delete, CSV import and export
- Dashboard: revenue chart and a restock panel
- Orders: custom date range, printable receipts
- Customers: segments (repeat, new, inactive, top spenders) and targeted SMS
- Installable app (PWA), light / dark / system mode, QR code sharing

## Scripts

```bash
npm test   # unit tests (vitest)
```

## Not built (needs backend support)

Discount codes, team roles, refunds, order-status notifications to customers, reviews,
referrals, multi-store, audit log and token refresh. Delivery rates are read-only (Firebase).

## Known gaps

- Delivery rates are read-only: the mobile app stores them in Firebase Realtime Database.
- The session token is kept in `localStorage` (same model as the mobile app's local storage).
