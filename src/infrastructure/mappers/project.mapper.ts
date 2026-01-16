import { Project, type ProjectProps } from '@domain/entities/project.entity.js';
import type { Document, WithId } from 'mongodb';

export interface ProjectDocument extends Document {
  _id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper pattern
export class ProjectMapper {
  static toDocument(project: Project): ProjectDocument {
    return {
      _id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static toDomain(doc: WithId<ProjectDocument>): Project {
    const props: ProjectProps = {
      name: doc.name,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return Project.reconstitute(props, doc._id);
  }
}
