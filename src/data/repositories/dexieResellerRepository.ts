import { db } from '../db'
import type { ResellerRepository } from './types'

export const dexieResellerRepository: ResellerRepository = {
  async list() {
    const resellers = await db.resellers.toArray()
    return resellers.sort((a, b) => a.name.localeCompare(b.name))
  },

  async create(reseller) {
    return db.resellers.add(reseller)
  },

  async update(id, patch) {
    await db.resellers.update(id, patch)
  },

  async remove(id) {
    await db.resellers.delete(id)
  },
}
