# discover/

The home page and entry point for customers. Users land here after `index.html` redirects them.

## Files

| File | Description |
|---|---|
| `discover.html` | Page markup — header, location bar, category grid, search |
| `discover.js` | Page logic — category rendering, location detection, navigation |
| `discover.css` | Styles for the discover page |

## Features

- **Category browser** — 14 product categories (Fruits & Veg, Dairy, Snacks, Drinks, Meat, Kitchen, Bakery, Instant Food, Personal Care, Cleaning, Baby Care, Home, Cafe, Grocery), each with an emoji and description.
- **Location bar** — Displays the user's current delivery location. Clicking it prompts the browser for GPS coordinates and reverse-geocodes them via Google Maps API.
- **Search** — Filters categories or navigates directly to the shops page with a query.
- **User header** — Shows sign-in button or profile avatar depending on session state.
- **Floating dock** — Bottom navigation bar shared across customer-facing pages.

## Navigation

Clicking a category pill navigates to `shops/shops.html?category=<id>`, pre-filtering the shop list.

## Dependencies

Loads from `shared/`:
- `integrations.config.js` + `integrations.js` — for Google Maps reverse geocoding
- `database.js` — category definitions
- `auth.js` — session check for header
