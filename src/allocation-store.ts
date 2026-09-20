import { allocationKey } from "./allocation-key.js";
import type { Allocation } from "./types.js";

export interface AllocationStore {
  has(key: string): boolean;
  save(key: string, allocation: Allocation): void;
}

/** Small in-memory adapter for tests, prototypes, and reference implementations. */
export class MemoryAllocationStore implements AllocationStore {
  readonly #allocations = new Map<string, Allocation>();

  public has(key: string): boolean {
    return this.#allocations.has(key);
  }

  public save(key: string, allocation: Allocation): void {
    this.#allocations.set(key, allocation);
  }

  public all(): readonly Allocation[] {
    return [...this.#allocations.values()];
  }

  public seed(allocation: Allocation): void {
    this.save(allocationKey(allocation), allocation);
  }
}
