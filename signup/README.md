# signup/

Authentication pages for creating a new account and signing in.

## Files

| File | Description |
|---|---|
| `signup.html` | Multi-step registration form |
| `signup.js` | Registration logic — role selection, validation, account creation |
| `signin.html` | Sign-in form |
| `signin.js` | Sign-in logic — credential lookup, session creation |
| `signup.css` | Shared styles for both auth pages |

## Registration Flow (`signup.html`)

Multi-step form with role selection:

1. **Role selection** — Choose between Customer or Merchant.
2. **Personal details** — Name, email, phone, password.
3. **Merchant extra step** — Shop name, category, address (only shown for merchant role).

Step counter and progress bar adjust based on the selected role (1 of 1 for customers, 1 of 2 for merchants).

**Roles:**
- `customer` — Standard shopping account.
- `merchant` — Store owner; gets access to the YourStore dashboard after sign-up.

Partner registration (delivery agents) is triggered separately via `shared/partner-register.js`.

## Sign-In Flow (`signin.html`)

- Email + password lookup against `localStorage` accounts.
- Validates against blacklist before granting access.
- On success, writes session to `quickdash_user` and redirects to the last page or discover.

## localStorage Keys Written

| Key | Description |
|---|---|
| `quickdash_accounts` | Array of all registered user objects |
| `quickdash_user` | Currently active session (no password field) |

## Dependencies

Loads from `shared/`:
- `auth.js` — `registerUser()`, `signIn()`, `getSessionUser()`
- `database.js` — blacklist check
