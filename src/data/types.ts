export const BEAD_SIZES = ['15/0', '11/0', '10/0', '8/0'] as const
export type BeadSize = (typeof BEAD_SIZES)[number]

/** Correspondance taille <-> préfixe officiel Miyuki Delica */
export const DELICA_SIZE_PREFIX: Record<BeadSize, string> = {
  '15/0': 'DBS',
  '11/0': 'DB',
  '10/0': 'DBM',
  '8/0': 'DBL',
}

export const BEAD_FINISHES = [
  'Opaque',
  'Transparent',
  'Translucide',
  'Nacré (Pearl)',
  'AB',
  'Galvanisé',
  'Métallique',
  'Luster',
  'Duracoat',
  'Givré (Matte)',
  'Doublé argent',
  'Doublé or',
  'Autre',
] as const
export type BeadFinish = (typeof BEAD_FINISHES)[number]

export interface InventoryItem {
  id: number
  dbCode: string
  colorName: string
  size: BeadSize
  finish?: string
  supplier?: string
  productUrl?: string
  lowStockThresholdGrams: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Purchase {
  id: number
  inventoryItemId: number
  date: string
  grams: number
  price?: number
  supplier?: string
  productUrl?: string
  note?: string
}

export interface Consumption {
  id: number
  inventoryItemId: number
  realizationId: number
  grams: number
}

export interface CatalogColor {
  id: number
  dbCode: string
  colorName: string
  size: BeadSize
  finish?: string
}

export type DeliverySwitzerland = 'oui' | 'non' | 'à confirmer'

export interface Reseller {
  id: number
  name: string
  url: string
  country: string
  deliversToSwitzerland: DeliverySwitzerland
  notes?: string
}

export type BeadUnit = 'grammes' | 'perles'

export interface ProjectBeadLine {
  id: string
  dbCode: string
  colorName?: string
  size: BeadSize
  unit: BeadUnit
  quantity: number
}

export interface Project {
  id: number
  name: string
  description?: string
  photo?: string
  lengthCm: number
  beadLines: ProjectBeadLine[]
  createdAt: string
  updatedAt: string
}

export interface ProjectRealization {
  id: number
  projectId: number
  date: string
  lengthCm: number
  note?: string
}

export interface RealizationNeedLine extends ProjectBeadLine {
  neededGrams: number
  availableGrams: number
  missingGrams: number
  inventoryItemId?: number
}

export interface AppSettingsMap {
  lowStockThresholdDefaultGrams: number
  beadsPerGram: Record<BeadSize, number>
  catalogMeta: {
    source: 'sample-demo' | 'imported'
    importedAt?: string
    rowCount?: number
  }
}

export const DEFAULT_BEADS_PER_GRAM: Record<BeadSize, number> = {
  '15/0': 45,
  '11/0': 20,
  '10/0': 17,
  '8/0': 10,
}

export const DEFAULT_SETTINGS: AppSettingsMap = {
  lowStockThresholdDefaultGrams: 5,
  beadsPerGram: DEFAULT_BEADS_PER_GRAM,
  catalogMeta: { source: 'sample-demo' },
}
