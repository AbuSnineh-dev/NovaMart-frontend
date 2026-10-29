# NovaMart: design and API mapping

The prototype was downloaded from https://novamatr2005.netlify.app/ on 2026-10-28. Its embedded images are preserved in `public/images`. Figma access is currently denied for both connected accounts; exact design analysis and fidelity QA remain pending the accessible design link. The current visual implementation follows the prototype, provisionally.

| Screen / action | Actual backend route | Contract / implementation |
| --- | --- | --- |
| Home, collection, search, category, product | GET products, products/:id; GET categories | `{data,total,page,limit,totalPages}`; fetch all pages for consistent combined price/sort/stock filters |
| Registration | POST auth/Register | `name,email,Password,phoneNumber?`; password 8–20 characters |
| Login | POST auth/Login | `email,Password` → `accToken`; Next server stores it in HttpOnly session cookie |
| Current account | GET auth/me | `_id,name,email,role,phoneNumber?`; roles are lowercase `user` and `admin` |
| Edit profile | PATCH user/update | Customer only, `name,email,phoneNumber` |
| Cart | GET cart | `items[].productId` is populated; mutation responses are unpopulated, so always refetch |
| Add / update / remove | POST cart/items; PATCH / DELETE cart/items/:productId | `{productId,quantity}` / `{quantity}`; backend checks stock |
| Clear cart | DELETE cart | Refetch cart after success |
| Checkout | POST orders | Empty body; transactional stock deduction and immutable item snapshots |
| My orders / detail | GET orders; GET orders/:id | Historical `items[].price`, `totalAmount`, `status`, `createdAt` |
| Admin products | POST products; PATCH / DELETE products/:id | `name,description,price,stockQuantity,categoryId,imageUrl?`; delete deactivates |
| Admin categories | POST categories; PATCH / DELETE categories/:id | `{name,description?}`; deletion guarded if referenced by active products |
| Admin orders | GET admin/orders; PATCH admin/orders/:id/status | `{status}`; UI exposes only permitted transitions |
| Admin users | GET user; PATCH user/:id/role | `{role:'user'|'admin'}`; current admin self-demotion disabled in UI |
| Wishlist | No API | Browser local storage, per account; device-local behaviour disclosed |
| Shipping address / payment | No API | Not collected; checkout explicitly states no online charge or address capture |
| Password reset / contact messages / image uploads | No API | No pretend success flows; image URL field uses the existing product API |

All frontend API requests go through `/api/*` on Next.js. `BACKEND_URL` is server-side only. Session expires after two hours, as on the backend. No production API deployment is required.

Customer sign-in is at `/login` and administrator sign-in is at `/admin/login` (no registration). The frontend calls `/api/auth/customer-login` or `/api/auth/admin-login`; both proxy the existing NestJS login endpoint and verify the authenticated profile's current role before issuing the session cookie. Wrong credentials and a role mismatch return the same generic HTTP 401 message, without revealing whether an account is an administrator. The original API login route remains compatible with existing backend clients.

Authorization uses the current database role on each request. Revoking an admin role takes effect immediately for an already issued JWT; missing accounts are rejected. This behaviour is covered by a real API regression test and strategy unit tests.

## Backend adjustment

Corrected the `CardModule` import to `CartModule` and removed the duplicate root `CartController` registration in `backend/src/app.module.ts`. `CartModule` already owns it and its dependencies. These corrections are necessary for compilation and dependency injection at startup. Original backend remains a separate Git checkout; inspect its local diff separately.

## Pending design review

Additional verified integration repairs: `Connection` in the order service is imported as a type to avoid an ESM runtime export error; category deletion checks only active products, matching its error text and documented behaviour. Cart placeholder tests were replaced with owner-scoping and stock-boundary tests. Compatible dependency updates remove the reported production dependency vulnerabilities. All backend changes, including lockfile changes, are preserved in `docs/backend-integration.patch`, relative to backend commit `8f5ca4d84496df49570f886844b57d1a0e953fd7`.

Once Figma access is supplied: inventory every frame and state; compare each to this matrix; identify missing workflows; retrieve design context and screenshot for each visible screen; compare rendered desktop/mobile/RTL geometry and assets. The project must not be called Figma-matched before that review passes.
