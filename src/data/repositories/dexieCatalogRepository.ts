import { db } from '../db'
import type { CatalogColor } from '../types'
import type { CatalogRepository } from './types'

export const dexieCatalogRepository: CatalogRepository = {
  async list() {
    return db.catalogColors.toArray()
  },

  async search({ text, size, finish }) {
    let results = await db.catalogColors.toArray()
    if (size) {
      results = results.filter((c) => c.size === size)
    }
    if (finish) {
      results = results.filter((c) => c.finish === finish)
    }
    if (text && text.trim()) {
      const needle = text.trim().toLowerCase()
      results = results.filter(
        (c) => c.colorName.toLowerCase().includes(needle) || c.dbCode.toLowerCase().includes(needle),
      )
    }
    return results.sort((a, b) => a.dbCode.localeCompare(b.dbCode))
  },

  async replaceAll(colors: CatalogColor[]) {
    await db.transaction('rw', db.catalogColors, async () => {
      await db.catalogColors.clear()
      await db.catalogColors.bulkAdd(colors)
    })
  },
}
