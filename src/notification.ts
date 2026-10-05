import type { Category, EventType, UserId } from './events.js';

let nextId = 1;

/**
 * The PDF says a Notification class is "provided", but it is not in the PDF.
 * This is our own stand-in. To use the real one, only the constructor call in notificationService.ts changes.
 */
export class Notification {
  readonly id: number;
  readonly createdAt = new Date();

  constructor(
    readonly userId: UserId,
    readonly type: EventType,
    readonly category: Category,
    readonly message: string,
  ) {
    this.id = nextId++;
  }
}
