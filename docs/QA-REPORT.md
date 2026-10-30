# NovaMart QA — 2026-10-28

## Update — 2026-10-30: private staff entry and customer recovery interface

- Removed staff login/dashboard links from public pages, customer sign-in and storefront navigation, including the storefront viewed by a signed-in administrator. Staff can still open their authorized dashboard directly.
- Guests and customers visiting `/admin` receive the generic missing-page interface; staff URLs include the `X-Robots-Tag: noindex, nofollow` header. This discoverability change supplements existing role authorization; it does not replace it.
- Added customer-only `/forgot-password` UI, including email format validation, return to login, English/Arabic layouts and mobile RTL.
- Explicitly frontend-only as requested: no backend edits, outbound recovery requests, email delivery or password changes. Submission reports unavailability and never claims successful delivery.
- **14 browser/API integration tests passed (39.9 seconds)** on an isolated local demo; TypeScript and production build passed under Node.js 26.13.0. Added coverage for absent staff links, protected direct access, crawler headers, customer-only recovery, validation, no outbound recovery POSTs and Arabic mobile layout.
- Screenshots: [customer sign-in](screenshots/customer-login.png), [recovery](screenshots/password-recovery.png), [Arabic mobile recovery](screenshots/password-recovery-mobile-ar.png).

## Update — 2026-10-29: separate sign-in portals

- Customer sign-in: `/login`; administrator sign-in: `/admin/login`, with no registration on the administrator page.
- Each portal verifies the current role on the server before setting the HttpOnly cookie.
- Incorrect credentials and a role mismatch return the same HTTP 401 message: `Invalid email or password.` Arabic UI translates it without disclosing account roles.
- Administrator login failures stay on the administrator page. The customer page retains customer registration.
- **11 integration/browser tests passed (39.5 seconds)** against a separate MongoDB replica set and frontend on port 3101. Includes role mismatch rejection, successful sign-in through each portal, cookie behaviour and existing storefront workflows. TypeScript passed. Production build passed for the separated portals before the final message-only privacy correction; the correction was checked by TypeScript and the full integration suite.
- Personal demo data on port 3001 was preserved; QA ran in an independent database.
- Screenshot: [administrator sign-in](screenshots/admin-login.png).

## Verified locally

- Next.js production build: passed (Next.js 16.4.3 / React 19).
- TypeScript checks: passed.
- NestJS build: passed.
- Backend cart and authorization tests: **6 passed across 3 files**.
- Browser/API integration against the production frontend and real NestJS + MongoDB replica set: **8 passed, 13.1 seconds** on installed desktop Chrome.
- Backend production dependency audit after compatible lockfile updates: **0 vulnerabilities** reported by npm.

The demo uses an isolated, temporary MongoDB replica set. Test requests are real; there are no mocked API responses in the integration suite.

## Covered workflows

1. Home and catalog rendering; pagination; search; no results; sold-out prevention; product detail; Arabic mobile RTL and horizontal overflow.
2. Customer login; cart addition and quantity; reload persistence; transactional checkout; order history/detail; profile persistence; logout.
3. Invalid credentials; customer registration; customer exclusion from admin screens.
4. Admin product create/edit/deactivate; category creation and deletion integrity; role changes; order status transition.
5. Guest rejection; customer role restrictions; HttpOnly cookie; token not exposed in login JSON; quantity bounds; invalid product IDs; empty-cart checkout; logout invalidation.
6. Browser-local wishlist persistence and removal; cart removal; Escape dismissal; mobile overflow on home/login/orders/account/about/FAQ/checkout.
7. Stock deduction; immutable order-price snapshots after product price edits; order ownership; invalid status rejection; cancellation restores stock exactly once; pagination limits.
8. An already authenticated admin loses access immediately after another admin revokes the role. The regression test failed with HTTP 200 before the fix and now receives HTTP 403. Unit coverage also verifies rejection of a token whose account no longer exists.

Screenshots: [desktop home](screenshots/home-desktop.png), [Arabic mobile catalog](screenshots/catalog-mobile-rtl.png), [admin orders](screenshots/admin-orders.png).

## Integration issues corrected

- Wrong `CardModule` import and duplicate root CartController registration.
- Runtime ESM failure from importing Mongoose `Connection` as a value.
- Category deletion incorrectly blocked by inactive products.
- Original cart unit tests lacked their dependencies; replaced with owner-scope and stock-boundary assertions.
- Next.js development resource requests from `127.0.0.1` needed an explicit allowed development origin.
- Origin validation now checks the incoming host, supporting local proxy routing.
- Shared UI state persists across route changes; form labels use explicit IDs.
- Demo startup now waits for backend readiness before starting the frontend.
- JWT authorization resolves the current account role from MongoDB on each authenticated request, rather than trusting an old role in the token. Session signature and expiry verification remain enforced by Passport.

## Remaining requirements / limits

- **Figma design review and exact visual matching are pending.** Both linked Figma accounts were denied access; the user is supplying an accessible link. Current styling is provisional against the supplied Netlify prototype.
- Access was rechecked with both connected accounts after the initial delivery and remains denied.
- Shipping addresses, online payment, contact messages, password reset and uploaded image storage have no backend endpoints. These are not presented as functioning services. See API mapping.
- Wishlist is browser-local, disclosed in the interface. Categories and product content are supplied by the API and are not translated by the backend.
- Inactive products cannot be listed/restored through the supplied product listing endpoint.
- The backend still has development-tool dependency advisories (Vitest and the unused deployment CLI dependency chain). Production dependencies audit clean. No forced breaking dependency upgrade was applied.
- Browser coverage is Chrome on desktop and mobile viewport dimensions. Safari/Firefox and a full accessibility audit have not been completed.

The full original objective remains incomplete until Figma is accessible, every required design screen is reconciled with the actual API, and the final visual/functional review is completed.
