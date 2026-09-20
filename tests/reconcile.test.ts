import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DuplicateObligationError,
  InvalidDateError,
  InvalidMoneyError,
  reconcile,
  type Obligation,
  type Payment,
} from "../src/index.js";

const payment: Payment = { id: "pay-1", tenantId: "north", amount: 15_000 };

function obligation(overrides: Partial<Obligation> = {}): Obligation {
  return {
    id: "fee-1",
    tenantId: "north",
    outstanding: 10_000,
    dueDate: "2026-01-01",
    ...overrides,
  };
}

describe("reconcile", () => {
  it("allocates oldest obligations first with a deterministic id tie-break", () => {
    const result = reconcile(payment, [
      obligation({ id: "fee-c", dueDate: "2026-03-01", outstanding: 8_000 }),
      obligation({ id: "fee-b", dueDate: "2026-01-01", outstanding: 8_000 }),
      obligation({ id: "fee-a", dueDate: "2026-01-01", outstanding: 8_000 }),
    ]);

    assert.deepEqual(
      result.allocations.map(({ obligationId, amount }) => ({ obligationId, amount })),
      [
        { obligationId: "fee-a", amount: 8_000 },
        { obligationId: "fee-b", amount: 7_000 },
      ],
    );
    assert.equal(result.unallocatedAmount, 0);
  });

  it("never allocates beyond the payment amount", () => {
    const result = reconcile({ ...payment, amount: 1 }, [obligation()]);
    assert.equal(result.allocatedAmount, 1);
    assert.equal(result.allocations[0]?.amount, 1);
  });

  it("returns an unapplied remainder when obligations are fully paid", () => {
    const result = reconcile(payment, [obligation({ outstanding: 2_500 })]);
    assert.equal(result.allocatedAmount, 2_500);
    assert.equal(result.unallocatedAmount, 12_500);
  });

  it("excludes obligations from another tenant", () => {
    const result = reconcile(payment, [obligation({ tenantId: "south" })]);
    assert.deepEqual(result.allocations, []);
    assert.deepEqual(result.excluded, [
      { obligationId: "fee-1", reason: "different_tenant" },
    ]);
  });

  it("explains ineligible and fully paid exclusions", () => {
    const result = reconcile(payment, [
      obligation({ id: "fee-1", eligible: false }),
      obligation({ id: "fee-2", outstanding: 0 }),
    ]);
    assert.deepEqual(result.excluded, [
      { obligationId: "fee-1", reason: "ineligible" },
      { obligationId: "fee-2", reason: "nothing_outstanding" },
    ]);
  });

  it("does not mutate the caller's obligation order", () => {
    const obligations = [
      obligation({ id: "new", dueDate: "2026-02-01" }),
      obligation({ id: "old", dueDate: "2026-01-01" }),
    ];
    reconcile(payment, obligations);
    assert.deepEqual(obligations.map(({ id }) => id), ["new", "old"]);
  });

  it("rejects fractional, negative, and unsafe money", () => {
    for (const amount of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => reconcile({ ...payment, amount }, []), InvalidMoneyError);
    }
  });

  it("rejects malformed dates", () => {
    for (const dueDate of ["next Tuesday", "2026-02-30", "2026-13-01"]) {
      assert.throws(
        () => reconcile(payment, [obligation({ dueDate })]),
        InvalidDateError,
      );
    }
  });

  it("rejects duplicate obligation ids", () => {
    assert.throws(
      () => reconcile(payment, [obligation(), obligation()]),
      DuplicateObligationError,
    );
  });
});
