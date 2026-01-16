import { describe, expect, it } from 'vitest';
import { Task } from '../../../src/domain/entities/task.entity.js';
import {
  BusinessRuleViolationError,
  ValidationError,
} from '../../../src/domain/errors/domain-errors.js';

describe('Task Entity', () => {
  const futureDate = new Date(Date.now() + 86400000); // Tomorrow

  describe('create', () => {
    it('should create a task with required fields', () => {
      const task = Task.create({
        title: 'My Task',
        projectId: 'project-1',
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('My Task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.projectId).toBe('project-1');
      expect(task.labelIds).toEqual([]);
    });

    it('should create a task with all optional fields', () => {
      const task = Task.create({
        title: 'My Task',
        description: 'Task description',
        status: 'in_progress',
        priority: 'high',
        dueDate: futureDate,
        projectId: 'project-1',
        labelIds: ['label-1', 'label-2'],
      });

      expect(task.description).toBe('Task description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toEqual(futureDate);
      expect(task.labelIds).toEqual(['label-1', 'label-2']);
    });

    it('should trim whitespace from title', () => {
      const task = Task.create({
        title: '  My Task  ',
        projectId: 'project-1',
      });

      expect(task.title).toBe('My Task');
    });

    it('should throw ValidationError for empty title', () => {
      expect(() => Task.create({ title: '', projectId: 'p1' })).toThrow(ValidationError);
      expect(() => Task.create({ title: '   ', projectId: 'p1' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => Task.create({ title: longTitle, projectId: 'p1' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing projectId', () => {
      expect(() => Task.create({ title: 'Test', projectId: '' })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', () => {
      expect(() =>
        Task.create({
          title: 'Test',
          projectId: 'p1',
          status: 'invalid' as never,
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid priority', () => {
      expect(() =>
        Task.create({
          title: 'Test',
          projectId: 'p1',
          priority: 'invalid' as never,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('status transitions', () => {
    it('should allow todo -> in_progress', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'todo' });
      task.update({ status: 'in_progress' });
      expect(task.status).toBe('in_progress');
    });

    it('should allow todo -> cancelled', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'todo' });
      task.update({ status: 'cancelled' });
      expect(task.status).toBe('cancelled');
    });

    it('should allow in_progress -> done', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      task.update({ status: 'done' });
      expect(task.status).toBe('done');
    });

    it('should allow in_progress -> todo (backlog)', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      task.update({ status: 'todo' });
      expect(task.status).toBe('todo');
    });

    it('should allow done -> in_progress (reopen)', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      task.update({ status: 'done' });
      task.update({ status: 'in_progress' });
      expect(task.status).toBe('in_progress');
    });

    it('should allow cancelled -> todo (reopen)', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1' });
      task.update({ status: 'cancelled' });
      task.update({ status: 'todo' });
      expect(task.status).toBe('todo');
    });

    it('should throw BusinessRuleViolationError for todo -> done (skip in_progress)', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'todo' });
      expect(() => task.update({ status: 'done' })).toThrow(BusinessRuleViolationError);
    });

    it('should throw BusinessRuleViolationError for done -> todo', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      task.update({ status: 'done' });
      expect(() => task.update({ status: 'todo' })).toThrow(BusinessRuleViolationError);
    });

    it('should not throw when transitioning to same status', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'todo' });
      expect(() => task.update({ status: 'todo' })).not.toThrow();
    });
  });

  describe('isCompleted and isOpen', () => {
    it('should return correct values for todo status', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'todo' });
      expect(task.isCompleted).toBe(false);
      expect(task.isOpen).toBe(true);
    });

    it('should return correct values for in_progress status', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      expect(task.isCompleted).toBe(false);
      expect(task.isOpen).toBe(true);
    });

    it('should return correct values for done status', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', status: 'in_progress' });
      task.update({ status: 'done' });
      expect(task.isCompleted).toBe(true);
      expect(task.isOpen).toBe(false);
    });

    it('should return correct values for cancelled status', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1' });
      task.update({ status: 'cancelled' });
      expect(task.isCompleted).toBe(false);
      expect(task.isOpen).toBe(false);
    });
  });

  describe('label management', () => {
    it('should add label', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1' });
      task.addLabel('label-1');
      expect(task.labelIds).toContain('label-1');
    });

    it('should not duplicate labels', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', labelIds: ['label-1'] });
      task.addLabel('label-1');
      expect(task.labelIds.filter((id) => id === 'label-1')).toHaveLength(1);
    });

    it('should remove label', () => {
      const task = Task.create({
        title: 'Test',
        projectId: 'p1',
        labelIds: ['label-1', 'label-2'],
      });
      task.removeLabel('label-1');
      expect(task.labelIds).not.toContain('label-1');
      expect(task.labelIds).toContain('label-2');
    });

    it('should handle removing non-existent label gracefully', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1' });
      expect(() => task.removeLabel('non-existent')).not.toThrow();
    });
  });

  describe('update', () => {
    it('should update multiple fields', () => {
      const task = Task.create({ title: 'Original', projectId: 'p1' });

      task.update({
        title: 'Updated',
        description: 'New description',
        priority: 'urgent',
      });

      expect(task.title).toBe('Updated');
      expect(task.description).toBe('New description');
      expect(task.priority).toBe('urgent');
    });

    it('should clear dueDate when set to null', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', dueDate: futureDate });

      task.update({ dueDate: null });

      expect(task.dueDate).toBeUndefined();
    });

    it('should update labelIds', () => {
      const task = Task.create({ title: 'Test', projectId: 'p1', labelIds: ['old'] });

      task.update({ labelIds: ['new-1', 'new-2'] });

      expect(task.labelIds).toEqual(['new-1', 'new-2']);
    });
  });

  describe('toJSON', () => {
    it('should serialize task to JSON', () => {
      const task = Task.create(
        {
          title: 'Test',
          description: 'Desc',
          status: 'in_progress',
          priority: 'high',
          dueDate: futureDate,
          projectId: 'p1',
          labelIds: ['l1'],
        },
        'task-id',
      );

      const json = task.toJSON();

      expect(json).toEqual({
        id: 'task-id',
        title: 'Test',
        description: 'Desc',
        status: 'in_progress',
        priority: 'high',
        dueDate: futureDate,
        projectId: 'p1',
        labelIds: ['l1'],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
    });
  });
});
