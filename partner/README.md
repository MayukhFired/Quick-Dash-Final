# partner/

Delivery partner dashboard. Lets registered delivery agents accept orders, track their active delivery, and view earnings.

## Files

| File | Description |
|---|---|
| `partner.html` | Dashboard markup — home tab, active delivery, earnings, profile |
| `partner.js` | Dashboard logic — order polling, delivery state, charts |

## Features

### Onboarding Screen
Shown if `quickdash_partner` is in localStorage but `isApproved` is false. Displays a pending approval message while the admin reviews the application.

### Home Tab
- Online/Offline toggle — when offline, no new orders are assigned.
- Incoming order card — shows pickup shop, delivery address, distance, and estimated payout.
- Accept / Decline buttons.
- Today's stats: deliveries completed, earnings, acceptance rate.

### Active Delivery Tab
- Shows the current in-progress delivery with shop and customer details.
- Stage updates: Accepted → Picked Up → Delivered.
- Marks the order as delivered and updates `quickdash_orders` in localStorage.

### Earnings Tab
- Weekly/Monthly earnings chart.
- Breakdown: base pay, distance bonus, tips.
- Total deliveries and average rating.

### Profile Tab
- Partner's name, vehicle type, registration number, and rating.
- Logout button.

## Access Guard

On load, if `quickdash_partner` is not found in localStorage, the page sets a trigger flag (`quickdash_trigger_partner_reg`) and redirects to discover — which opens the partner registration flow.

## localStorage Keys Read / Written

| Key | Description |
|---|---|
| `quickdash_partner` | Partner profile + approval status |
| `quickdash_orders` | Read to find pending pickups; updated on delivery |
| `quickdash_partner_earnings` | Running earnings log |

## Dependencies

Loads from `shared/`:
- `database.js` — shop address lookup
- `auth.js` — session / logout
