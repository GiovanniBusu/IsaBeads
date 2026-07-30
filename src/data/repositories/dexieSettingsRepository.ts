import { db } from '../db'
import { DEFAULT_SETTINGS, type AppSettingsMap } from '../types'
import type { SettingsRepository } from './types'

const SETTINGS_KEY = 'app'

export const dexieSettingsRepository: SettingsRepository = {
  async getAll() {
    const row = await db.settings.get(SETTINGS_KEY)
    if (!row) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(row.value as Partial<AppSettingsMap>) }
  },

  async update(patch) {
    const current = await this.getAll()
    const merged: AppSettingsMap = {
      ...current,
      ...patch,
      beadsPerGram: { ...current.beadsPerGram, ...patch.beadsPerGram },
      catalogMeta: { ...current.catalogMeta, ...patch.catalogMeta },
    }
    await db.settings.put({ key: SETTINGS_KEY, value: merged })
  },
}
