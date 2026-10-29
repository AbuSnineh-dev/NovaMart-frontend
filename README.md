# NovaMart frontend

[Frontend repository](https://github.com/AbuSnineh-dev/NovaMart-frontend) · [Backend repository](https://github.com/AbuSnineh-dev/NovaMart-backend)

Responsive React / Next.js storefront, English and Arabic (RTL), connected to the actual NovaMart NestJS/MongoDB backend. Includes catalog filtering, product detail, customer registration/login, persistent server cart, checkout, order history/details, profile editing, browser-local wishlist, and admin inventory/categories/orders/users.

**Design status:** implementation is provisional against the supplied Netlify prototype. Figma was inaccessible to both connected accounts. Exact Figma analysis, screen inventory, and visual matching await the accessible design link. See [API mapping](docs/API-MAPPING.md).

## Requirements

- Node.js 24+, npm
- Backend checkout in `backend/` (already cloned from the supplied repository)
- For your own database: MongoDB replica set, required by the backend's checkout transactions

## Quick isolated demo

```powershell
npm ci
npm run setup:backend
npm --prefix backend ci
npm --prefix backend run build
npm run demo
```

The frontend and backend are separate repositories. `backend/` is ignored by this frontend repository. `setup:backend` downloads the tested backend revision and applies the integration patches; if a local backend folder already exists, it preserves it without resetting or modifying its files. The backend remote remains `https://github.com/AbuSnineh-dev/NovaMart-backend.git`.

Open http://127.0.0.1:3001. First run downloads a real MongoDB binary; allow time for this. Demo runs a single-node MongoDB replica set, seeds the original prototype catalog and demo users, and starts both NestJS (3000) and Next.js (3001). Data resets when the process stops. It does not connect to an existing database.

Customers sign in at `/login`; administrators use `/admin/login`. Each portal checks the account role on the server. Failed sign-in messages are generic and do not disclose account roles.

| Account | Email | Password |
| --- | --- | --- |
| Customer | customer@nova.test | Nova12345 |
| Admin | admin@nova.test | Nova12345 |

For an optimized preview: run `npm run build`, then `node scripts/demo.mjs --production`.

## Connect your local backend / database

Create `backend/.env`:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/novamart?replicaSet=rs0
JWT_SECRET=replace-with-a-long-random-local-secret
PORT=3000
```

Copy `.env.example` to `.env.local` in the frontend root. Set `BACKEND_URL` to your local NestJS URL including `/api/v1`. Start in separate terminals:

```powershell
npm --prefix backend run start:dev
npm run dev
```

If using MongoDB Atlas, use its replica-set connection string instead. The frontend proxies API requests on the server, so no browser CORS change is necessary. The JWT remains in a two-hour HttpOnly SameSite cookie. Do not use demo credentials outside the isolated demo.

## Verification

```powershell
npm run typecheck
npm run build
npm --prefix backend run build
# Chrome is used by default; for bundled Chromium:
# npx playwright install chromium
# $env:PLAYWRIGHT_CHANNEL='chromium'
# With npm run demo running:
npm run test:e2e
```

Tests exercise the real NestJS routes and MongoDB, without API mocks. They mutate only the isolated demo database. Run them against a fresh demo for repeatable results. Results and screenshots are written to `test-results/` and the HTML report to `playwright-report/`.

To keep a personal demo session untouched during QA, launch a separate instance in another PowerShell terminal:

```powershell
$env:NOVA_BACKEND_PORT='3100'
$env:NOVA_FRONTEND_PORT='3101'
$env:NOVA_DIST_DIR='.next-qa'
npm run demo
```

Run tests in a separate terminal with `$env:NOVA_TEST_BASE_URL='http://127.0.0.1:3101'` followed by `npm run test:e2e`. This instance has its own MongoDB database and build directory; it does not reset the demo on port 3001.

## Important backend differences

The actual API uses `auth/Register`, `auth/Login`, `Password`, `accToken`, `/user`, `/user/update` and lowercase roles `user` / `admin`; these differ from parts of its README. The adapter follows the actual controllers and DTOs. The backend startup module has two local corrections: the CartModule import name and a duplicate CartController registration. Its nested checkout retains its own Git history.

Shipping addresses, online payments, contact messages, password reset, reviews and uploaded image storage have no backend endpoints. Checkout does not pretend to collect payment or shipping information. Product images use the supported URL field. Wishlists are disclosed as browser-local. Admin catalog lists active products, matching the current public product API; inactive-product recovery needs a backend extension.

Backend integration changes are also saved in `docs/backend-integration.patch` against commit `8f5ca4d84496df49570f886844b57d1a0e953fd7`. Besides startup fixes, this includes a type-only Mongoose import needed for ESM execution, the active-product category deletion check, meaningful cart tests, and compatible dependency lockfile updates. To apply them to another clean checkout of that revision, run `git apply <absolute-path-to-backend-integration.patch>` from that checkout.

The integration patch also makes role revocation effective for existing sessions by checking the current role in MongoDB. The new authorization unit test is preserved separately in `docs/backend-new-tests.patch`; apply that patch as well when copying the changes to another backend checkout.

## Project layout

- `app/`: Next.js routes, API proxy, session logout, styles
- `components/store.tsx`: storefront and admin screens
- `lib/api.ts`: typed API contracts and shared formatting
- `public/images/`: original prototype image assets
- `backend/`: supplied backend checkout with minimal startup fixes
- `scripts/demo.mjs`: isolated full-stack demonstration
- `tests/`: browser and API integration QA
- `docs/API-MAPPING.md`: design-to-API mapping and unsupported capabilities
