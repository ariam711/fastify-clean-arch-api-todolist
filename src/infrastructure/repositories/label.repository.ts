import type { Collection, Db } from 'mongodb';
import type { LabelRepositoryPort } from '../../application/ports/label.repository.port.js';
import type { Label } from '../../domain/entities/label.entity.js';
import type { OffsetPaginatedResult, OffsetPaginationParams } from '../../domain/types/index.js';
import { type LabelDocument, LabelMapper } from '../mappers/label.mapper.js';

export class LabelRepository implements LabelRepositoryPort {
  private readonly collection: Collection<LabelDocument>;

  constructor(db: Db) {
    this.collection = db.collection<LabelDocument>('labels');
  }

  async create(label: Label): Promise<Label> {
    const doc = LabelMapper.toDocument(label);
    await this.collection.insertOne(doc);
    return label;
  }

  async findById(id: string): Promise<Label | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? LabelMapper.toDomain(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Label[]> {
    const docs = await this.collection.find({ _id: { $in: ids } }).toArray();
    return docs.map(LabelMapper.toDomain);
  }

  async findByName(name: string, projectId: string): Promise<Label | null> {
    const doc = await this.collection.findOne({
      name: name.trim(),
      projectId,
    });
    return doc ? LabelMapper.toDomain(doc) : null;
  }

  async findByProjectId(
    projectId: string,
    pagination: OffsetPaginationParams,
  ): Promise<OffsetPaginatedResult<Label>> {
    const { limit, offset } = pagination;

    const [docs, total] = await Promise.all([
      this.collection.find({ projectId }).sort({ name: 1 }).skip(offset).limit(limit).toArray(),
      this.collection.countDocuments({ projectId }),
    ]);

    return {
      data: docs.map(LabelMapper.toDomain),
      total,
      limit,
      offset,
      hasMore: offset + docs.length < total,
    };
  }

  async update(label: Label): Promise<Label> {
    const doc = LabelMapper.toDocument(label);
    await this.collection.replaceOne({ _id: label.id }, doc);
    return label;
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const result = await this.collection.deleteMany({ projectId });
    return result.deletedCount;
  }
}
