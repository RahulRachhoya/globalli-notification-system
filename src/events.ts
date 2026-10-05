import { EventEmitter } from 'node:events';

export type UserId = number;

/** Every event the platform can publish. Adding a member here forces a matching template (see templates.ts). */
export type GameEvent =
  | { type: 'LEVEL_UP'; userId: UserId; level: number }
  | { type: 'ITEM_ACQUIRED'; userId: UserId; itemId: string }
  | { type: 'CHALLENGE_COMPLETED'; userId: UserId; challenge: string }
  | { type: 'PVP_DEFEATED'; userId: UserId; attackerId: UserId }
  | { type: 'FRIEND_REQUEST'; fromId: UserId; toId: UserId }
  | { type: 'FRIEND_ACCEPTED'; accepterId: UserId; requesterId: UserId }
  | { type: 'NEW_FOLLOWER'; followerId: UserId; followeeId: UserId };

export type EventType = GameEvent['type'];
export type Category = 'GAME' | 'SOCIAL';

const TOPIC = 'event';

/** In-process publish/subscribe bus. Producers publish, consumers subscribe; neither knows the other. */
export class EventBus {
  private emitter = new EventEmitter();

  publish(event: GameEvent): void {
    this.emitter.emit(TOPIC, event);
  }

  subscribe(handler: (event: GameEvent) => void): void {
    this.emitter.on(TOPIC, handler);
  }
}
