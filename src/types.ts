export type TenantId = string;

export interface Payment {
  readonly id: string;
  readonly tenantId: TenantId;
  /** Integer minor units (for example, cents). */
  readonly amount: number;
}

export interface Obligation {
  readonly id: string;
  readonly tenantId: TenantId;
  /** Integer minor units still owing. */
  readonly outstanding: number;
  /** ISO-8601 date used for oldest-first allocation. */
  readonly dueDate: string;
  readonly eligible?: boolean;
}

export interface Allocation {
  readonly paymentId: string;
  readonly obligationId: string;
  readonly tenantId: TenantId;
  readonly amount: number;
}

export type ExclusionReason =
  | "different_tenant"
  | "ineligible"
  | "nothing_outstanding";

export interface ExcludedObligation {
  readonly obligationId: string;
  readonly reason: ExclusionReason;
}

export interface ReconciliationPreview {
  readonly paymentId: string;
  readonly tenantId: TenantId;
  readonly paymentAmount: number;
  readonly allocatedAmount: number;
  readonly unallocatedAmount: number;
  readonly allocations: readonly Allocation[];
  readonly excluded: readonly ExcludedObligation[];
}

export interface AppliedReconciliation extends ReconciliationPreview {
  readonly applied: readonly Allocation[];
  readonly skippedDuplicates: readonly Allocation[];
}
