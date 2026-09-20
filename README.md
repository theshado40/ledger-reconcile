# Ledger Reconcile

Deterministic, tenant-safe payment allocation for TypeScript applications.

This small domain library tackles a deceptively difficult workflow: previewing how a payment will be distributed across outstanding obligations, explaining every exclusion, and then applying the result without creating duplicate allocations.

## What it demonstrates

- Strict tenant isolation: a payment cannot cross its tenant boundary.
- Exact money handling using integer minor units—never floating-point currency.
- Deterministic oldest-first allocation with stable tie-breaking.
- A side-effect-free preview before persistence.
- Explicit diagnostics for ineligible, paid, and cross-tenant obligations.
- Idempotent application using a stable allocation key.
- A persistence boundary that can be adapted to a database transaction and unique constraint.

## Install

The project is currently a public reference implementation rather than a published npm package:

```bash
git clone https://github.com/theshado40/ledger-reconcile.git
cd ledger-reconcile
npm install
npm run verify
```

## Example

```ts
import {
  applyReconciliation,
  MemoryAllocationStore,
  reconcile,
} from "@theshado40/ledger-reconcile";

const preview = reconcile(
  { id: "payment-42", tenantId: "north", amount: 15_000 },
  [
    {
      id: "invoice-100",
      tenantId: "north",
      outstanding: 10_000,
      dueDate: "2026-01-01",
    },
    {
      id: "invoice-101",
      tenantId: "north",
      outstanding: 12_000,
      dueDate: "2026-02-01",
    },
  ],
);

// invoice-100 receives 100.00; invoice-101 receives 50.00.
const result = applyReconciliation(preview, new MemoryAllocationStore());
```

## Design notes

### Preview and apply are separate

The allocation calculation is pure: identical input always produces identical output, and no storage is changed. That makes the result safe to display for human review and easy to test.

Applying the preview is a distinct operation. In production, the `AllocationStore` adapter should run inside the application's database transaction and enforce the allocation key with a unique constraint.

### Tenant scope is part of identity

Tenant checks are performed before eligibility and balance checks. The tenant id is also included in each persisted allocation and in the idempotency key. This makes the isolation boundary explicit instead of relying on a caller to remember a filter.

### Money uses minor units

Amounts are safe integers such as cents. Fractional, negative, and unsafe numeric values are rejected at the boundary.

## Intentional limits

This repository focuses on allocation mechanics. It does not attempt to model a full accounting ledger, reverse payments, perform foreign-exchange conversion, or prescribe a database schema.

## Development

```bash
npm install
npm run verify
```

`verify` runs strict TypeScript checks, the test suite, and the production build. CI runs the same command against every supported Node version.

## License

[MIT](LICENSE)
