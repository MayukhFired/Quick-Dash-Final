# QuickDash

A quick-commerce delivery web app that connects customers with local shops for fast delivery. Built as a pure frontend app (HTML/CSS/JS) with a lightweight Node.js backend for payment verification.

## Project Structure

```
Quick Dash Final/
├── index.html          # Entry point — redirects to discover
├── .env.example        # Environment variable template
├── backend/            # Node.js payment verification server
├── shared/             # Shared utilities (auth, database, integrations)
├── discover/           # Home / category browse page
├── shops/              # Shop listing page
├── shop/               # Individual shop & product page
├── cart/               # Shopping cart
├── payment/            # Checkout & payment
├── orders/             # Order history
├── track/              # Live order tracking
├── signup/             # Sign up & sign in
├── admin/              # Admin dashboard (Aegis Command Center)
├── partner/            # Delivery partner dashboard
└── yourstore/          # Merchant store management dashboard
```

## User Flows

**Customer:** Discover → Shops → Shop (add to cart) → Cart → Payment → Track → Orders

**Merchant:** Sign up as merchant → YourStore dashboard (manage inventory, accept orders)

**Delivery Partner:** Sign up as partner → Partner dashboard (accept deliveries, track earnings)

**Admin:** Admin panel → Manage users, shops, complaints, verifications

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Storage:** `localStorage` for session, cart, orders, and mock database
- **Maps:** Google Maps JavaScript API (reverse geocoding + delivery map)
- **Payments:** Razorpay (UPI, cards, net banking)
- **Backend:** Node.js + Express (Razorpay signature verification only)

## Quick Start

1. Clone the repo.
2. Copy config files:
   ```bash
   cp shared/integrations.config.example.js shared/integrations.config.js
   cp .env.example backend/.env
   ```
3. Fill in your API keys in both files:
   - `shared/integrations.config.js` → Google Maps API key + Razorpay Key ID
   - `backend/.env` → Razorpay Key Secret
4. Start the backend:
   ```bash
   node backend/payment-verification-server.js
   ```
5. Open `index.html` in a browser (or serve via a local HTTP server).

## Environment Variables

See `.env.example`:

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret key (server-side only) |
| `ALLOWED_ORIGIN` | CORS origin for the frontend (e.g. `http://localhost:3456`) |
| `PORT` | Port for the backend server (default `8787`) |

## Notes

- All data is stored in `localStorage` — this is a demo/prototype app, not production-ready.
- The `mcp-shield.db` file is a local SQLite file used during development tooling; it is not part of the app's runtime.
- Never commit `shared/integrations.config.js` or `backend/.env` — both are in `.gitignore`.
