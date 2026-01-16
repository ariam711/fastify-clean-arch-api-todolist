import { describe, expect, it } from 'vitest';
import { Project } from '../../../src/domain/entities/project.entity.js';
import { ValidationError } from '../../../src/domain/errors/domain-errors.js';

describe('Project Entity', () => {
  describe('create', () => {
    it('should create a project with valid name', () => {
      const project = Project.create({ name: 'My Project' });

      expect(project.id).toBeDefined();
      expect(project.name).toBe('My Project');
      expect(project.description).toBeUndefined();
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a project with name and description', () => {
      const project = Project.create({
        name: 'My Project',
        description: 'A project description',
      });

      expect(project.name).toBe('My Project');
      expect(project.description).toBe('A project description');
    });

    it('should trim whitespace from name and description', () => {
      const project = Project.create({
        name: '  My Project  ',
        description: '  Description  ',
      });

      expect(project.name).toBe('My Project');
      expect(project.description).toBe('Description');
    });

    it('should throw ValidationError for empty name', () => {
      expect(() => Project.create({ name: '' })).toThrow(ValidationError);
      expect(() => Project.create({ name: '   ' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => Project.create({ name: longName })).toThrow(ValidationError);
    });

    it('should accept name with exactly 100 characters', () => {
      const name = 'a'.repeat(100);
      const project = Project.create({ name });
      expect(project.name).toBe(name);
    });

    it('should use provided id when specified', () => {
      const project = Project.create({ name: 'Test' }, 'custom-id');
      expect(project.id).toBe('custom-id');
    });
  });

  describe('update', () => {
    it('should update project name', () => {
      const project = Project.create({ name: 'Original' });
      const originalUpdatedAt = project.updatedAt;

      // Add small delay to ensure different timestamp
      project.update({ name: 'Updated' });

      expect(project.name).toBe('Updated');
      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should update project description', () => {
      const project = Project.create({ name: 'Test', description: 'Original' });

      project.update({ description: 'Updated description' });

      expect(project.description).toBe('Updated description');
    });

    it('should clear description when set to empty string', () => {
      const project = Project.create({ name: 'Test', description: 'Has description' });

      project.update({ description: '' });

      expect(project.description).toBeUndefined();
    });

    it('should throw ValidationError for invalid name on update', () => {
      const project = Project.create({ name: 'Test' });

      expect(() => project.update({ name: '' })).toThrow(ValidationError);
      expect(() => project.update({ name: 'a'.repeat(101) })).toThrow(ValidationError);
    });

    it('should not change fields not included in update', () => {
      const project = Project.create({ name: 'Original', description: 'Desc' });

      project.update({ name: 'Updated' });

      expect(project.name).toBe('Updated');
      expect(project.description).toBe('Desc');
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const project1 = Project.create({ name: 'Test' }, 'same-id');
      const project2 = Project.reconstitute(
        { name: 'Different', createdAt: new Date(), updatedAt: new Date() },
        'same-id',
      );

      expect(project1.equals(project2)).toBe(true);
    });

    it('should return false for different id', () => {
      const project1 = Project.create({ name: 'Test' }, 'id-1');
      const project2 = Project.create({ name: 'Test' }, 'id-2');

      expect(project1.equals(project2)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const project = Project.create({ name: 'Test' });

      expect(project.equals(null as never)).toBe(false);
      expect(project.equals(undefined)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize project to JSON', () => {
      const project = Project.create({ name: 'Test', description: 'Desc' }, 'test-id');

      const json = project.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        name: 'Test',
        description: 'Desc',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
    });
  });
});
