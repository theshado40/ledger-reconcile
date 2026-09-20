import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyReconciliation,
  MemoryAllocationStore,
  reconcile,
} from "../src/index.js";

describe("applyReconciliation", () => {
  it("persists previewed allocations", () => {
    const store = new MemoryAllocationStore();
    const preview = reconcile(
      { id: "pay-1", tenantId: "tenant-1", amount: 7_500 },
      [
        {
          id: "invoice-1",
          tenantId: "tenant-1",
          outstanding: 10_000,
          dueDate: "2026-01-01",
        },
      ],
    );

    const result = applyReconciliation(preview, store);
    assert.equal(result.applied.length, 1);
    assert.equal(result.skippedDuplicates.length, 0);
    assert.deepEqual(store.all(), preview.allocations);
  });

  it("is idempotent when the same preview is applied twice", () => {
    const store = new MemoryAllocationStore();
    const preview = reconcile(
      { id: "pay-1", tenantId: "tenant-1", amount: 5_000 },
      [
        {
          id: "invoice-1",
          tenantId: "tenant-1",
          outstanding: 5_000,
          dueDate: "2026-01-01",
        },
      ],
    );

    applyReconciliation(preview, store);
    const second = applyReconciliation(preview, store);

    assert.equal(second.applied.length, 0);
    assert.equal(second.skippedDuplicates.length, 1);
    assert.equal(store.all().length, 1);
  });
});
