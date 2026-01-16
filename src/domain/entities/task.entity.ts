import { BusinessRuleViolationError, ValidationError } from '../errors/domain-errors.js';
import { Entity } from '../shared/entity.js';
import type { TaskPriority, TaskStatus } from '../types/index.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../types/index.js';

export interface TaskProps {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId: string;
  labelIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  projectId: string;
  labelIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  labelIds?: string[];
}

const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['todo', 'done', 'cancelled'],
  done: ['in_progress'],
  cancelled: ['todo'],
};

export class Task extends Entity<TaskProps> {
  private constructor(props: TaskProps, id?: string) {
    super(props, id);
  }

  static create(input: CreateTaskInput, id?: string): Task {
    const title = input.title.trim();

    if (!title || title.length === 0) {
      throw new ValidationError('Task title is required', 'title');
    }

    if (title.length > 200) {
      throw new ValidationError('Task title must not exceed 200 characters', 'title');
    }

    if (!input.projectId) {
      throw new ValidationError('Task must belong to a project', 'projectId');
    }

    if (input.status && !TASK_STATUSES.includes(input.status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`,
        'status',
      );
    }

    if (input.priority && !TASK_PRIORITIES.includes(input.priority)) {
      throw new ValidationError(
        `Invalid priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`,
        'priority',
      );
    }

    if (input.dueDate && input.dueDate < new Date()) {
      throw new ValidationError('Due date cannot be in the past', 'dueDate');
    }

    const now = new Date();
    return new Task(
      {
        title,
        description: input.description?.trim(),
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        dueDate: input.dueDate,
        projectId: input.projectId,
        labelIds: input.labelIds ?? [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: TaskProps, id: string): Task {
    return new Task(props, id);
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get labelIds(): string[] {
    return [...this.props.labelIds];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isCompleted(): boolean {
    return this.props.status === 'done';
  }

  get isOpen(): boolean {
    return this.props.status === 'todo' || this.props.status === 'in_progress';
  }

  update(input: UpdateTaskInput): void {
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title || title.length === 0) {
        throw new ValidationError('Task title is required', 'title');
      }
      if (title.length > 200) {
        throw new ValidationError('Task title must not exceed 200 characters', 'title');
      }
      this.props.title = title;
    }

    if (input.description !== undefined) {
      this.props.description = input.description.trim() || undefined;
    }

    if (input.status !== undefined) {
      this.transitionStatus(input.status);
    }

    if (input.priority !== undefined) {
      if (!TASK_PRIORITIES.includes(input.priority)) {
        throw new ValidationError(
          `Invalid priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`,
          'priority',
        );
      }
      this.props.priority = input.priority;
    }

    if (input.dueDate !== undefined) {
      if (input.dueDate === null) {
        this.props.dueDate = undefined;
      } else {
        this.props.dueDate = input.dueDate;
      }
    }

    if (input.labelIds !== undefined) {
      this.props.labelIds = [...input.labelIds];
    }

    this.props.updatedAt = new Date();
  }

  private transitionStatus(newStatus: TaskStatus): void {
    if (!TASK_STATUSES.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}`,
        'status',
      );
    }

    if (this.props.status === newStatus) {
      return;
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[this.props.status];
    if (!allowedTransitions?.includes(newStatus)) {
      throw new BusinessRuleViolationError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${this.props.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions?.join(', ') ?? 'none'}`,
      );
    }

    this.props.status = newStatus;
  }

  addLabel(labelId: string): void {
    if (!this.props.labelIds.includes(labelId)) {
      this.props.labelIds.push(labelId);
      this.props.updatedAt = new Date();
    }
  }

  removeLabel(labelId: string): void {
    const index = this.props.labelIds.indexOf(labelId);
    if (index !== -1) {
      this.props.labelIds.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  toJSON(): TaskProps & { id: string } {
    return {
      id: this.id,
      title: this.props.title,
      description: this.props.description,
      status: this.props.status,
      priority: this.props.priority,
      dueDate: this.props.dueDate,
      projectId: this.props.projectId,
      labelIds: [...this.props.labelIds],
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
