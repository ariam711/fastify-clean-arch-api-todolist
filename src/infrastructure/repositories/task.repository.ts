import type { Collection, Db, Filter, Sort } from 'mongodb';
import type {
  ListTasksParams,
  TaskFilterParams,
  TaskRepositoryPort,
} from '@app/ports/task.repository.port.js';
import type { Task } from '@domain/entities/task.entity.js';
import type { PaginatedResult } from '@domain/types/index.js';
import { type TaskDocument, TaskMapper } from '@infra/mappers/task.mapper.js';

export class TaskRepository implements TaskRepositoryPort {
  private readonly collection: Collection<TaskDocument>;

  constructor(db: Db) {
    this.collection = db.collection<TaskDocument>('tasks');
  }

  async create(task: Task): Promise<Task> {
    const doc = TaskMapper.toDocument(task);
    await this.collection.insertOne(doc);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? TaskMapper.toDomain(doc) : null;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const docs = await this.collection.find({ projectId }).toArray();
    return docs.map(TaskMapper.toDomain);
  }

  async findAll(params: ListTasksParams): Promise<PaginatedResult<Task>> {
    const { filter, pagination, sort } = params;
    const { limit, cursor } = pagination;

    const mongoFilter = this.buildFilter(filter, cursor);
    const mongoSort = this.buildSort(sort);

    const docs = await this.collection
      .find(mongoFilter)
      .sort(mongoSort)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();

    const hasMore = docs.length > limit;
    const data = hasMore ? docs.slice(0, limit) : docs;

    const lastItem = data[data.length - 1];
    const nextCursor = hasMore && lastItem ? this.encodeCursor(lastItem._id, lastItem.createdAt) : undefined;

    return {
      data: data.map(TaskMapper.toDomain),
      nextCursor,
      hasMore,
    };
  }

  async update(task: Task): Promise<Task> {
    const doc = TaskMapper.toDocument(task);
    await this.collection.replaceOne({ _id: task.id }, doc);
    return task;
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const result = await this.collection.deleteMany({ projectId });
    return result.deletedCount;
  }

  async countOpenTasksByProjectId(projectId: string): Promise<number> {
    return this.collection.countDocuments({
      projectId,
      status: { $in: ['todo', 'in_progress'] },
    });
  }

  private buildFilter(filter?: TaskFilterParams, cursor?: string): Filter<TaskDocument> {
    const mongoFilter: Filter<TaskDocument> = {};

    if (filter?.projectId) {
      mongoFilter.projectId = filter.projectId;
    }

    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        mongoFilter.status = { $in: filter.status };
      } else {
        mongoFilter.status = filter.status;
      }
    }

    if (filter?.priority) {
      if (Array.isArray(filter.priority)) {
        mongoFilter.priority = { $in: filter.priority };
      } else {
        mongoFilter.priority = filter.priority;
      }
    }

    if (filter?.labelIds && filter.labelIds.length > 0) {
      mongoFilter.labelIds = { $all: filter.labelIds };
    }

    if (filter?.dueDateFrom || filter?.dueDateTo) {
      mongoFilter.dueDate = {};
      if (filter.dueDateFrom) {
        mongoFilter.dueDate.$gte = filter.dueDateFrom;
      }
      if (filter.dueDateTo) {
        mongoFilter.dueDate.$lte = filter.dueDateTo;
      }
    }

    if (filter?.search) {
      mongoFilter.$text = { $search: filter.search };
    }

    if (cursor) {
      const { id, createdAt } = this.decodeCursor(cursor);
      mongoFilter.$or = [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $gt: id } }];
    }

    return mongoFilter;
  }

  private buildSort(sort?: { field: string; order: 'asc' | 'desc' }): Sort {
    const defaultSort: Sort = { createdAt: -1, _id: 1 };

    if (!sort) {
      return defaultSort;
    }

    const sortOrder = sort.order === 'asc' ? 1 : -1;
    const sortField = this.mapSortField(sort.field);

    return { [sortField]: sortOrder, _id: 1 };
  }

  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      dueDate: 'dueDate',
      priority: 'priority',
      title: 'title',
      status: 'status',
      updatedAt: 'updatedAt',
    };
    return fieldMap[field] ?? 'createdAt';
  }

  private encodeCursor(id: string, createdAt: Date): string {
    return Buffer.from(JSON.stringify({ id, createdAt: createdAt.toISOString() })).toString('base64');
  }

  private decodeCursor(cursor: string): { id: string; createdAt: Date } {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      return { id: decoded.id, createdAt: new Date(decoded.createdAt) };
    } catch {
      return { id: '', createdAt: new Date() };
    }
  }
}
