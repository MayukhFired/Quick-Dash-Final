# orders/

Order history page. Shows all past orders placed by the logged-in user.

## Files

| File | Description |
|---|---|
| `orders.html` | Page markup — order list, order detail panel |
| `orders.js` | Page logic — loading orders, filtering, detail view |
| `orders.css` | Styles for the order history page |

## Features

- **Order list** — Displays all past orders sorted by most recent. Each card shows order ID, shop name, date, item count, total, and status badge (Delivered, Cancelled, etc.).
- **Order detail panel** — Clicking an order opens a side/bottom panel with full item breakdown, delivery address, payment method, and timestamps.
- **Reorder** — Quick-add previous order items back to cart.
- **Role-aware nav** — Merchants see "Your Store" in the floating dock instead of "Shops".
- **Empty state** — Friendly prompt to start shopping if no orders exist.

## localStorage Keys Read

| Key | Description |
|---|---|
| `quickdash_orders` | Array of all past order objects |
| `quickdash_user` | Session user |

## Dependencies

Loads from `shared/`:
- `database.js` — product/shop name lookup for display
- `auth.js` — session check; redirects to sign-in if not logged in
