# shops/

Lists all available shops, split by proximity to the user's location.

## Files

| File | Description |
|---|---|
| `shops.html` | Page markup — location bar, filter pills, shop grid |
| `shops.js` | Page logic — filtering, distance sorting, rendering |
| `shops.css` | Styles for the shop listing page |

## Features

- **Near Me / Other Stores split** — Shops within 3 km are shown in the "Near Me" section; shops beyond 3 km appear under "Other Stores".
- **Distance calculation** — Uses the Haversine formula against the user's simulated/GPS coordinates (default: Market Center, New Delhi).
- **Category filter pills** — URL param `?category=<id>` pre-selects a category filter on page load. Users can switch categories using the pill row.
- **Search bar** — Filters shops by name or category in real time.
- **Location bar** — Displays current delivery location; clicking it triggers GPS + reverse geocoding.
- **Shop cards** — Show shop photo, name, category, rating, review count, distance, and open/closed status.

## Navigation

Clicking a shop card navigates to `shop/shop.html?store=<shopId>`.

## URL Params

| Param | Description |
|---|---|
| `category` | Pre-filter by category ID (e.g. `?category=grocery`) |
| `q` | Pre-fill search query |

## Dependencies

Loads from `shared/`:
- `integrations.config.js` + `integrations.js` — Google Maps for location
- `database.js` — `getShopsList()` with distance data
- `auth.js` — session state for header
