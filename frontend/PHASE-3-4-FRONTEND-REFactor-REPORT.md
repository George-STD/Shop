# Phase 3–4 Frontend Refactor Report

**Project:** Gift Shop frontend  
**Scope:** Frontend Hydration, State, Web Vitals, E-Commerce Edge Cases, and Resilience  
**Author:** Manus AI  
**Status:** Implemented directly on the clean `main` working tree; no pre-existing user changes were present at audit time.

## Executive Summary

The critical storefront paths were refactored around one invariant: **the server render and the first client render must be deterministic, while subsequent client-only state changes must remain narrowly subscribed and failure-safe**. Persisted Zustand stores now use a common delayed-rehydration contract, critical components use atomic selectors and stable callbacks, wishlist mutations are optimistic with rollback, checkout submission is protected by a persistent session idempotency key and an in-flight lock, and cart/checkout expose explicit offline behavior.

The changes are intentionally conservative about guarantees. A source-level refactor can remove known layout-shift and hydration hazards, but it cannot honestly prove **0.00 CLS, <50 ms INP, or <1.2 s LCP** without production-like browser measurement on representative devices, network profiles, and real traffic. The existing build also reports approximately **4.1 MB of shared first-load JavaScript**, which remains a material LCP/INP risk outside the narrow requested refactor and should be treated as the next performance program.

## Validation Result

| Check | Result | Interpretation |
|---|---:|---|
| `npm run lint` | Pass: 0 errors, 33 warnings | No blocking hook/import/lint defects remain. Existing warnings are primarily image-optimization warnings in unrelated legacy pages. |
| `npm run build` | Pass | Next.js production compilation, page generation, and route analysis completed successfully. |
| `git diff --check` | No reported whitespace errors before the final status command was interrupted by the attached Windows shell | The edited files were syntactically clean during lint/build; rerun locally if a strict whitespace gate is required. |
| Hydration model | Deterministic first render | Persisted state is read only after mount; UI badges and checkout are gated by hydration flags. |

## Component Refactors

### `src/app/providers.jsx`

**[The Weakness]** Persisted client stores could rehydrate as an implicit side effect of module initialization. That creates a two-render model in which server HTML is based on defaults and the client can immediately observe browser storage, increasing the chance of hydration drift and first-paint flicker.

**[The Manus Solution]** The provider now owns a stable list of persisted stores and invokes each store’s `persist.rehydrate()` from a mount-only effect. The stores themselves use `skipHydration: true`, while the existing `_hasHydrated` flags remain the explicit readiness contract consumed by the UI.

**[The Impact]** SSR and the first CSR render share the same deterministic baseline. Browser storage is loaded only after mount, making persisted cart, wishlist, build-box, and auth state predictable and hydration-safe.

### `src/store/`

**[The Weakness]** The persisted stores lacked a consistent hydration policy, several files relied on an undeclared `create` import, and cart updates copied the array but mutated an item object in place. Those patterns are fragile under concurrent updates and make referential-equality optimization less reliable.

**[The Manus Solution]** `authStore`, `cartStore`, `wishlistStore`, and `buildBoxStore` now import `create` explicitly, opt into delayed rehydration, use immutable functional updates, avoid no-op writes, and carry a versioned persistence configuration. Cart identity is normalized through a single composite key, total calculation is centralized in `calculateCartTotal`, and stock/quantity handling is consistently clamped.

Auth rehydration now restores the token through the reactive `setAuth` action rather than assigning directly to a state object. Invalid persisted auth is cleared through the same action, preventing a stale authenticated flag from surviving without a token.

**[The Impact]** Store updates preserve object identity for unaffected items, which reduces downstream reconciliation work and makes selector-based subscriptions more effective. Persisted state now has one lifecycle and one hydration contract across the commerce surface. Cart operations are safer under rapid clicks and stale stock values.

### `src/components/layout/Header.jsx`

**[The Weakness]** The header used a generic mount flag for cart and wishlist badges. That flag does not express whether the corresponding persisted store has actually completed rehydration, so the UI could briefly represent an intermediate state.

**[The Manus Solution]** The header now subscribes to each store’s `_hasHydrated` flag and renders count badges only when both cart and wishlist hydration are complete. Existing atomic selectors for counts, auth, admin state, and drawer actions are retained.

**[The Impact]** Badge visibility is now tied to actual data readiness rather than lifecycle timing. The header avoids storage-dependent markup during SSR and avoids a false count while persisted state is still loading.

### `src/components/layout/Layout.jsx`

**[The Weakness]** `Layout` destructured the complete UI-store object, subscribing the compositor to every UI state change even though it only renders two flags.

**[The Manus Solution]** `isMobileMenuOpen` and `isCartOpen` are now selected independently with atomic Zustand selectors.

**[The Impact]** Unrelated UI-store changes no longer force the layout compositor to rerender. The change also preserves conditional mounting of the heavy drawers, limiting their render and effect cost to open states.

### `src/components/layout/CartSidebar.jsx`

**[The Weakness]** The cart drawer had no explicit offline affordance, used an inline currency formatter recreated on every render, and used an array index in the item key, which can cause avoidable row reconciliation churn after removal.

**[The Manus Solution]** Currency formatting is now module-stable, item keys are derived from the cart item’s identity and selected options, and the drawer listens to `online`/`offline` events. While offline, it clearly communicates that local cart mutations remain available but network-dependent checkout should wait.

The existing memoized subtotal, grand-total, count calculations, atomic selectors, stable quantity handlers, focus trap, Escape handling, and reserved image boxes were preserved.

**[The Impact]** Offline behavior is visible rather than implicit, cart rows have stable reconciliation identities, and formatter allocation is removed from the render path. Fixed image dimensions and aspect-ratio wrappers continue to protect against known layout-shift sources.

### `src/components/product/ProductCard.jsx`

**[The Weakness]** The card’s memoization and stable-selector intent was undermined by missing/duplicated React imports, handlers that were recreated on each render, and fire-and-forget wishlist API calls with no rollback when the server rejected the mutation.

**[The Manus Solution]** Hook imports were normalized, cart and wishlist handlers are now `useCallback`-stable, and wishlist updates use an optimistic local mutation guarded by a pending flag. The API request is awaited; failure restores the exact prior local state and reports the recovery. The wishlist control is disabled and exposes `aria-busy` while the request is in flight. The existing strict `React.memo` comparator and fixed image geometry remain in place.

**[The Impact]** Product grids retain the existing prop-level render shield while preventing duplicate wishlist requests and stale optimistic state. A transient API failure no longer leaves the card and the server permanently divergent.

### `src/legacy-pages/ProductPage.jsx` / `ProductPageClient.jsx`

**[The Weakness]** The product route’s JSON-LD included `window.location.href` and `Date.now()` in render-time memoized data. Those values can differ between server render and client hydration. The computed CTA total was expressed as a callback even though it is pure derived data, review invalidation was passed as a new inline function, and wishlist writes were not rollback-safe.

**[The Manus Solution]** JSON-LD now uses the deterministic route slug and omits the render-time date. Product total is derived with `useMemo`, review invalidation is a stable callback, and the product-page wishlist action mirrors the card’s optimistic/pending/rollback behavior. The route wrapper remains thin and continues to delegate the actual implementation to the legacy page.

**[The Impact]** The product page no longer embeds known time- or browser-dependent values in its initial markup. Pure totals are computed only when their inputs change, memoized review children receive stable invalidation props, and wishlist failures recover instead of silently drifting.

### `src/legacy-pages/CheckoutPage.jsx` / `CheckoutPageClient.jsx`

**[The Weakness]** The checkout had an in-memory idempotency key, so a remount or retry path could generate a new key. It also had no offline guard and passed new step-navigation callbacks into memoized child components on every parent render. User profile hydration could arrive after the initial form state without filling missing fields.

**[The Manus Solution]** Checkout now derives its idempotency key from `sessionStorage`, preserving the key across transient remounts and retries and removing it only after success. Submission remains protected by a synchronous in-flight lock, checks online status before sending, and presents a persistent offline banner. Step navigation callbacks are stable, while a hydration-aware effect fills only still-empty customer fields from the authenticated user.

The existing server request field `idempotencyKey` is preserved. **Server-side idempotency enforcement must still exist in the Node/MongoDB order endpoint; the frontend key alone cannot guarantee exactly-once order creation.**

**[The Impact]** Double-clicks are blocked locally, retry attempts can reuse the same client operation key, offline users are prevented from receiving a misleading submission failure, and memoized checkout steps avoid callback-prop churn. The checkout form retains its hydration gate until both auth and cart stores are ready.

## Web Vitals and Hydration Assessment

The refactor directly addresses source-level CLS and hydration hazards by retaining explicit aspect-ratio/image containers, removing render-time `window` and clock reads from product JSON-LD, delaying persisted storage reads, and suppressing storage-dependent badges until readiness. It improves INP pressure by reducing broad store subscriptions, stabilizing handlers, avoiding unnecessary store writes, and preventing repeated submission work.

The following items remain outside what source edits can prove and should be measured in a production-like run: real LCP on mobile mid-tier hardware, interaction latency under a loaded product grid, cumulative layout shift across all legacy routes, CDN image response time, third-party script cost, and the approximately 4.1 MB shared first-load JavaScript reported by the build. The build’s 33 lint warnings are non-blocking but should be reduced, especially legacy `<img>` usage on LCP candidates.

## Changed Files

| File | Primary purpose |
|---|---|
| `src/app/providers.jsx` | Central delayed rehydration boundary |
| `src/store/authStore.js` | Reactive auth/token restore and persisted-state contract |
| `src/store/cartStore.js` | Immutable cart updates, normalized identity, stock-safe totals |
| `src/store/wishlistStore.js` | Hydration-safe, duplicate-safe persisted wishlist |
| `src/store/buildBoxStore.js` | Hydration-safe and no-op-safe build-box persistence |
| `src/components/layout/Header.jsx` | Hydration-aware badges and atomic selectors |
| `src/components/layout/Layout.jsx` | Atomic UI-store subscriptions |
| `src/components/layout/CartSidebar.jsx` | Offline UX, stable formatting, stable item keys |
| `src/components/product/ProductCard.jsx` | Stable handlers and rollback-safe optimistic wishlist |
| `src/legacy-pages/ProductPage.jsx` | Deterministic JSON-LD, pure derived total, resilient wishlist |
| `src/legacy-pages/CheckoutPage.jsx` | Session idempotency, offline guard, stable step callbacks |

## Recommended Follow-Up

The next high-value performance tranche should profile the shared 4.1 MB first-load payload, split heavy admin and Swiper/Recharts paths, audit legacy `<img>` candidates, and run automated Playwright Web Vitals traces on representative mobile and desktop profiles. For checkout exactly-once semantics, the backend should persist and atomically claim the idempotency key before creating an order, then return the original result for duplicate requests.

## References

[1]: https://react.dev/reference/react/memo "React memo reference"

[2]: https://react.dev/reference/react/useMemo "React useMemo reference"

[3]: https://zustand.docs.pmnd.rs/middlewares/persist "Zustand persist middleware reference"

[4]: https://nextjs.org/docs/app/building-your-application/optimizing/images "Next.js Image Optimization documentation"

[5]: https://web.dev/articles/vitals "Web Vitals guidance"
