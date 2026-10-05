import { EventBus } from './events.js';
import { InAppChannel } from './channels.js';
import { NotificationService } from './notificationService.js';
import { PreferenceStore } from './preferences.js';
import { GameEngine, SocialSystem } from './producers.js';

// Wiring: producers → bus → notification service → channels.
const bus = new EventBus();
// A second, independent subscriber: it just prints every event, which shows that consumers plug in without touching producers.
bus.subscribe((e) => console.log(`\nevent: ${JSON.stringify(e)}`));

const preferences = new PreferenceStore();
const inApp = new InAppChannel();
new NotificationService(bus, preferences, [inApp]);

const gameEngine = new GameEngine(bus);
const socialSystem = new SocialSystem(bus);

console.log('=== 1. Example triggers from the challenge ===');
gameEngine.playerLeveledUp(1, 15); // User 1 leveled up to 15
gameEngine.itemAcquired(2, 'SwordOfAzeroth'); // User 2 acquired an item
socialSystem.friendRequestSent(3, 1); // User 3 sent a friend request to user 1
socialSystem.friendRequestAccepted(1, 3); // User 1 accepted friend request from 3

console.log('\n=== 2. Other event types ===');
gameEngine.challengeCompleted(2, 'Dragon Slayer');
socialSystem.followed(4, 2);
gameEngine.playerDefeated(3, 4);
gameEngine.itemAcquired(4, 'RustyDagger'); // common item: no notification

console.log('\n=== 3. Preferences: user 1 turns off SOCIAL ===');
preferences.set(1, 'SOCIAL', false);
socialSystem.friendRequestSent(4, 1); // skipped
gameEngine.playerLeveledUp(1, 16); // GAME is still on

console.log('\n=== 4. In-app inbox per user ===');
for (const userId of inApp.users()) {
  console.log(`user ${userId}:`);
  for (const n of inApp.inbox(userId)) console.log(`  #${n.id} [${n.category}] ${n.message}`);
}
