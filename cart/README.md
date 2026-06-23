# cart/

Shopping cart page. Shows all items the user has queued for purchase from a single shop.

## Files

| File | Description |
|---|---|
| `cart.html` | Page markup — item list, quantity controls, order summary |
| `cart.js` | Page logic — cart state, quantity updates, total calculation |
| `cart.css` | Styles for the cart page |

## Features

- **Item list** — Displays each cart item with product photo, name, unit price, and quantity +/− controls.
- **Quantity controls** — Increment/decrement individual item quantities; removing the last unit removes the item.
- **Shop info banner** — Shows which shop the cart belongs to.
- **Order summary** — Calculates item subtotal, delivery fee, and grand total in real time.
- **Empty cart state** — If cart is empty, shows a prompt to browse shops.
- **Proceed to Checkout** — Navigates to `payment/payment.html` when the user is ready.

## localStorage Keys Read / Written

| Key | Description |
|---|---|
| `quickdash_cart` | `{ productId: qty }` map |
| `quickdash_cart_shop` | Shop ID linked to the cart |
| `quickdash_user` | Session user (for header) |

## Dependencies

Loads from `shared/`:
- `database.js` — `getShopById()`, `getProductsByShop()`
- `auth.js` — session for header
