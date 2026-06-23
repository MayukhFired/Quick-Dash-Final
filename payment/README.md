# payment/

Checkout and payment page. Handles delivery address selection, order summary, and Razorpay payment initiation + verification.

## Files

| File | Description |
|---|---|
| `payment.html` | Page markup — address map, order summary, payment method tabs |
| `payment.js` | Page logic — map, GST calc, Razorpay flow, order creation |
| `payment.css` | Styles for the checkout page |

## Features

- **Delivery address** — Interactive Google Map lets users pin their delivery location. Coordinates are reverse-geocoded to a readable address.
- **Recipient selector** — Deliver to "Self" (auto-fills user details) or "Someone Else" (manual name + phone).
- **Order summary** — Lists all cart items, subtotal, GST (5%), delivery fee, and grand total.
- **Payment methods** — Tabs for UPI QR, UPI Apps, Credit/Debit Card, and Net Banking — all powered by the Razorpay checkout modal.
- **Razorpay flow:**
  1. Page calls the backend (`POST /api/payments/verify`) to create an order.
  2. Razorpay modal opens with the order ID.
  3. On payment success, signature is verified server-side.
  4. Verified order is saved to `localStorage` and the user is redirected to `track/track.html`.
- **Empty cart guard** — Redirects back to discover if cart is empty on load.

## localStorage Keys Written

| Key | Description |
|---|---|
| `quickdash_active_order` | The newly placed order object (consumed by track page) |
| `quickdash_orders` | Appended to the user's order history |
| `quickdash_cart` | Cleared after successful order |
| `quickdash_cart_shop` | Cleared after successful order |

## Dependencies

Loads from `shared/`:
- `integrations.config.js` + `integrations.js` — Google Maps + Razorpay SDK
- `database.js` — shop and product lookup
- `auth.js` — session for prefilling user details

Backend endpoint:
- `POST http://localhost:8787/api/payments/verify`
