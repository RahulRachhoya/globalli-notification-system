import type { UserId } from './events.js';

// Mock lookups standing in for the player and item services.

const players = new Map<UserId, string>([
  [1, 'Alice'],
  [2, 'Bob'],
  [3, 'Carol'],
  [4, 'Dave'],
]);

export function playerName(id: UserId): string {
  return players.get(id) ?? `Player ${id}`;
}

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];
export type Item = { name: string; rarity: Rarity };

const items = new Map<string, Item>([
  ['SwordOfAzeroth', { name: 'Sword of Azeroth', rarity: 'legendary' }],
  ['DragonScaleShield', { name: 'Dragon Scale Shield', rarity: 'epic' }],
  ['RustyDagger', { name: 'Rusty Dagger', rarity: 'common' }],
]);

export function item(id: string): Item {
  return items.get(id) ?? { name: id, rarity: 'common' };
}

export function isRareOrBetter(rarity: Rarity): boolean {
  return RARITIES.indexOf(rarity) >= RARITIES.indexOf('rare');
}
