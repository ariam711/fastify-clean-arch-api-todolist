import type { Collection, Db } from 'mongodb';
import type { ProjectRepositoryPort } from '@app/ports/project.repository.port.js';
import type { Project } from '@domain/entities/project.entity.js';
import type { OffsetPaginatedResult, OffsetPaginationParams } from '@domain/types/index.js';
import { type ProjectDocument, ProjectMapper } from '@infra/mappers/project.mapper.js';

export class ProjectRepository implements ProjectRepositoryPort {
  private readonly collection: Collection<ProjectDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProjectDocument>('projects');
  }

  async create(project: Project): Promise<Project> {
    const doc = ProjectMapper.toDocument(project);
    await this.collection.insertOne(doc);
    return project;
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? ProjectMapper.toDomain(doc) : null;
  }

  async findByName(name: string): Promise<Project | null> {
    const doc = await this.collection.findOne({ name: name.trim() });
    return doc ? ProjectMapper.toDomain(doc) : null;
  }

  async findAll(pagination: OffsetPaginationParams): Promise<OffsetPaginatedResult<Project>> {
    const { limit, offset } = pagination;

    const [docs, total] = await Promise.all([
      this.collection.find().sort({ createdAt: -1 }).skip(offset).limit(limit).toArray(),
      this.collection.countDocuments(),
    ]);

    return {
      data: docs.map(ProjectMapper.toDomain),
      total,
      limit,
      offset,
      hasMore: offset + docs.length < total,
    };
  }

  async update(project: Project): Promise<Project> {
    const doc = ProjectMapper.toDocument(project);
    await this.collection.replaceOne({ _id: project.id }, doc);
    return project;
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }

  async hasOpenTasks(_projectId: string): Promise<boolean> {
    // This will be checked via TaskRepository in use case
    return false;
  }
}
