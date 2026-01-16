import { Entity } from '@domain/shared/entity.js';
import { describe, expect, it } from 'vitest';

// Concrete implementation for testing abstract Entity class
interface TestProps {
  name: string;
}

class TestEntity extends Entity<TestProps> {
  get name(): string {
    return this.props.name;
  }
}

describe('Entity Base Class', () => {
  it('should generate id when not provided', () => {
    const entity = new TestEntity({ name: 'Test' });
    expect(entity.id).toBeDefined();
    expect(typeof entity.id).toBe('string');
    expect(entity.id.length).toBeGreaterThan(0);
  });

  it('should use provided id', () => {
    const entity = new TestEntity({ name: 'Test' }, 'custom-id');
    expect(entity.id).toBe('custom-id');
  });

  it('should return true when comparing same entity', () => {
    const entity = new TestEntity({ name: 'Test' }, 'same-id');
    expect(entity.equals(entity)).toBe(true);
  });

  it('should return true when comparing entities with same id', () => {
    const entity1 = new TestEntity({ name: 'Test1' }, 'same-id');
    const entity2 = new TestEntity({ name: 'Test2' }, 'same-id');
    expect(entity1.equals(entity2)).toBe(true);
  });

  it('should return false when comparing entities with different ids', () => {
    const entity1 = new TestEntity({ name: 'Test' }, 'id-1');
    const entity2 = new TestEntity({ name: 'Test' }, 'id-2');
    expect(entity1.equals(entity2)).toBe(false);
  });

  it('should return false when comparing with undefined', () => {
    const entity = new TestEntity({ name: 'Test' });
    expect(entity.equals(undefined)).toBe(false);
  });

  it('should return false when comparing with null', () => {
    const entity = new TestEntity({ name: 'Test' });
    expect(entity.equals(null as never)).toBe(false);
  });

  it('should access props via getter', () => {
    const entity = new TestEntity({ name: 'Test Name' }, 'test-id');
    expect(entity.name).toBe('Test Name');
  });
});
