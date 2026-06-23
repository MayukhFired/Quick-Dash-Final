# shared/

Shared utilities used across all pages of the QuickDash app.

## Files

### `auth.js`
Client-side authentication layer backed by `localStorage`.

- Registers new user accounts (customer, merchant, partner roles)
- Handles sign-in with email/password validation
- Manages the active session (`quickdash_user` in localStorage)
- Supports credential blacklisting (banned emails/phones)
- Exports helpers: `getSessionUser()`, `setSessionUser()`, `signOut()`

### `database.js`
Master mock database and shared app state.

- Defines the default shops list with categories, coordinates, ratings, and photos
- Defines product catalogues for each shop
- Provides lookup helpers: `getShopById()`, `getShopsList()`, `getProductsByShop()`
- Distance calculation between user location and shops (used to split "Near Me" vs "Other Stores")
- Seeded with 5 demo shops across New Delhi

### `integrations.js`
Third-party integration bootstrap for Google Maps and Razorpay.

- `Integrations.loadGoogleMaps()` — lazy-loads the Google Maps JS SDK using the configured API key
- `Integrations.reverseGeocodeGoogle(lat, lon)` — converts coordinates to a human-readable address
- `Integrations.openRazorpayCheckout(opts)` — opens the Razorpay payment modal with order details

### `integrations.config.js` *(gitignored)*
Your local API keys. Copy from `integrations.config.example.js` and fill in:
```js
window.QuickDashConfig = {
  googleMapsApiKey: 'YOUR_KEY',
  razorpayKeyId: 'YOUR_KEY'
};
```

### `integrations.config.example.js`
Safe-to-commit template with empty key values.

### `partner-register.js`
Multi-step partner/delivery agent registration flow UI logic. Handles the partner onboarding form shown when a user signs up as a delivery partner, including vehicle details and document submission steps.

## Usage

Every page that needs shared functionality includes these scripts before its own JS:

```html
<script src="../shared/integrations.config.js"></script>
<script src="../shared/integrations.js"></script>
<script src="../shared/database.js"></script>
<script src="../shared/auth.js"></script>
```

## Notes

- `integrations.config.js` is in `.gitignore` — never commit it.
- All data is stored in `localStorage`; there is no backend database.
