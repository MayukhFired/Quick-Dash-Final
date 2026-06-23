# yourstore/

Merchant store management dashboard. Lets shop owners manage their product inventory, accept or deny incoming customer orders, and review order history.

## Files

| File | Description |
|---|---|
| `yourstore.html` | Dashboard markup — terminal, inventory, history tabs |
| `yourstore.js` | Dashboard logic — order polling, inventory CRUD, history |
| `yourstore.css` | Styles for the merchant dashboard |

## Access Control

Only users with `role: 'merchant'` can access this page. Any other role gets an "Access Denied" alert and is redirected to discover.

## Features

### Terminal Tab (default)
- **Live order polling** — Checks `localStorage` every few seconds for new incoming orders for this merchant's shop.
- **Order card** — Displays customer name, delivery address, items ordered, and total amount.
- **Accept / Deny** — Accepting the order marks it for delivery partner assignment; denying it cancels it with a reason.
- **No active order state** — Friendly idle screen when no orders are waiting.

### Inventory Tab
- **Product list** — Shows all products registered under this shop with photo, name, price, category, and stock status.
- **Add product** — Form to add new products (name, price, category, photo URL, description).
- **Edit / Delete** — Inline controls on each product card.
- **Sync to Master DB** — Changes propagate to `database.js`'s shared state so the shop page reflects them immediately.

### History Tab
- **Past orders** — All previously accepted or denied orders.
- **Filter** — Show All / Accepted / Denied.
- **Order receipts** — Clicking an order shows a full breakdown modal.

## Category Map

The dashboard supports these store categories:

| ID | Label |
|---|---|
| `grocery` | Grocery / Kirana |
| `pharmacy` | Pharmacy / Medical |
| `bakery` | Bakery & Confectionery |
| `fruits` | Fruits & Vegetables |
| `electronics` | Electronics & Repair |
| `clothing` | Clothing & Textiles |
| `restaurant` | Restaurant / Tiffin |
| `hardware` | Hardware & Tools |
| `stationery` | Stationery & Books |
| `other` | Other |

## localStorage Keys Read / Written

| Key | Description |
|---|---|
| `quickdash_user` | Session; must be a merchant |
| `quickdash_orders` | Incoming orders polled here; updated on accept/deny |
| `quickdash_custom_shop_<id>` | Merchant's customised shop data |
| `quickdash_inventory_<id>` | Product list for this shop |

## Dependencies

Loads from `shared/`:
- `database.js` — master shop/product data
- `auth.js` — session check and role gate
