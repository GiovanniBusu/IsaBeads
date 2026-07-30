import { db } from '../db'
import type { InventoryItem } from '../types'
import { nowIso } from '../../utils/format'
import type { InventoryRepository, InventoryWithStock } from './types'

async function withStock(item: InventoryItem): Promise<InventoryWithStock> {
  const purchases = await db.purchases.where('inventoryItemId').equals(item.id!).toArray()
  const consumptions = await db.consumptions.where('inventoryItemId').equals(item.id!).toArray()
  const totalPurchasedGrams = purchases.reduce((sum, p) => sum + p.grams, 0)
  const totalConsumedGrams = consumptions.reduce((sum, c) => sum + c.grams, 0)
  const lastPurchaseDate = purchases
    .map((p) => p.date)
    .sort()
    .at(-1)
  return {
    ...item,
    totalPurchasedGrams,
    remainingGrams: Math.max(0, totalPurchasedGrams - totalConsumedGrams),
    lastPurchaseDate,
  }
}

export const dexieInventoryRepository: InventoryRepository = {
  async list() {
    const items = await db.inventoryItems.toArray()
    return Promise.all(items.map(withStock))
  },

  async get(id) {
    const item = await db.inventoryItems.get(id)
    if (!item) return undefined
    return withStock(item)
  },

  async create(item, initialPurchase) {
    const timestamp = nowIso()
    const id = await db.inventoryItems.add({
      ...item,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as InventoryItem)
    if (initialPurchase && initialPurchase.grams > 0) {
      await db.purchases.add({
        inventoryItemId: id,
        date: timestamp,
        grams: initialPurchase.grams,
        price: initialPurchase.price,
        supplier: item.supplier,
        productUrl: item.productUrl,
      })
    }
    return id
  },

  async update(id, patch) {
    await db.inventoryItems.update(id, { ...patch, updatedAt: nowIso() })
  },

  async remove(id) {
    await db.transaction('rw', db.inventoryItems, db.purchases, db.consumptions, async () => {
      await db.purchases.where('inventoryItemId').equals(id).delete()
      await db.consumptions.where('inventoryItemId').equals(id).delete()
      await db.inventoryItems.delete(id)
    })
  },

  async addPurchase(purchase) {
    const id = await db.purchases.add(purchase)
    await db.inventoryItems.update(purchase.inventoryItemId, { updatedAt: nowIso() })
    return id
  },

  async listPurchases(inventoryItemId) {
    const purchases = await db.purchases.where('inventoryItemId').equals(inventoryItemId).toArray()
    return purchases.sort((a, b) => b.date.localeCompare(a.date))
  },

  async deductStock(inventoryItemId, grams, realizationId) {
    await db.consumptions.add({ inventoryItemId, realizationId, grams })
    await db.inventoryItems.update(inventoryItemId, { updatedAt: nowIso() })
  },

  async findByDbCodeAndSize(dbCode, size) {
    const item = await db.inventoryItems.where({ dbCode, size }).first()
    if (!item) return undefined
    return withStock(item)
  },
}
