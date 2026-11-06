# VaultChecker — Frontend

Web application for **VaultChecker**, a multi-store platform that digitalises the neighbourhood
_"cuaderno de fiado"_ (store credit ledger). Store owners manage customers, products and credit from
the browser, and neighbours consult their own debt and payment plan.

Built with **Vue 3**, **Pinia** and **PrimeVue**, and organised with the same **bounded contexts** as
the backend. All business data comes from the
[VaultChecker Platform API](https://github.com/Kapitalwacht/VaultCheckerBackend).

---

## Tech stack

| Concern          | Choice                                            |
|------------------|---------------------------------------------------|
| Framework        | Vue 3 (Composition API, `<script setup>`)         |
| Build            | Vite                                              |
| State            | Pinia                                             |
| Routing          | Vue Router (guards by session and role)           |
| UI               | PrimeVue, PrimeFlex, PrimeIcons                   |
| HTTP             | Axios                                             |
| i18n             | vue-i18n (Spanish and English)                    |
| Mock API         | json-server                                       |
| Hosting          | Firebase Hosting                                  |

---

## Architecture

The code is split into **bounded contexts** (one folder per business capability). Every context is
organised into the same four layers:

```
src/<context>/
├── domain/           # Business model — no framework code
│   ├── model/              # Entities (CreditAccount, Purchase, Roles, …)
│   └── services/           # Pure domain services (the financial calculations)
├── application/      # Pinia stores that orchestrate the use cases
├── infrastructure/   # API clients and assemblers
└── presentation/     # Views, components and the context's routes
```

### How a request flows

```
Vue view
  → Pinia store                    (application) orchestrates the use case
  → <Context>Api                   (infrastructure) extends BaseApi
  → Platform API                   JSON over HTTP
  ← Assembler                      turns the resource into a domain entity
  ← Pinia store                    updates the state that the view renders
```

`BaseApi` (`src/shared/infrastructure`) configures Axios once for every context. It sends the app's
language in `Accept-Language` and the access token in `Authorization`. When the API answers `401`, it
renews the session with the refresh token and retries the request once.

### Bounded contexts

| Context         | Responsibility                                                    | Route(s) |
|-----------------|-------------------------------------------------------------------|----------|
| `iam`           | Sign-up, sign-in, email verification, password recovery, profile  | `/login`, `/register`, `/verify`, `/recover`, `/profile` |
| `stores`        | Store registration and deactivation, store credentials            | `/stores` |
| `catalog`       | Products and services                                             | `/catalog` |
| `customers`     | Customers and their agreed credit terms                           | `/customers` |
| `credit`        | Credit accounts, payment plans and the cutoff report              | `/credit`, `/credit/plan`, `/credit/report` |
| `subscriptions` | Store plans, Stripe checkout and invoices                         | `/billing` |
| `audit`         | Operation history                                                 | `/audit` |
| `shared`        | Layout, shared components, API base, currency and date helpers    | `/home` |

### Roles

The router guard checks `meta.roles` on each route. The API enforces the same rules.

| Role           | Access                                                         |
|----------------|----------------------------------------------------------------|
| `system-admin` | Home, stores and audit                                         |
| `store-admin`  | Home, customers, products, credit, report, billing and audit   |
| `customer`     | Their own cutoff report                                        |

Everyone can open their profile. A customer signs up with the **DNI** registered by the store, which
links the account to their debts.

### Financial calculations

`src/credit/domain/services` previews payment plans with the same conventions as the backend:
**French method, 360-day year, 30-day commercial month, total grace capitalised, amounts rounded to
2 decimals and rates shown with 7 decimals**. The backend remains the source of truth for amounts owed.

Each credit shows the customer's currency. Totals convert dollars to soles with `VITE_USD_PEN_RATE`.

### Internationalisation

Interface texts live in `src/locales/es.json` and `src/locales/en.json`. To add or change a text,
update **both** files; views read them through `t('...')`, never as literal text.

---

## Configuration

Vite reads the env files from **`src/`** (`envDir` in `vite.config.js`), not from the project root:

| File                   | Used by                           |
|------------------------|-----------------------------------|
| `src/.env.development` | `npm run dev` (points to the mock API) |
| `src/.env.production`  | `npm run build`                   |
| `src/.env.local`       | Your local overrides, not committed |

| Variable                             | Purpose                                       |
|--------------------------------------|-----------------------------------------------|
| `VITE_VAULTCHECKER_PLATFORM_API_URL` | Base URL of the API                           |
| `VITE_PROFILES_ENDPOINT_PATH`        | Path of the profiles endpoint                 |
| `VITE_AUTH_ENDPOINT_PATH`            | Path of authentication, default `/authentication` |
| `VITE_GOOGLE_CLIENT_ID`              | Google sign-in client                         |
| `VITE_USD_PEN_RATE`                  | Soles per dollar                              |

Emails and payment links are configured in the backend, so the frontend needs no EmailJS or Stripe keys.

---

## Running locally

Prerequisites: **Node.js** `^20.19.0` or `>=22.12.0`.

```bash
npm install
```

To use the real backend, create `src/.env.local` with the URL of your local API:

```properties
VITE_VAULTCHECKER_PLATFORM_API_URL=http://localhost:8092/api/v1
```

Then start the app:

```bash
npm run dev
```

- App: `http://localhost:5173`

To use the mock API instead, keep the default URL and run `npm run server` in another terminal. It
serves `server/db.json` on port 3000.

### Build

```bash
npm run build
npm run preview
```

## Deployment

Every push to `main` builds the app and deploys `dist` to **Firebase Hosting** through GitHub Actions:
`https://vaultchecker-frontend.web.app`.

## Related repositories

- [VaultCheckerBackend](https://github.com/Kapitalwacht/VaultCheckerBackend) — REST API
- [vaultCheckerLandingPage](https://github.com/Kapitalwacht/vaultCheckerLandingPage) — landing page
