# admin/

Admin dashboard, internally called the **Aegis Command Center**. Provides city-wide oversight of users, shops, orders, complaints, and verifications.

## Files

| File | Description |
|---|---|
| `admin.html` | Dashboard markup — tabs, data tables, modals |
| `admin.js` | Dashboard logic — all tab controllers, ban system, analytics |

## Features

### Overview Tab
- City stats: store count, visitor count, orders delivered, fulfillment %, growth %.
- Peak hours for the city.
- Quick action buttons.

### Analytics Tab
- Timeline toggle: Weekly / Monthly.
- Order volume and revenue charts.
- Top-performing shops.

### Complaints Tab
- Filterable list of customer/merchant complaints with priority tags (Critical, Urgent, Normal).
- Resolve or escalate individual complaints.

### Verifications Tab
- Sub-tabs: Registrations, Stores.
- Review and approve/reject pending merchant store registrations and delivery partner applications.

### Users Tab
- View all registered customers, merchants, and partners.
- Ban users by email/phone — banned credentials are added to `quickdash_blacklist` in localStorage.

### Stores Tab
- Browse all shops in the database.
- View shop details, inventory counts, and order history.
- Suspend or reinstate stores.

## Access Control

Admin panel is not protected by a dedicated login in this demo — it is accessed directly via URL. In a production app this would require admin credentials.

## localStorage Keys Read / Written

| Key | Description |
|---|---|
| `quickdash_accounts` | All user accounts |
| `quickdash_blacklist` | Banned emails and phones |
| `quickdash_orders` | Platform-wide order data |
| `quickdash_complaints` | Complaint records |

## Dependencies

Loads from `shared/`:
- `database.js` — shop and product data
- `auth.js` — account list access
