import { allocationKey } from "./allocation-key.js";
import type { AllocationStore } from "./allocation-store.js";
import type {
  AppliedReconciliation,
  ReconciliationPreview,
} from "./types.js";

/**
 * Persists a preview idempotently through a caller-supplied store.
 *
 * Production adapters should wrap this call in their database transaction and
 * enforce the same key with a unique constraint.
 */
export function applyReconciliation(
  preview: ReconciliationPreview,
  store: AllocationStore,
): AppliedReconciliation {
  const applied = [];
  const skippedDuplicates = [];

  for (const allocation of preview.allocations) {
    const key = allocationKey(allocation);
    if (store.has(key)) {
      skippedDuplicates.push(allocation);
      continue;
    }

    store.save(key, allocation);
    applied.push(allocation);
  }

  return { ...preview, applied, skippedDuplicates };
}
