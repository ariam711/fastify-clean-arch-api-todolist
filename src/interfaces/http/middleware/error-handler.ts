import {
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '@domain/errors/domain-errors.js';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void {
  const correlationId = request.headers['x-correlation-id'] ?? request.id;

  request.log.error({
    correlationId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });

  if (error instanceof ValidationError) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field,
      },
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof NotFoundError) {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: error.message,
        details: {
          entityType: error.entityType,
          entityId: error.entityId,
        },
      },
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof ConflictError) {
    reply.status(409).send({
      error: {
        code: 'CONFLICT',
        message: error.message,
        field: error.field,
      },
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof BusinessRuleViolationError) {
    reply.status(422).send({
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: error.message,
        details: {
          rule: error.rule,
        },
      },
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof DomainError) {
    reply.status(400).send({
      error: {
        code: error.code,
        message: error.message,
      },
    } satisfies ErrorResponse);
    return;
  }

  // Fastify validation errors
  if ('validation' in error) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    } satisfies ErrorResponse);
    return;
  }

  // Default 500 error
  reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
    },
  } satisfies ErrorResponse);
}
