import type { Allocation } from "./types.js";

/** Stable idempotency key for one payment-to-obligation relationship. */
export function allocationKey(
  allocation: Pick<Allocation, "tenantId" | "paymentId" | "obligationId">,
): string {
  return JSON.stringify([
    allocation.tenantId,
    allocation.paymentId,
    allocation.obligationId,
  ]);
}
