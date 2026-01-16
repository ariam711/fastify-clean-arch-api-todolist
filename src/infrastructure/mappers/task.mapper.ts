import { Task, type TaskProps } from '@domain/entities/task.entity.js';
import type { TaskPriority, TaskStatus } from '@domain/types/index.js';
import type { Document, WithId } from 'mongodb';

export interface TaskDocument extends Document {
  _id: string;
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

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper pattern
export class TaskMapper {
  static toDocument(task: Task): TaskDocument {
    return {
      _id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      labelIds: task.labelIds,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  static toDomain(doc: WithId<TaskDocument>): Task {
    const props: TaskProps = {
      title: doc.title,
      description: doc.description,
      status: doc.status,
      priority: doc.priority,
      dueDate: doc.dueDate,
      projectId: doc.projectId,
      labelIds: doc.labelIds,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return Task.reconstitute(props, doc._id);
  }
}
