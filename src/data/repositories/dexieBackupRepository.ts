import { db } from '../db'
import { nowIso } from '../../utils/format'
import { dexieSettingsRepository } from './dexieSettingsRepository'
import type { BackupBundle, BackupRepository } from './types'

export const dexieBackupRepository: BackupRepository = {
  async exportAll() {
    const [inventoryItems, purchases, catalogColors, resellers, projects, realizations, consumptions, settings] =
      await Promise.all([
        db.inventoryItems.toArray(),
        db.purchases.toArray(),
        db.catalogColors.toArray(),
        db.resellers.toArray(),
        db.projects.toArray(),
        db.realizations.toArray(),
        db.consumptions.toArray(),
        dexieSettingsRepository.getAll(),
      ])

    const bundle: BackupBundle = {
      version: 1,
      exportedAt: nowIso(),
      inventoryItems,
      purchases,
      catalogColors,
      resellers,
      projects,
      realizations,
      consumptions,
      settings,
    }
    return bundle
  },

  async importAll(bundle) {
    if (bundle.version !== 1) {
      throw new Error(`Version de sauvegarde non prise en charge : ${bundle.version}`)
    }
    await db.transaction(
      'rw',
      [db.inventoryItems, db.purchases, db.catalogColors, db.resellers, db.projects, db.realizations, db.consumptions, db.settings],
      async () => {
        await Promise.all([
          db.inventoryItems.clear(),
          db.purchases.clear(),
          db.catalogColors.clear(),
          db.resellers.clear(),
          db.projects.clear(),
          db.realizations.clear(),
          db.consumptions.clear(),
        ])
        await Promise.all([
          db.inventoryItems.bulkPut(bundle.inventoryItems),
          db.purchases.bulkPut(bundle.purchases),
          db.catalogColors.bulkPut(bundle.catalogColors),
          db.resellers.bulkPut(bundle.resellers),
          db.projects.bulkPut(bundle.projects),
          db.realizations.bulkPut(bundle.realizations),
          db.consumptions.bulkPut(bundle.consumptions),
        ])
        await db.settings.put({ key: 'app', value: bundle.settings })
      },
    )
  },
}
