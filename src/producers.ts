import type { EventBus, UserId } from './events.js';

// Simulated platform parts. They only publish events and know nothing about notifications.

export class GameEngine {
  constructor(private bus: EventBus) {}

  playerLeveledUp(userId: UserId, level: number): void {
    this.bus.publish({ type: 'LEVEL_UP', userId, level });
  }

  itemAcquired(userId: UserId, itemId: string): void {
    this.bus.publish({ type: 'ITEM_ACQUIRED', userId, itemId });
  }

  challengeCompleted(userId: UserId, challenge: string): void {
    this.bus.publish({ type: 'CHALLENGE_COMPLETED', userId, challenge });
  }

  playerDefeated(userId: UserId, attackerId: UserId): void {
    this.bus.publish({ type: 'PVP_DEFEATED', userId, attackerId });
  }
}

export class SocialSystem {
  constructor(private bus: EventBus) {}

  friendRequestSent(fromId: UserId, toId: UserId): void {
    this.bus.publish({ type: 'FRIEND_REQUEST', fromId, toId });
  }

  friendRequestAccepted(accepterId: UserId, requesterId: UserId): void {
    this.bus.publish({ type: 'FRIEND_ACCEPTED', accepterId, requesterId });
  }

  followed(followerId: UserId, followeeId: UserId): void {
    this.bus.publish({ type: 'NEW_FOLLOWER', followerId, followeeId });
  }
}
