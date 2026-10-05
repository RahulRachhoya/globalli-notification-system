# Globalli — Real-Time Notification System

A small, in-process notification system for a gaming platform. Game and social events are published on an event bus; a notification service turns each one into a `Notification`, checks the player's preferences, and sends it through the in-app channel (a mock of the game client).

## Run it

Requirements: Node.js 20.6 or newer (the test script uses `node --import`).

```bash
npm install
npm start      # runs the demo (src/demo.ts)
npm test       # runs the tests (node:test)
npm run typecheck   # optional: strict TypeScript check
```

No runtime dependencies. Dev dependencies only: `typescript`, `tsx`, `@types/node`.

## Features

- **In-game events:** level up, item acquired (rare, epic and legendary only), challenge completed, PvP defeat (the optional one).
- **Social events:** friend request, friend request accepted, new follower.
- **In-app channel**, mocked: each user has an inbox and every delivery is logged.
- **Clear messages**, e.g. `Congratulations! You've reached level 15!`, `You've acquired the legendary Sword of Azeroth!`, `Player 'Carol' has sent you a friend request.`
- **Per-user preferences** per category (`GAME`, `SOCIAL`), stored in a map. Default is on.
- **Fault isolation:** if one channel throws, the others still receive the notification and later events still flow.
- **Example usage** (`npm start`) runs the four triggers from the challenge exactly as written, then the other event types, a common item that is filtered out, a user turning off social notifications, and finally each user's inbox.

### Who gets notified

| Call | Recipient | Message |
|---|---|---|
| `gameEngine.playerLeveledUp(1, 15)` | user 1 | Congratulations! You've reached level 15! |
| `gameEngine.itemAcquired(2, "SwordOfAzeroth")` | user 2 | You've acquired the legendary Sword of Azeroth! |
| `socialSystem.friendRequestSent(3, 1)` | user 1 (the receiver) | Player 'Carol' has sent you a friend request. |
| `socialSystem.friendRequestAccepted(1, 3)` | user 3 (who sent the request) | Player 'Alice' accepted your friend request. |
| `socialSystem.followed(4, 2)` | user 2 | Player 'Dave' started following you. |

## Architecture

```
GameEngine  ─┐                                        ┌─> PreferenceStore  (Map<userId, Map<Category, boolean>>)
             ├─ publish(event) ─> EventBus ─> NotificationService ─┤
SocialSystem ┘                                        │   uses templates   └─> NotificationChannel[] ─> InAppChannel (mock client)
```

For each event the service does: find the template → `shouldNotify` filter → recipient → preference check → `new Notification` → send on every channel.

| File | Role |
|---|---|
| `src/events.ts` | `GameEvent` discriminated union, `Category`, `EventBus` (wraps Node's `EventEmitter`) |
| `src/producers.ts` | `GameEngine` and `SocialSystem`: the simulated platform parts. They only publish events |
| `src/notification.ts` | `Notification` class (see note below) |
| `src/catalog.ts` | mock lookups for player names and items with rarity |
| `src/templates.ts` | one row per event type: category, recipient, message, optional filter |
| `src/preferences.ts` | `PreferenceStore` |
| `src/channels.ts` | `NotificationChannel` interface and `InAppChannel` |
| `src/notificationService.ts` | the pipeline above |
| `src/demo.ts` | example usage |
| `test/notification.test.ts` | tests |

### Note on the `Notification` class

The challenge says a `Notification` class is provided, but it is not included in the PDF. `src/notification.ts` is my own version with the fields the system needs (`id`, `userId`, `type`, `category`, `message`, `createdAt`). Swapping in the official class only changes the one `new Notification(...)` call in `notificationService.ts`.

## Design decisions

- **Publish/subscribe (observer) through an event bus.** The game engine and social system do not know notifications exist. Another consumer (achievements, analytics) can subscribe without touching them; the demo's event logger is exactly that.
- **Strategy for channels.** `NotificationChannel` is a one-method interface. Push or email is one new class added to the channel list.
- **Template table instead of a switch.** Each event type has one row in `templates.ts`. The table's type is a mapped type over the event union, so the compiler fails if an event type has no row.
- **Typed events (discriminated union).** Each event carries exactly the fields it needs, checked at compile time.

## Tradeoffs and limits

- **In-process, synchronous bus.** Simple and deterministic, which suits a demo and tests. One process only, and events are lost if it crashes. At scale: a broker (Kafka, Redis Streams, SQS), consumer groups, idempotency by event id.
- **Preferences per category,** as the challenge asks. Per event type or per channel is one more map key.
- **No storage.** Notifications live in memory. Real system: store first, then deliver; read/unread state; replay missed ones when the player reconnects.
- **Messages in code.** Fine for one language. Next step: templates keyed by locale.

## Out of scope

Client display, push, email, database, UI (as the challenge states).

## How this was built

See [AI_PROCESS.md](AI_PROCESS.md) for the AI tools, prompts and steps, and [docs/plan.md](docs/plan.md) for the plan written before coding.
