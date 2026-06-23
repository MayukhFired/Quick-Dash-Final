# backend/

Lightweight Node.js + Express server responsible solely for verifying Razorpay payment signatures. This is the only server-side component in QuickDash.

## Files

### `payment-verification-server.js`
Express server with two endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/payments/verify` | POST | Verifies Razorpay HMAC signature |
| `/health` | GET | Health check |

### `.env` *(gitignored)*
Server secrets. Copy from the project root's `.env.example`:
```env
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
ALLOWED_ORIGIN=http://localhost:3456
PORT=8787
```

## Setup

```bash
cp .env.example backend/.env
# Fill in RAZORPAY_KEY_SECRET
node backend/payment-verification-server.js
```

## API

### `POST /api/payments/verify`

**Request body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "hex_signature"
}
```

**Responses:**
- `200` → `{ "ok": true, "verified": true }` — signature is valid
- `401` → `{ "ok": false, "verified": false }` — signature mismatch
- `400` → missing required fields

### `GET /health`
Returns `200 OK` when the server is running.

## Security

- `RAZORPAY_KEY_SECRET` stays on the server only — never expose it in frontend files.
- CORS is restricted to `ALLOWED_ORIGIN` from `.env`.
- Never commit `.env`.
