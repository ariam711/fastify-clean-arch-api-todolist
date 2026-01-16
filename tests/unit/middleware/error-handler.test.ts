import {
  BusinessRuleViolationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@domain/errors/domain-errors.js';
import { errorHandler } from '@interface/http/middleware/error-handler.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

describe('Error Handler Middleware', () => {
  const createMockRequest = (): FastifyRequest =>
    ({
      headers: {},
      id: 'test-req-id',
      log: { error: vi.fn() },
    }) as unknown as FastifyRequest;

  const createMockReply = () => {
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    return reply as unknown as FastifyReply;
  };

  it('should handle ValidationError with 400 status', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new ValidationError('Invalid input', 'title');

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field: 'title',
      },
    });
  });

  it('should handle ValidationError without field', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new ValidationError('Invalid input');

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field: undefined,
      },
    });
  });

  it('should handle NotFoundError with 404 status', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new NotFoundError('Project', 'abc123');

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: "Project with id 'abc123' not found",
        details: {
          entityType: 'Project',
          entityId: 'abc123',
        },
      },
    });
  });

  it('should handle ConflictError with 409 status', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new ConflictError('Project', 'name', "Project with name 'MyProject' already exists");

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(409);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'CONFLICT',
        message: "Project with name 'MyProject' already exists",
        field: 'name',
      },
    });
  });

  it('should handle BusinessRuleViolationError with 422 status', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new BusinessRuleViolationError('delete-project', 'Cannot delete project with open tasks');

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(422);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: 'Cannot delete project with open tasks',
        details: {
          rule: 'delete-project',
        },
      },
    });
  });

  it('should handle Fastify validation errors', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = {
      name: 'ValidationError',
      message: 'Invalid format',
      validation: [{ message: 'Invalid format', instancePath: '/body/name' }],
      validationContext: 'body',
    };

    errorHandler(error as unknown as Error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid format',
      },
    });
  });

  it('should handle unknown errors with 500 status in non-production', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new Error('Something went wrong');

    errorHandler(error, request, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      },
    });
  });

  it('should log the error with correlation id', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new Error('Test error');

    errorHandler(error, request, reply);

    expect(request.log.error).toHaveBeenCalledWith({
      correlationId: 'test-req-id',
      error: {
        name: 'Error',
        message: 'Test error',
        stack: expect.any(String),
      },
    });
  });
});
