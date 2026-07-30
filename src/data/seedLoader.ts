import { db } from './db'
import catalogSeed from './seed/miyukiDelicaCatalog.seed.json'
import resellersSeed from './seed/resellers.seed.json'
import type { CatalogColor, DeliverySwitzerland } from './types'
import { dexieSettingsRepository } from './repositories/dexieSettingsRepository'

let seedingPromise: Promise<void> | null = null

/**
 * Peuple le catalogue et les revendeurs au premier lancement (tables vides).
 * Mémorisé dans un module-singleton car React StrictMode invoque les effets
 * deux fois en développement : sans ce cache, deux bulkAdd concurrents sur
 * les mêmes lignes violeraient l'index unique (dbCode+size).
 */
export function ensureSeeded(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = seed()
  }
  return seedingPromise
}

async function seed(): Promise<void> {
  const [catalogCount, resellerCount] = await Promise.all([db.catalogColors.count(), db.resellers.count()])

  if (catalogCount === 0) {
    await db.catalogColors.bulkAdd(catalogSeed.colors as CatalogColor[])
    await dexieSettingsRepository.update({
      catalogMeta: {
        source: catalogSeed.meta.source as 'sample-demo' | 'imported',
        importedAt: 'importedAt' in catalogSeed.meta ? (catalogSeed.meta as { importedAt?: string }).importedAt : undefined,
        rowCount: catalogSeed.colors.length,
      },
    })
  }

  if (resellerCount === 0) {
    await db.resellers.bulkAdd(
      resellersSeed.map((r) => ({ ...r, deliversToSwitzerland: r.deliversToSwitzerland as DeliverySwitzerland })),
    )
  }
}
