import { Label } from '@domain/entities/label.entity.js';
import { Project } from '@domain/entities/project.entity.js';
import { Task } from '@domain/entities/task.entity.js';
import type { TaskPriority, TaskStatus } from '@domain/types/index.js';

// Project Builder
export class ProjectBuilder {
  private props: { name: string; description?: string } = {
    name: 'Test Project',
    description: 'A test project description',
  };

  withName(name: string): this {
    this.props.name = name;
    return this;
  }

  withDescription(description?: string): this {
    this.props.description = description;
    return this;
  }

  build(id?: string): Project {
    return Project.create(this.props, id);
  }
}

// Task Builder
export class TaskBuilder {
  private props: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId: string;
    labelIds?: string[];
  } = {
    title: 'Test Task',
    description: 'A test task description',
    projectId: 'test-project-id',
    labelIds: [],
  };

  withTitle(title: string): this {
    this.props.title = title;
    return this;
  }

  withDescription(description?: string): this {
    this.props.description = description;
    return this;
  }

  withStatus(status: TaskStatus): this {
    this.props.status = status;
    return this;
  }

  withPriority(priority: TaskPriority): this {
    this.props.priority = priority;
    return this;
  }

  withDueDate(dueDate?: Date): this {
    this.props.dueDate = dueDate;
    return this;
  }

  withProjectId(projectId: string): this {
    this.props.projectId = projectId;
    return this;
  }

  withLabelIds(labelIds: string[]): this {
    this.props.labelIds = labelIds;
    return this;
  }

  build(id?: string): Task {
    return Task.create(this.props, id);
  }
}

// Label Builder
export class LabelBuilder {
  private props = {
    name: 'Test Label',
    color: '#3b82f6',
    projectId: 'test-project-id',
  };

  withName(name: string): this {
    this.props.name = name;
    return this;
  }

  withColor(color: string): this {
    this.props.color = color;
    return this;
  }

  withProjectId(projectId: string): this {
    this.props.projectId = projectId;
    return this;
  }

  build(id?: string): Label {
    return Label.create(this.props, id);
  }
}

// Factory functions for quick creation
export const createProject = (overrides?: Partial<{ name: string; description?: string }>, id?: string) => {
  const builder = new ProjectBuilder();
  if (overrides?.name) builder.withName(overrides.name);
  if (overrides?.description !== undefined) builder.withDescription(overrides.description);
  return builder.build(id);
};

export const createTask = (
  overrides?: Partial<{
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    projectId: string;
    labelIds?: string[];
  }>,
  id?: string,
) => {
  const builder = new TaskBuilder();
  if (overrides?.title) builder.withTitle(overrides.title);
  if (overrides?.description !== undefined) builder.withDescription(overrides.description);
  if (overrides?.status) builder.withStatus(overrides.status);
  if (overrides?.priority) builder.withPriority(overrides.priority);
  if (overrides?.dueDate) builder.withDueDate(overrides.dueDate);
  if (overrides?.projectId) builder.withProjectId(overrides.projectId);
  if (overrides?.labelIds) builder.withLabelIds(overrides.labelIds);
  return builder.build(id);
};

export const createLabel = (overrides?: Partial<{ name: string; color: string; projectId: string }>, id?: string) => {
  const builder = new LabelBuilder();
  if (overrides?.name) builder.withName(overrides.name);
  if (overrides?.color) builder.withColor(overrides.color);
  if (overrides?.projectId) builder.withProjectId(overrides.projectId);
  return builder.build(id);
};
