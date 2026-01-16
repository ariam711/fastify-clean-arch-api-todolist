import { ValidationError } from '../errors/domain-errors.js';
import { Entity } from '../shared/entity.js';

export interface ProjectProps {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export class Project extends Entity<ProjectProps> {
  private constructor(props: ProjectProps, id?: string) {
    super(props, id);
  }

  static create(input: CreateProjectInput, id?: string): Project {
    const name = input.name.trim();

    if (!name || name.length === 0) {
      throw new ValidationError('Project name is required', 'name');
    }

    if (name.length > 100) {
      throw new ValidationError('Project name must not exceed 100 characters', 'name');
    }

    const now = new Date();
    return new Project(
      {
        name,
        description: input.description?.trim(),
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: ProjectProps, id: string): Project {
    return new Project(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(input: UpdateProjectInput): void {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length === 0) {
        throw new ValidationError('Project name is required', 'name');
      }
      if (name.length > 100) {
        throw new ValidationError('Project name must not exceed 100 characters', 'name');
      }
      this.props.name = name;
    }

    if (input.description !== undefined) {
      this.props.description = input.description.trim() || undefined;
    }

    this.props.updatedAt = new Date();
  }

  toJSON(): ProjectProps & { id: string } {
    return {
      id: this.id,
      name: this.props.name,
      description: this.props.description,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
