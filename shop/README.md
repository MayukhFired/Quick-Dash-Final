# shop/

Individual shop page. Displays a shop's product catalogue and lets customers add items to their cart.

## Files

| File | Description |
|---|---|
| `shop.html` | Page markup — shop header, sort bar, product grid, cart drawer |
| `shop.js` | Page logic — product rendering, cart management, sort/filter |
| `shop.css` | Styles for the shop detail page |

## Features

- **Shop header** — Shows shop name, category badge, rating, review count, and distance.
- **Product grid** — Lists all products for the selected shop with photo, name, price, and rating.
- **Add to cart** — Quantity +/− controls on each product card. Adds items to the persistent cart in `localStorage`.
- **Cart conflict guard** — If a user has items from a different shop in their cart, they are prompted to clear it before adding from the current shop.
- **Sort options** — Sort products by: Default (popularity), Price: Low to High, Price: High to Low, Top Rated.
- **Cart drawer / summary bar** — Shows item count and total at the bottom; tapping it navigates to the cart page.

## URL Params

| Param | Description |
|---|---|
| `store` | Shop ID to load (e.g. `?store=store-1`). Required — redirects to discover if missing. |

## localStorage Keys Written

| Key | Value |
|---|---|
| `quickdash_cart` | `{ productId: qty }` map |
| `quickdash_cart_shop` | Shop ID string linked to the current cart |

## Dependencies

Loads from `shared/`:
- `database.js` — `getShopById()`, `getProductsByShop()`
- `auth.js` — session for header
