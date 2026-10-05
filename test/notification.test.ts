import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/events.js';
import { InAppChannel, type NotificationChannel } from '../src/channels.js';
import { NotificationService } from '../src/notificationService.js';
import { PreferenceStore } from '../src/preferences.js';
import { GameEngine, SocialSystem } from '../src/producers.js';

const quiet = () => {};

function setup(extraChannels: NotificationChannel[] = []) {
  const bus = new EventBus();
  const preferences = new PreferenceStore();
  const inApp = new InAppChannel(quiet);
  new NotificationService(bus, preferences, [...extraChannels, inApp], quiet);
  return { preferences, inApp, game: new GameEngine(bus), social: new SocialSystem(bus) };
}

const messages = (inApp: InAppChannel, userId: number) => inApp.inbox(userId).map((n) => n.message);

test('the four example triggers reach the right user with the right message', () => {
  const { inApp, game, social } = setup();
  game.playerLeveledUp(1, 15);
  game.itemAcquired(2, 'SwordOfAzeroth');
  social.friendRequestSent(3, 1);
  social.friendRequestAccepted(1, 3);

  assert.deepEqual(messages(inApp, 1), [
    "Congratulations! You've reached level 15!",
    "Player 'Carol' has sent you a friend request.",
  ]);
  assert.deepEqual(messages(inApp, 2), ["You've acquired the legendary Sword of Azeroth!"]);
  assert.deepEqual(messages(inApp, 3), ["Player 'Alice' accepted your friend request."]);
});

test('notifications carry type and category', () => {
  const { inApp, social } = setup();
  social.followed(4, 2);
  const [n] = inApp.inbox(2);
  assert.equal(n.type, 'NEW_FOLLOWER');
  assert.equal(n.category, 'SOCIAL');
  assert.equal(n.message, "Player 'Dave' started following you.");
});

test('a disabled category sends nothing, the other category still arrives', () => {
  const { preferences, inApp, game, social } = setup();
  preferences.set(1, 'SOCIAL', false);
  social.friendRequestSent(3, 1);
  game.playerLeveledUp(1, 15);
  assert.deepEqual(messages(inApp, 1), ["Congratulations! You've reached level 15!"]);

  preferences.set(1, 'SOCIAL', true);
  social.friendRequestSent(3, 1);
  assert.equal(inApp.inbox(1).length, 2);
});

test('common items are filtered out, rare and above are sent', () => {
  const { inApp, game } = setup();
  game.itemAcquired(2, 'RustyDagger');
  game.itemAcquired(2, 'UnknownPebble'); // unknown item defaults to common
  assert.equal(inApp.inbox(2).length, 0);
  game.itemAcquired(2, 'DragonScaleShield');
  game.itemAcquired(2, 'SwordOfAzeroth');
  assert.deepEqual(messages(inApp, 2), [
    "You've acquired the epic Dragon Scale Shield!",
    "You've acquired the legendary Sword of Azeroth!",
  ]);
});

test('a failing channel does not stop other channels or later events', () => {
  const broken: NotificationChannel = {
    name: 'broken',
    send() {
      throw new Error('boom');
    },
  };
  const { inApp, game } = setup([broken]);
  game.playerLeveledUp(1, 15);
  game.playerLeveledUp(1, 16);
  assert.deepEqual(messages(inApp, 1), [
    "Congratulations! You've reached level 15!",
    "Congratulations! You've reached level 16!",
  ]);
});
