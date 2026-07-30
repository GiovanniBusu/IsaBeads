import Dexie, { type EntityTable } from 'dexie'
import type {
  CatalogColor,
  Consumption,
  InventoryItem,
  Project,
  ProjectRealization,
  Purchase,
  Reseller,
} from './types'

export interface SettingRow {
  key: string
  value: unknown
}

export class IsaBeadsDatabase extends Dexie {
  inventoryItems!: EntityTable<InventoryItem, 'id'>
  purchases!: EntityTable<Purchase, 'id'>
  consumptions!: EntityTable<Consumption, 'id'>
  catalogColors!: EntityTable<CatalogColor, 'id'>
  resellers!: EntityTable<Reseller, 'id'>
  projects!: EntityTable<Project, 'id'>
  realizations!: EntityTable<ProjectRealization, 'id'>
  settings!: EntityTable<SettingRow, 'key'>

  constructor() {
    super('isabeads')
    this.version(1).stores({
      inventoryItems: '++id, dbCode, size, colorName, [dbCode+size]',
      purchases: '++id, inventoryItemId, date',
      consumptions: '++id, inventoryItemId, realizationId',
      catalogColors: '++id, &[dbCode+size], dbCode, size, finish, colorName',
      resellers: '++id, name',
      projects: '++id, name, createdAt',
      realizations: '++id, projectId, date',
      settings: 'key',
    })
  }
}

export const db = new IsaBeadsDatabase()
