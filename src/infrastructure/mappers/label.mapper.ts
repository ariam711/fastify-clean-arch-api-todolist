import type { Document, WithId } from 'mongodb';
import { Label, type LabelProps } from '../../domain/entities/label.entity.js';

export interface LabelDocument extends Document {
  _id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: Date;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper pattern
export class LabelMapper {
  static toDocument(label: Label): LabelDocument {
    return {
      _id: label.id,
      name: label.name,
      color: label.color,
      projectId: label.projectId,
      createdAt: label.createdAt,
    };
  }

  static toDomain(doc: WithId<LabelDocument>): Label {
    const props: LabelProps = {
      name: doc.name,
      color: doc.color,
      projectId: doc.projectId,
      createdAt: doc.createdAt,
    };
    return Label.reconstitute(props, doc._id);
  }
}
