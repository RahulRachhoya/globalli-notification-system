import type { UserId } from './events.js';
import type { Notification } from './notification.js';

/** A delivery channel (strategy). Push or email later = one more class implementing this. */
export interface NotificationChannel {
  readonly name: string;
  send(notification: Notification): void;
}

/** Mock of the game client's in-app mechanism: keeps a per-user inbox and logs each delivery. */
export class InAppChannel implements NotificationChannel {
  readonly name = 'in-app';
  private inboxes = new Map<UserId, Notification[]>();

  constructor(private log: (line: string) => void = console.log) {}

  send(n: Notification): void {
    if (!this.inboxes.has(n.userId)) this.inboxes.set(n.userId, []);
    this.inboxes.get(n.userId)!.push(n);
    this.log(`  [in-app → user ${n.userId}] ${n.message}`);
  }

  inbox(userId: UserId): readonly Notification[] {
    return this.inboxes.get(userId) ?? [];
  }

  users(): UserId[] {
    return [...this.inboxes.keys()].sort((a, b) => a - b);
  }
}
