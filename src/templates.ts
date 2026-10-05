import type { Category, EventType, GameEvent, UserId } from './events.js';
import { isRareOrBetter, item, playerName } from './catalog.js';

type EventOf<T extends EventType> = Extract<GameEvent, { type: T }>;

export type Template<E extends GameEvent> = {
  category: Category;
  recipient: (e: E) => UserId;
  message: (e: E) => string;
  /** Optional filter. Returns false when the event is not worth a notification. */
  shouldNotify?: (e: E) => boolean;
};

/** One row per event type. The mapped type makes the compiler reject a missing row. */
export const templates: { [T in EventType]: Template<EventOf<T>> } = {
  LEVEL_UP: {
    category: 'GAME',
    recipient: (e) => e.userId,
    message: (e) => `Congratulations! You've reached level ${e.level}!`,
  },
  ITEM_ACQUIRED: {
    category: 'GAME',
    recipient: (e) => e.userId,
    message: (e) => {
      const it = item(e.itemId);
      return `You've acquired the ${it.rarity} ${it.name}!`;
    },
    shouldNotify: (e) => isRareOrBetter(item(e.itemId).rarity),
  },
  CHALLENGE_COMPLETED: {
    category: 'GAME',
    recipient: (e) => e.userId,
    message: (e) => `Challenge complete: '${e.challenge}'. Well played!`,
  },
  PVP_DEFEATED: {
    category: 'GAME',
    recipient: (e) => e.userId,
    message: (e) => `You were defeated by Player '${playerName(e.attackerId)}'.`,
  },
  FRIEND_REQUEST: {
    category: 'SOCIAL',
    recipient: (e) => e.toId,
    message: (e) => `Player '${playerName(e.fromId)}' has sent you a friend request.`,
  },
  FRIEND_ACCEPTED: {
    category: 'SOCIAL',
    recipient: (e) => e.requesterId,
    message: (e) => `Player '${playerName(e.accepterId)}' accepted your friend request.`,
  },
  NEW_FOLLOWER: {
    category: 'SOCIAL',
    recipient: (e) => e.followeeId,
    message: (e) => `Player '${playerName(e.followerId)}' started following you.`,
  },
};

export function templateFor<E extends GameEvent>(event: E): Template<E> {
  return templates[event.type] as unknown as Template<E>;
}
