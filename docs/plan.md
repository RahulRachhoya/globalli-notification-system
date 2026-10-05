# Plan — Globalli coding challenge: real-time notification system

Source: `C:\Users\Lucifer\Downloads\Coding Challenge.pdf` (3 pages; `Coding Challenge (1).pdf` is an identical copy).

## 1. What the PDF asks for

Must have
- In-game events: Level Up, Item Acquired (rare/valuable only), Challenge Completed. PvP attacked/defeated is optional.
- Social events: Friend Request, Friend Accepted, New Follower.
- One channel only: in-app. The client that shows it is mocked.
- Clear messages, e.g. "Congratulations! You've reached level 15!", "You've acquired the legendary Sword of Azeroth!", "Player 'X' has sent you a friend request."
- Per-user on/off per category ("Game Events", "Social Events"), a plain map is enough.
- Use the provided `Notification` class. **It is not in the PDF** — ask the HR contact for it.
- Events come from separate parts of the platform (game engine, social system) and reach the notification system through an event mechanism.
- Pipeline: work out type → build `Notification` → check preferences → send.
- Example usage that runs the 4 triggers from page 3.

Deliverables
- Public GitHub repo that builds and runs with the scripts provided.
- `README.md`: how to run, features.
- AI-use record: prompts, process, tools. Interview part 1 is about this.
- Be ready to defend the design: patterns, tradeoffs, "what if we add X". Interview part 2.

Out of scope: client display, push, email, a database, a UI.

## 2. Stack (default; change if the role names one)

TypeScript on Node 20+. Only dev dependencies (`typescript`, `tsx`). No runtime dependencies.
- `npm install && npm start` runs the demo.
- `npm test` runs `node:test` tests.
- Reason: interfaces and union types make the design easy to read, and setup is one command. Java + Gradle wrapper or C# + `dotnet run` work the same way with the same design.

## 3. Architecture

```
GameEngine ─┐                         ┌─> PreferenceStore (Map<userId, Map<Category,bool>>)
            ├─ publish(event) ─> EventBus ─> NotificationService ─┤
SocialSystem┘                         │      uses templates     └─> NotificationChannel[] ─> InAppChannel (mock client)
```

Patterns, and why each one is there
- **Publish/subscribe (observer) through an EventBus** — producers do not know notifications exist. A new consumer (achievements, analytics) subscribes without touching the game code. Node's built-in `EventEmitter` is enough.
- **Strategy for channels** — the `NotificationChannel` interface. The PDF itself mentions push and email later; each becomes one new class.
- **Template map** (event type → category, recipient, message) — one table instead of a switch spread over the code. A new event type = one union member + one table row.
- **Typed events** (discriminated union) — the compiler reports any event type that has no template.

Components (one file each, `src/`)
| File | Holds |
|---|---|
| `events.ts` | `GameEvent` union: `LEVEL_UP{userId,level}`, `ITEM_ACQUIRED{userId,itemId}`, `CHALLENGE_COMPLETED{userId,challenge}`, `PVP_DEFEATED{userId,attackerId}`, `FRIEND_REQUEST{fromId,toId}`, `FRIEND_ACCEPTED{accepterId,requesterId}`, `NEW_FOLLOWER{followerId,followeeId}`; `Category = 'GAME' \| 'SOCIAL'`; `EventBus` |
| `producers.ts` | `GameEngine` (`playerLeveledUp`, `itemAcquired`, `challengeCompleted`, `playerDefeated`) and `SocialSystem` (`friendRequestSent`, `friendRequestAccepted`, `followed`) — the method names match the PDF, each only publishes an event |
| `notification.ts` | `Notification` (`id`, `userId`, `type`, `category`, `message`, `createdAt`). Swap in the provided class when HR sends it; only the constructor call in the service changes |
| `catalog.ts` | small lookups: player names (`1 → 'Alice'`, missing → `Player 3`), items (`SwordOfAzeroth → {name:'Sword of Azeroth', rarity:'legendary'}`, missing → common) |
| `templates.ts` | per event type: `category`, `recipient(e)`, `message(e)`, optional `shouldNotify(e)` (items: rare and above only) |
| `preferences.ts` | `PreferenceStore`: `isEnabled(userId, category)` (default on), `set(userId, category, on)` |
| `channels.ts` | `NotificationChannel` interface + `InAppChannel` (keeps a per-user inbox array and logs `[in-app → user 3] ...`) |
| `notificationService.ts` | subscribes to the bus. For each event: template → `shouldNotify` → recipient → preference check → `new Notification` → `channel.send`. Errors from one channel are caught and logged, so they do not stop other channels or later events |
| `demo.ts` | example usage (below) |

Recipient rules (easy to get wrong)
- `friendRequestSent(3, 1)` → notify **user 1**: "Player 'Carol' has sent you a friend request."
- `friendRequestAccepted(1, 3)` → notify **user 3** (the one who sent the request): "Player 'Alice' accepted your friend request."
- `followed(4, 2)` → notify user 2: "Player 'Dave' started following you."

## 4. Demo script (`npm start`)

1. Run the 4 PDF triggers exactly as written. Print each event and the notification it produced.
2. Extras: challenge completed, new follower, PvP defeat, a common item (shows "no notification: not rare").
3. User 1 turns off SOCIAL, then gets another friend request → prints "skipped: user 1 disabled SOCIAL".
4. Print each user's in-app inbox at the end.

## 5. Tests (`test/notification.test.ts`, `node:test`)

- Each of the 4 PDF triggers → right recipient and exact message.
- Category off → nothing sent; the other category still arrives.
- Common item → nothing sent; legendary item → sent.
- A channel that throws → the other channel still gets the notification, and the next event still works.

## 6. Repo docs

- `README.md`: requirements, `npm install`, `npm start`, `npm test`; feature list; architecture diagram; design decisions and tradeoffs; what is out of scope.
- `AI_PROCESS.md`: tools used, the prompts in order (requirements → plan → code → tests → review), what the AI got wrong and how it was fixed, how the result was checked. Write it **as the work happens**, not afterwards.

## 7. Build order (≈ 4–5 hours)

| # | Step | Done when |
|---|---|---|
| 1 | Repo setup: `package.json`, `tsconfig.json`, scripts, `.gitignore` | `npm start` prints hello |
| 2 | `events.ts`, `notification.ts`, `catalog.ts` | compiles |
| 3 | `templates.ts`, `preferences.ts`, `channels.ts` | compiles |
| 4 | `notificationService.ts` + `producers.ts` | the 4 PDF triggers print the right messages |
| 5 | `demo.ts` full script | section 4 output |
| 6 | tests | `npm test` green |
| 7 | README + AI_PROCESS | a fresh clone runs from README alone |
| 8 | Fresh-clone check, push to a public GitHub repo | clone → install → start → test all pass |

## 8. Tradeoffs to defend in the interview

- In-process, synchronous bus: simple and deterministic for a demo. One process only, events lost on crash. Upgrade: Kafka / Redis Streams / SQS, consumers in a group, idempotent by event id.
- Preferences per category, not per event type: the PDF asks for this. Per type is a second map key.
- No storage: notifications live in memory. Upgrade: save first, then deliver; mark read; deliver missed ones when the player reconnects.
- Messages in code: fine for one language. Upgrade: templates keyed by locale.

## 9. "What if…" answers to prepare

- Add email/push → a new `NotificationChannel`; preferences become `(category, channel)`.
- Add a new event (guild invite) → one union member, one template row, one producer method.
- 10M players → bus becomes a broker, in-app channel becomes a WebSocket gateway with sticky sessions, preferences in a DB with a cache.
- Spam (50 followers in a minute) → rate limit or batch per user: "Dave and 49 others followed you".
- Quiet hours / do-not-disturb → one more check next to the preference check.
- Duplicate events → dedupe by event id.

## 10. Open questions

1. Language — TypeScript assumed. Does the job post name one?
2. The "provided" `Notification` class is not in the PDF — ask HR. Until then use our own, same field names.
3. Optional stretch, only after everything above: a small WebSocket server + HTML page that shows notifications live.
