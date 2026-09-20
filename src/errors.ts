export class InvalidMoneyError extends Error {
  public constructor(field: string, value: number) {
    super(`${field} must be a non-negative integer in minor units; received ${value}`);
    this.name = "InvalidMoneyError";
  }
}

export class InvalidDateError extends Error {
  public constructor(value: string) {
    super(`dueDate must be an ISO-8601 calendar date; received ${value}`);
    this.name = "InvalidDateError";
  }
}

export class DuplicateObligationError extends Error {
  public constructor(id: string) {
    super(`Obligation id must be unique within a preview; duplicate ${id}`);
    this.name = "DuplicateObligationError";
  }
}
