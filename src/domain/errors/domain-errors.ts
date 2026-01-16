export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;
  readonly entityType: string;
  readonly entityId?: string;

  constructor(entityType: string, entityId?: string) {
    super(entityId ? `${entityType} with id '${entityId}' not found` : `${entityType} not found`);
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;
  readonly entityType: string;
  readonly field: string;

  constructor(entityType: string, field: string, message?: string) {
    super(message ?? `${entityType} with this ${field} already exists`);
    this.entityType = entityType;
    this.field = field;
  }
}

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION' as const;
  readonly rule: string;

  constructor(rule: string, message: string) {
    super(message);
    this.rule = rule;
  }
}
