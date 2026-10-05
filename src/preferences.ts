import type { Category, UserId } from './events.js';

/** Per-user on/off switch per category. A missing entry means "on". */
export class PreferenceStore {
  private prefs = new Map<UserId, Map<Category, boolean>>();

  isEnabled(userId: UserId, category: Category): boolean {
    return this.prefs.get(userId)?.get(category) ?? true;
  }

  set(userId: UserId, category: Category, enabled: boolean): void {
    if (!this.prefs.has(userId)) this.prefs.set(userId, new Map());
    this.prefs.get(userId)!.set(category, enabled);
  }
}
