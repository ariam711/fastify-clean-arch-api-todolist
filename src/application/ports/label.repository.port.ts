import type { Label } from '@domain/entities/label.entity.js';
import type { OffsetPaginatedResult, OffsetPaginationParams } from '@domain/types/index.js';

export interface LabelRepositoryPort {
  create(label: Label): Promise<Label>;
  findById(id: string): Promise<Label | null>;
  findByIds(ids: string[]): Promise<Label[]>;
  findByName(name: string, projectId: string): Promise<Label | null>;
  findByProjectId(projectId: string, pagination: OffsetPaginationParams): Promise<OffsetPaginatedResult<Label>>;
  update(label: Label): Promise<Label>;
  delete(id: string): Promise<void>;
  deleteByProjectId(projectId: string): Promise<number>;
}
