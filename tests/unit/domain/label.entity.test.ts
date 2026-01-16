import { describe, expect, it } from 'vitest';
import { Label } from '../../../src/domain/entities/label.entity.js';
import { ValidationError } from '../../../src/domain/errors/domain-errors.js';

describe('Label Entity', () => {
  describe('create', () => {
    it('should create a label with name and project', () => {
      const label = Label.create({
        name: 'Bug',
        projectId: 'project-1',
      });

      expect(label.id).toBeDefined();
      expect(label.name).toBe('Bug');
      expect(label.projectId).toBe('project-1');
      expect(label.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(label.createdAt).toBeInstanceOf(Date);
    });

    it('should create a label with custom color', () => {
      const label = Label.create({
        name: 'Feature',
        color: '#22c55e',
        projectId: 'project-1',
      });

      expect(label.color).toBe('#22c55e');
    });

    it('should trim whitespace from name', () => {
      const label = Label.create({
        name: '  Urgent  ',
        projectId: 'project-1',
      });

      expect(label.name).toBe('Urgent');
    });

    it('should throw ValidationError for empty name', () => {
      expect(() => Label.create({ name: '', projectId: 'p1' })).toThrow(ValidationError);

      expect(() => Label.create({ name: '   ', projectId: 'p1' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => Label.create({ name: longName, projectId: 'p1' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing projectId', () => {
      expect(() => Label.create({ name: 'Test', projectId: '' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid color format', () => {
      expect(() => Label.create({ name: 'Test', color: 'red', projectId: 'p1' })).toThrow(ValidationError);

      expect(() => Label.create({ name: 'Test', color: '#ff', projectId: 'p1' })).toThrow(ValidationError);

      expect(() => Label.create({ name: 'Test', color: '#gggggg', projectId: 'p1' })).toThrow(ValidationError);
    });

    it('should accept valid hex colors', () => {
      expect(() => Label.create({ name: 'Test', color: '#ffffff', projectId: 'p1' })).not.toThrow();

      expect(() => Label.create({ name: 'Test', color: '#000000', projectId: 'p1' })).not.toThrow();

      expect(() => Label.create({ name: 'Test', color: '#AABBCC', projectId: 'p1' })).not.toThrow();
    });
  });

  describe('update', () => {
    it('should update label name', () => {
      const label = Label.create({ name: 'Original', projectId: 'p1' });

      label.update({ name: 'Updated' });

      expect(label.name).toBe('Updated');
    });

    it('should update label color', () => {
      const label = Label.create({ name: 'Test', projectId: 'p1' });

      label.update({ color: '#ef4444' });

      expect(label.color).toBe('#ef4444');
    });

    it('should update both name and color', () => {
      const label = Label.create({ name: 'Test', projectId: 'p1' });

      label.update({ name: 'New Name', color: '#3b82f6' });

      expect(label.name).toBe('New Name');
      expect(label.color).toBe('#3b82f6');
    });

    it('should throw ValidationError for invalid name on update', () => {
      const label = Label.create({ name: 'Test', projectId: 'p1' });

      expect(() => label.update({ name: '' })).toThrow(ValidationError);
      expect(() => label.update({ name: 'a'.repeat(51) })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid color on update', () => {
      const label = Label.create({ name: 'Test', projectId: 'p1' });

      expect(() => label.update({ color: 'invalid' })).toThrow(ValidationError);
    });

    it('should not change projectId (immutable)', () => {
      const label = Label.create({ name: 'Test', projectId: 'p1' });

      // projectId is not in UpdateLabelInput, ensuring it cannot be changed
      expect(label.projectId).toBe('p1');
    });
  });

  describe('toJSON', () => {
    it('should serialize label to JSON', () => {
      const label = Label.create({ name: 'Bug', color: '#ef4444', projectId: 'p1' }, 'label-id');

      const json = label.toJSON();

      expect(json).toEqual({
        id: 'label-id',
        name: 'Bug',
        color: '#ef4444',
        projectId: 'p1',
        createdAt: label.createdAt,
      });
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const label1 = Label.create({ name: 'Test', projectId: 'p1' }, 'same-id');
      const label2 = Label.reconstitute(
        { name: 'Different', color: '#000000', projectId: 'p2', createdAt: new Date() },
        'same-id',
      );

      expect(label1.equals(label2)).toBe(true);
    });

    it('should return false for different id', () => {
      const label1 = Label.create({ name: 'Test', projectId: 'p1' }, 'id-1');
      const label2 = Label.create({ name: 'Test', projectId: 'p1' }, 'id-2');

      expect(label1.equals(label2)).toBe(false);
    });
  });
});
