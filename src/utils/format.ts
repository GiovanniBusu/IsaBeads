import { BEAD_SIZES, type BeadSize } from '../data/types'

/**
 * Normalise un code Miyuki Delica en 4 chiffres après le préfixe taille.
 * Exemples : "DB1" -> "DB0001", "db 10" -> "DB0010", "DBM7" -> "DBM0007".
 */
export function normalizeDbCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, '')
  const match = trimmed.match(/^([A-Z]*?)(\d+)$/)
  if (!match) return trimmed
  const [, prefixRaw, digits] = match
  const prefix = prefixRaw || 'DB'
  const padded = digits.padStart(4, '0')
  return `${prefix}${padded}`
}

export function sizeFromPrefix(prefix: string): BeadSize | undefined {
  const p = prefix.toUpperCase()
  if (p === 'DBS') return '15/0'
  if (p === 'DBM') return '10/0'
  if (p === 'DBL') return '8/0'
  if (p === 'DB' || p === '') return '11/0'
  return undefined
}

export function isValidBeadSize(value: string): value is BeadSize {
  return (BEAD_SIZES as readonly string[]).includes(value)
}

export function formatGrams(grams: number): string {
  const rounded = Math.round(grams * 100) / 100
  return `${rounded.toLocaleString('fr-CH', { maximumFractionDigits: 2 })} g`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function sizeToSlug(size: BeadSize): string {
  return size.replace('/', '-')
}

export function slugToSize(slug: string): BeadSize | undefined {
  const candidate = slug.replace('-', '/')
  return isValidBeadSize(candidate) ? candidate : undefined
}
