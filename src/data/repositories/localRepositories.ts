import { dexieBackupRepository } from './dexieBackupRepository'
import { dexieCatalogRepository } from './dexieCatalogRepository'
import { dexieInventoryRepository } from './dexieInventoryRepository'
import { dexieProjectRepository } from './dexieProjectRepository'
import { dexieResellerRepository } from './dexieResellerRepository'
import { dexieSettingsRepository } from './dexieSettingsRepository'
import type { Repositories } from './types'

/**
 * Bundle d'implémentations 100% locales (IndexedDB via Dexie). Pour ajouter
 * un mode multi-appareils plus tard, créer un `supabaseRepositories.ts`
 * respectant les mêmes interfaces (voir ./types.ts) et le fournir via
 * <RepositoriesProvider repositories={supabaseRepositories}> sans toucher
 * aux écrans.
 */
export const localRepositories: Repositories = {
  inventory: dexieInventoryRepository,
  catalog: dexieCatalogRepository,
  resellers: dexieResellerRepository,
  projects: dexieProjectRepository,
  settings: dexieSettingsRepository,
  backup: dexieBackupRepository,
}
