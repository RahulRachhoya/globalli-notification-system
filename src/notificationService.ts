import type { EventBus, GameEvent } from './events.js';
import type { NotificationChannel } from './channels.js';
import type { PreferenceStore } from './preferences.js';
import { Notification } from './notification.js';
import { templateFor } from './templates.js';

export type Outcome =
  | { status: 'sent'; notification: Notification }
  | { status: 'skipped'; reason: string };

/**
 * Subscribes to the bus and turns each event into a notification:
 * template → shouldNotify → recipient → preference check → new Notification → every channel.
 */
export class NotificationService {
  constructor(
    bus: EventBus,
    private preferences: PreferenceStore,
    private channels: NotificationChannel[],
    private log: (line: string) => void = console.log,
  ) {
    bus.subscribe((event) => this.handle(event));
  }

  handle(event: GameEvent): Outcome {
    const template = templateFor(event);

    if (template.shouldNotify && !template.shouldNotify(event)) {
      return this.skip(`${event.type} not worth a notification (e.g. item not rare)`);
    }

    const userId = template.recipient(event);
    if (!this.preferences.isEnabled(userId, template.category)) {
      return this.skip(`user ${userId} disabled ${template.category}`);
    }

    const notification = new Notification(userId, event.type, template.category, template.message(event));
    for (const channel of this.channels) {
      try {
        channel.send(notification);
      } catch (err) {
        // One broken channel must not block the others or later events.
        this.log(`  [error] channel ${channel.name} failed: ${(err as Error).message}`);
      }
    }
    return { status: 'sent', notification };
  }

  private skip(reason: string): Outcome {
    this.log(`  skipped: ${reason}`);
    return { status: 'skipped', reason };
  }
}
