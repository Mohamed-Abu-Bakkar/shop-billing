# Improvement Plan — Shop Billing

The following improvements were identified from a full codebase exploration. They are grouped by priority.

## Bugs & half-finished features (highest value)

### 1. Payments page "Record Payment" is dead — ✅ DONE
- `src/components/PaymentsPage.tsx:14` declared `showForm` state and `PaymentForm` (line 71) but no button ever set it to `true`. The feature was unreachable.
- Fixed: added a `+ Record Payment` button, plus Total Received / Payments summary cards, invoice-number badges on payment rows, and an improved form (close button, customer search w/ phone + outstanding, auto-filled amount, method + date pickers, Back/change customer).
- Also fixed the backend (`convex/shop.ts` `applyCustomerPayment`): a general payment (no `invoiceId`) now settles the customer's outstanding invoices oldest-first (updates `paidAmount`/`status`) instead of only decrementing customer credit, and verifies an invoice-bound payment belongs to that customer.

### 2. Quotations are lost - least priority
- `convex/shop.ts:378` only persists invoices when `templateType === "bill"`. Quotations are returned to the caller, previewed in the modal, then vanish — they must be re-created every time.
- Fix: persist quotations (with their own number series, e.g. `QUOTATION-XXXX`) or explicitly treat them as ephemeral (and communicate that in the UI). Note: the current random 4-digit quotation number is collision-prone.

### 3. Negative stock possible
- `createInvoice` (convex/shop.ts:397) subtracts stock without clamping: `stock: itemDoc.stock - billItem.qty`. `updateInvoice` does clamp (line 258), but `createInvoice` does not.
- Fix: clamp stock at `>= 0` and add validation to block overselling.

### 4. Customer credit transfer bug — ✅ DONE
- `updateInvoice` (convex/shop.ts): when an invoice was reassigned to a different customer with an *unchanged* unpaid amount (`diff === 0`), the new customer's credit was never incremented (new credit was only applied in the `diff !== 0` branch). The old customer lost the credit, so the receivable was silently dropped from the books.
- Fixed: on customer change the new customer is now credited the full new unpaid amount (and the old customer debited the old unpaid), regardless of whether the amount changed.
- Also added a **customer picker** to `InvoiceEditModal.tsx` (search + select from the customer list, or keep a walk-in/custom name, or link/unlink a customer with a chip + ✕). This makes the reassignment actually reachable from the UI — previously the modal only edited the customer *name* text and kept the original `customerId`.

### 5. Hard-coded / mistyped business info — ✅ DONE
- `src/components/BillTemplate.tsx:179` had the store name misspelled as "Sri Mahaligam Electricals" and hard-coded GSTIN, phone, email, and 30-day credit terms.
- Fixed: created `src/lib/store.ts` as the single source of truth (name, tagline, GSTIN, phone, email, `creditTermsDays`). `BillTemplate.tsx` now renders from it (corrects the typo, dynamic GSTIN/phone/email, and credit terms), and `Index.tsx` header also uses it. The PWA manifest in `vite.config.ts` already matched the corrected name.

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

### 8. Hand-written `src/lib/convex.ts` is unnecessary — ✅ DONE
- The `ShopApi` type + `makeFunctionReference` wrappers duplicated what Convex's generated `convex/_generated/api` already provides.
- Fixed: deleted `src/lib/convex.ts` and replaced every `shopApi.*` usage with `api.shop.*` from `@convex/_generated/api`. Added `@convex/*` → `./convex/*` aliases in `vite.config.ts` and `tsconfig.app.json`. Query results now use Convex's generated document types (with `_id`/`_creationTime`).
- Note: because the app's hand-written types use literal unions (`category`, `type`) but the schema declares `v.string()`, `Index.tsx` casts the four queries back to the hand types, matching the pattern already used across the other components. See item 9 for the deeper fix.

### 9. Duplicated types
- `src/types/index.ts` mirrors `convex/schema.ts` by hand; risk of drift. Some code even references `_id`/`_createTime` that the hand-written types don't define (see `CustomersPage.tsx:34`, `InventoryPage.tsx:38`).
- Fix: derive frontend types from `convex/_generated/dataModel.d.ts`.

### 10. `BillingScreen.tsx` fragility
- Keyboard listener at line 58 re-registers every render (no dependency array).
- 578-line component does search, customer/client management, line items, and payments all in one file.
- Fix: memoize with a stable handler and consider splitting into smaller components.

### 11. `generateId()` collision risk — ✅ DONE
- `src/lib/id.ts` used `Math.random().toString(36).slice(2,10) + Date.now().toString(36)` — collisions would silently corrupt/quash records (multiple docs with the same app `id`, or `getXById(...).unique()` throwing).
- Fixed: `generateId()` now uses `crypto.randomUUID()` (v4, cryptographically strong, non-colliding in practice), with a `Date.now()` + two-independent-random-segment fallback for environments without `crypto.randomUUID`.

### 12. PWA broken assets
- `vite.config.ts` references `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`; `index.html` links `/apple-touch-icon.png` and `/manifest.webmanifest` — none exist in `public/`.
- Fix: add the icon assets (and manifest) or remove the references.

## Correctness (higher effort)

### 13. No authentication
- All Convex functions are `public`. A billing / store app should protect data with `requireIdentity` and proper ownership checks.

### 14. Non-atomic invoice numbering — ✅ DONE
- `nextInvoiceNumber` (convex/shop.ts) read-modify-wrote the `meta.invoiceCounter` doc and used `.unique()` on the lookup; a missing/concurrent counter could throw or collide.
- Fixed: the counter read-modify-write now runs inside one mutation against the shared counter doc (Convex's serialization point — concurrent saves retry on conflict so numbers don't repeat). Replaced `.unique()` with `.take(1)`, and when no counter doc exists the starting value is derived from the existing invoice count instead of a fresh `INV-0001`.

### 15. No real tests
- Only `src/test/example.test.ts` (`expect(true).toBe(true)`).
- Vitest and Playwright scaffolding exist but contain no meaningful tests.
- Fix: add unit tests for price/discount math and credit logic; add a few E2E flows for New Bill → Save → print.

### 16. TypeScript not strict
- `strict` is disabled in `tsconfig.app.json`; there are ~15 existing type errors that strict mode would surface.
- Fix: enable `strict: true` and fix the errors (many are the `_id`/`_createTime` issues from item 9).