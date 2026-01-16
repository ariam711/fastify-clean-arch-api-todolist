import { describe, expect, it } from 'vitest';
import {
  BusinessRuleViolationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../src/domain/errors/domain-errors.js';

describe('Domain Errors', () => {
  describe('ValidationError', () => {
    it('should create validation error with message and field', () => {
      const error = new ValidationError('Invalid value', 'email');
      expect(error.message).toBe('Invalid value');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
    });

    it('should work without field', () => {
      const error = new ValidationError('Invalid value');
      expect(error.field).toBeUndefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource and id', () => {
      const error = new NotFoundError('Project', 'abc123');
      expect(error.message).toBe("Project with id 'abc123' not found");
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
      expect(error.entityType).toBe('Project');
      expect(error.entityId).toBe('abc123');
    });

    it('should work without id', () => {
      const error = new NotFoundError('Project');
      expect(error.message).toBe('Project not found');
      expect(error.entityId).toBeUndefined();
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with resource, field, and custom message', () => {
      const error = new ConflictError('Project', 'name', "Project with name 'MyProject' already exists");
      expect(error.message).toBe("Project with name 'MyProject' already exists");
      expect(error.code).toBe('CONFLICT');
      expect(error.name).toBe('ConflictError');
      expect(error.entityType).toBe('Project');
      expect(error.field).toBe('name');
    });

    it('should use default message when not provided', () => {
      const error = new ConflictError('Project', 'name');
      expect(error.message).toBe('Project with this name already exists');
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('should create business rule error with rule and message', () => {
      const error = new BusinessRuleViolationError('delete-project', 'Cannot delete project with tasks');
      expect(error.message).toBe('Cannot delete project with tasks');
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.name).toBe('BusinessRuleViolationError');
      expect(error.rule).toBe('delete-project');
    });
  });
});
