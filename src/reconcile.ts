import {
  DuplicateObligationError,
  InvalidDateError,
  InvalidMoneyError,
} from "./errors.js";
import type {
  Allocation,
  ExcludedObligation,
  Obligation,
  Payment,
  ReconciliationPreview,
} from "./types.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertMoney(field: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new InvalidMoneyError(field, value);
  }
}

function assertDate(value: string): void {
  if (!ISO_DATE.test(value)) {
    throw new InvalidDateError(value);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  const matchesCalendar =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day;

  if (!matchesCalendar) throw new InvalidDateError(value);
}

/**
 * Builds a side-effect-free allocation preview.
 *
 * Eligible obligations are paid oldest-first, then by id for a stable tie-break.
 * A payment can never cross its tenant boundary or allocate more than its amount.
 */
export function reconcile(
  payment: Payment,
  obligations: readonly Obligation[],
): ReconciliationPreview {
  assertMoney("payment.amount", payment.amount);

  const ids = new Set<string>();
  const eligible: Obligation[] = [];
  const excluded: ExcludedObligation[] = [];

  for (const obligation of obligations) {
    if (ids.has(obligation.id)) {
      throw new DuplicateObligationError(obligation.id);
    }
    ids.add(obligation.id);
    assertMoney(`obligation ${obligation.id}.outstanding`, obligation.outstanding);
    assertDate(obligation.dueDate);

    if (obligation.tenantId !== payment.tenantId) {
      excluded.push({ obligationId: obligation.id, reason: "different_tenant" });
    } else if (obligation.eligible === false) {
      excluded.push({ obligationId: obligation.id, reason: "ineligible" });
    } else if (obligation.outstanding === 0) {
      excluded.push({ obligationId: obligation.id, reason: "nothing_outstanding" });
    } else {
      eligible.push(obligation);
    }
  }

  eligible.sort((left, right) =>
    left.dueDate.localeCompare(right.dueDate) || left.id.localeCompare(right.id),
  );

  let remaining = payment.amount;
  const allocations: Allocation[] = [];

  for (const obligation of eligible) {
    if (remaining === 0) break;

    const amount = Math.min(remaining, obligation.outstanding);
    allocations.push({
      paymentId: payment.id,
      obligationId: obligation.id,
      tenantId: payment.tenantId,
      amount,
    });
    remaining -= amount;
  }

  return {
    paymentId: payment.id,
    tenantId: payment.tenantId,
    paymentAmount: payment.amount,
    allocatedAmount: payment.amount - remaining,
    unallocatedAmount: remaining,
    allocations,
    excluded,
  };
}
