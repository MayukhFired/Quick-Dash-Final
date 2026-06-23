# track/

Live order tracking page. Animates delivery progress through four stages and shows a Google Map with shop, partner, and customer markers.

## Files

| File | Description |
|---|---|
| `track.html` | Page markup — stage tracker, map, delivery info |
| `track.js` | Page logic — stage state machine, map animation, ratings |
| `track.css` | Styles for the tracking page |

## How it Works

Delivery progress is computed from the **order placement timestamp**, so the page resumes correctly even after a browser refresh or restart. No polling to a server — all timing is client-side.

### Stage Timings (from order placement)

| Stage | Trigger (seconds after order) | Label |
|---|---|---|
| 0 | Immediately | Order Placed |
| 1 | 8 s | Store Accepted |
| 2 | 20 s | Partner Picked Up |
| 3 | 45 s | Delivered |

## Features

- **Progress stepper** — Visual 4-step timeline that advances automatically.
- **Google Map** — Shows shop pin, customer pin, and an animated delivery partner pin that glides between shop and customer.
- **Delivery details** — Order ID, shop name, estimated arrival, items, and total.
- **Stage 3 completion** — On delivery, the map is replaced with a success screen and a rating prompt.
- **Ratings** — Users can rate the store, delivery partner, and app (1–5 stars). Saved to `localStorage`.
- **No active order guard** — Redirects to discover if `quickdash_active_order` is missing.

## localStorage Keys Read / Written

| Key | Description |
|---|---|
| `quickdash_active_order` | Active order being tracked |
| `quickdash_orders` | Updated with final delivery status on completion |
| `quickdash_user` | Session user |

## Dependencies

Loads from `shared/`:
- `integrations.config.js` + `integrations.js` — Google Maps
- `database.js` — shop coordinates for map pins
- `auth.js` — session for header
