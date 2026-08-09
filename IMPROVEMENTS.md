# Improvement Plan — Shop Billing

The following improvements were identified from a full codebase exploration. They are grouped by priority.

## Bugs & half-finished features (highest value)

### 1. Payments page "Record Payment" is dead — ✅ DONE
- `src/components/PaymentsPage.tsx:14` declared `showForm` state and `PaymentForm` (line 71) but no button ever set it to `true`. The feature was unreachable.
- Fixed: added a `+ Record Payment` button, plus Total Received / Payments summary cards, invoice-number badges on payment rows, and an improved form (close button, customer search w/ phone + outstanding, auto-filled amount, method + date pickers, Back/change customer).
- Also fixed the backend (`convex/shop.ts` `applyCustomerPayment`): a general payment (no `invoiceId`) now settles the customer's outstanding invoices oldest-first (updates `paidAmount`/`status`) instead of only decrementing customer credit, and verifies an invoice-bound payment belongs to that customer.

### 2. Quotations are lost
- `convex/shop.ts:378` only persists invoices when `templateType === "bill"`. Quotations are returned to the caller, previewed in the modal, then vanish — they must be re-created every time.
- Fix: persist quotations (with their own number series, e.g. `QUOTATION-XXXX`) or explicitly treat them as ephemeral (and communicate that in the UI). Note: the current random 4-digit quotation number is collision-prone.

### 3. Negative stock possible
- `createInvoice` (convex/shop.ts:397) subtracts stock without clamping: `stock: itemDoc.stock - billItem.qty`. `updateInvoice` does clamp (line 258), but `createInvoice` does not.
- Fix: clamp stock at `>= 0` and add validation to block overselling.

### 4. Customer credit transfer bug
- `updateInvoice` (convex/shop.ts:278-286): when the old and new customer's unpaid amounts are equal, the new customer never gets credit recorded (new credit is only applied in the `diff !== 0` branch).
- Fix: always reconcile the new customer's credit explicitly.

### 5. Hard-coded / mistyped business info
- `src/components/BillTemplate.tsx:179` has the store name misspelled as "Mahaligam" and hard-codes GSTIN, phone, email, and 30-day credit terms.
- Fix: move business info into a config/settings source and reference it everywhere.

## Cleanup & tech debt

### 6. Unused shadcn `ui/` files and dependencies
- ~43 of the 50 `src/components/ui/` files are unused boilerplate. Only `loading-button`, `tooltip`, `sonner`, `toaster`, `toast`, and `use-toast` are referenced.
- Correlated unused deps: `recharts`, `framer-motion`, `zod`, `react-hook-form`, `@hookform/resolvers`, `pouchdb-browser`, `sql.js`, `date-fns`, and several Radix packages.
- Fix: delete unused files and prune `package.json` dependencies (shrinks bundle + maintenance cost).

### 7. Dead code
- `src/components/NavLink.tsx` — never imported.
- `src/components/InvoicesPage.tsx` — entire file commented out.
- `src/hooks/use-toast.ts` + `src/components/ui/toast.tsx` — unused (all toasts go through sonner).
- Commented-out blocks: `Dashboard.tsx` (36:21-26, 65:73-77, 48:50-53), `ReportsPage.tsx` (22-27, 82-86), `BillTemplate.tsx` "Print to PDF" block (427-466), `BillingScreen.tsx` (64-66).
- Fix: remove or restore deliberately.

### 8. Hand-written `src/lib/convex.ts` is unnecessary
- The `ShopApi` type + `makeFunctionReference` wrappers duplicate what Convex's generated `convex/_generated/api.d.ts` already provides.
- Fix: use the generated `api` from the Convex client directly.

### 9. Duplicated types
- `src/types/index.ts` mirrors `convex/schema.ts` by hand; risk of drift. Some code even references `_id`/`_createTime` that the hand-written types don't define (see `CustomersPage.tsx:34`, `InventoryPage.tsx:38`).
- Fix: derive frontend types from `convex/_generated/dataModel.d.ts`.

### 10. `BillingScreen.tsx` fragility
- Keyboard listener at line 58 re-registers every render (no dependency array).
- 578-line component does search, customer/client management, line items, and payments all in one file.
- Fix: memoize with a stable handler and consider splitting into smaller components.

### 11. `generateId()` collision risk
- `src/lib/id.ts` uses `Math.random().toString(36).slice(2,10) + Date.now().toString(36)`.
- Collisions silently overwrite DB rows (docs keyed/selected by the `by_app_id` index).
- Fix: use a cryptographically strong ID or let Convex own the primary key.

### 12. PWA broken assets
- `vite.config.ts` references `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`; `index.html` links `/apple-touch-icon.png` and `/manifest.webmanifest` — none exist in `public/`.
- Fix: add the icon assets (and manifest) or remove the references.

## Correctness (higher effort)

### 13. No authentication
- All Convex functions are `public`. A billing / store app should protect data with `requireIdentity` and proper ownership checks.

### 14. Non-atomic invoice numbering
- `nextInvoiceNumber` (convex/shop.ts:96) is a read-modify-write on a `meta` counter doc; concurrent saves can produce duplicate numbers.
- Fix: use an atomic updater or a stronger uniqueness strategy.

### 15. No real tests
- Only `src/test/example.test.ts` (`expect(true).toBe(true)`).
- Vitest and Playwright scaffolding exist but contain no meaningful tests.
- Fix: add unit tests for price/discount math and credit logic; add a few E2E flows for New Bill → Save → print.

### 16. TypeScript not strict
- `strict` is disabled in `tsconfig.app.json`; there are ~15 existing type errors that strict mode would surface.
- Fix: enable `strict: true` and fix the errors (many are the `_id`/`_createTime` issues from item 9).