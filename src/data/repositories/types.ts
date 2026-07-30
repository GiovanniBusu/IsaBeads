import type {
  AppSettingsMap,
  CatalogColor,
  InventoryItem,
  Project,
  ProjectRealization,
  Purchase,
  RealizationNeedLine,
  Reseller,
} from '../types'

/**
 * Contrats d'accès aux données. L'implémentation par défaut (Dexie/IndexedDB,
 * voir dexieRepositories.ts) est 100% locale. Une future implémentation
 * Supabase pourra respecter ces mêmes interfaces sans changer les écrans.
 */

export interface InventoryWithStock extends InventoryItem {
  totalPurchasedGrams: number
  remainingGrams: number
  lastPurchaseDate?: string
}

export interface InventoryRepository {
  list(): Promise<InventoryWithStock[]>
  get(id: number): Promise<InventoryWithStock | undefined>
  create(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>, initialPurchase?: { grams: number; price?: number }): Promise<number>
  update(id: number, patch: Partial<Omit<InventoryItem, 'id'>>): Promise<void>
  remove(id: number): Promise<void>
  addPurchase(purchase: Omit<Purchase, 'id'>): Promise<number>
  listPurchases(inventoryItemId: number): Promise<Purchase[]>
  deductStock(inventoryItemId: number, grams: number, realizationId: number): Promise<void>
  findByDbCodeAndSize(dbCode: string, size: InventoryItem['size']): Promise<InventoryWithStock | undefined>
}

export interface CatalogRepository {
  list(): Promise<CatalogColor[]>
  search(query: { text?: string; size?: string; finish?: string }): Promise<CatalogColor[]>
  replaceAll(colors: CatalogColor[]): Promise<void>
}

export interface ResellerRepository {
  list(): Promise<Reseller[]>
  create(reseller: Omit<Reseller, 'id'>): Promise<number>
  update(id: number, patch: Partial<Omit<Reseller, 'id'>>): Promise<void>
  remove(id: number): Promise<void>
}

export interface ProjectRepository {
  list(): Promise<Project[]>
  get(id: number): Promise<Project | undefined>
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>
  update(id: number, patch: Partial<Omit<Project, 'id'>>): Promise<void>
  remove(id: number): Promise<void>
  listRealizations(projectId: number): Promise<ProjectRealization[]>
  computeNeeds(project: Project, lengthCm: number): Promise<RealizationNeedLine[]>
  realize(project: Project, lengthCm: number, note?: string): Promise<number>
}

export interface SettingsRepository {
  getAll(): Promise<AppSettingsMap>
  update(patch: Partial<AppSettingsMap>): Promise<void>
}

export interface BackupBundle {
  version: 1
  exportedAt: string
  inventoryItems: InventoryItem[]
  purchases: Purchase[]
  catalogColors: CatalogColor[]
  resellers: Reseller[]
  projects: Project[]
  realizations: ProjectRealization[]
  consumptions: { id?: number; inventoryItemId: number; realizationId: number; grams: number }[]
  settings: AppSettingsMap
}

export interface BackupRepository {
  exportAll(): Promise<BackupBundle>
  importAll(bundle: BackupBundle): Promise<void>
}

export interface Repositories {
  inventory: InventoryRepository
  catalog: CatalogRepository
  resellers: ResellerRepository
  projects: ProjectRepository
  settings: SettingsRepository
  backup: BackupRepository
}
