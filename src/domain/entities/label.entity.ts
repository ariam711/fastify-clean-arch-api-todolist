import { ValidationError } from '@domain/errors/domain-errors.js';
import { Entity } from '@domain/shared/entity.js';

export interface LabelProps {
  name: string;
  color: string;
  projectId: string;
  createdAt: Date;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
  projectId: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export class Label extends Entity<LabelProps> {
  private constructor(props: LabelProps, id?: string) {
    super(props, id);
  }

  static create(input: CreateLabelInput, id?: string): Label {
    const name = input.name.trim();

    if (!name || name.length === 0) {
      throw new ValidationError('Label name is required', 'name');
    }

    if (name.length > 50) {
      throw new ValidationError('Label name must not exceed 50 characters', 'name');
    }

    if (!input.projectId) {
      throw new ValidationError('Label must belong to a project', 'projectId');
    }

    const color = input.color?.trim() ?? Label.getRandomColor();

    if (!HEX_COLOR_REGEX.test(color)) {
      throw new ValidationError('Color must be a valid hex color (e.g., #ff0000)', 'color');
    }

    return new Label(
      {
        name,
        color,
        projectId: input.projectId,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: LabelProps, id: string): Label {
    return new Label(props, id);
  }

  private static getRandomColor(): string {
    return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)] ?? '#3b82f6';
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  update(input: UpdateLabelInput): void {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length === 0) {
        throw new ValidationError('Label name is required', 'name');
      }
      if (name.length > 50) {
        throw new ValidationError('Label name must not exceed 50 characters', 'name');
      }
      this.props.name = name;
    }

    if (input.color !== undefined) {
      const color = input.color.trim();
      if (!HEX_COLOR_REGEX.test(color)) {
        throw new ValidationError('Color must be a valid hex color (e.g., #ff0000)', 'color');
      }
      this.props.color = color;
    }
  }

  toJSON(): LabelProps & { id: string } {
    return {
      id: this.id,
      name: this.props.name,
      color: this.props.color,
      projectId: this.props.projectId,
      createdAt: this.props.createdAt,
    };
  }
}
