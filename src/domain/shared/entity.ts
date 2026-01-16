import { nanoid } from 'nanoid';

export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this._id = id ?? nanoid();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (!(entity instanceof Entity)) {
      return false;
    }
    return this._id === entity._id;
  }
}
