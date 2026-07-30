#!/usr/bin/env node
/**
 * Importe un référentiel de couleurs Miyuki Delica depuis un CSV vers le
 * fichier JSON embarqué utilisé par l'application (src/data/seed/miyukiDelicaCatalog.seed.json).
 *
 * Usage :
 *   node scripts/import-catalog.mjs chemin/vers/chartes.csv
 *   node scripts/import-catalog.mjs chartes-1.csv chartes-2.csv chartes-3.csv
 *
 * Colonnes attendues dans le(s) CSV (insensible à la casse, ordre libre) :
 *   dbCode (ou "code", "db")    -> ex: "DB10", "DB 0010", "DBM7"
 *   colorName (ou "color", "nom", "name")
 *   size (ou "taille")          -> une valeur parmi 15/0, 11/0, 10/0, 8/0
 *                                  (déduite automatiquement du préfixe si absente : DBS=15/0, DB=11/0, DBM=10/0, DBL=8/0)
 *   finish (ou "finition")      -> optionnel (Opaque, Transparent, AB, Galvanisé, ...)
 *
 * Le script normalise chaque code sur 4 chiffres (DB1 -> DB0001), déduit la
 * taille depuis le préfixe quand la colonne "size" est absente, dédoublonne
 * les paires (dbCode, size) identiques, puis écrit le résultat dans le JSON
 * consommé par l'app au démarrage. Relancez-le à chaque nouvelle sortie de
 * couleurs Miyuki, ou pour fusionner plusieurs chartes (une par tranche de
 * 100 codes par exemple).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'seed',
  'miyukiDelicaCatalog.seed.json',
)

const VALID_SIZES = new Set(['15/0', '11/0', '10/0', '8/0'])

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',' || char === ';') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function normalizeHeader(h) {
  return h.trim().toLowerCase()
}

const HEADER_ALIASES = {
  dbCode: ['dbcode', 'code', 'db', 'code db', 'référence', 'reference'],
  colorName: ['colorname', 'color', 'nom', 'name', 'couleur', 'nom de couleur'],
  size: ['size', 'taille'],
  finish: ['finish', 'finition'],
}

function findColumn(headers, key) {
  const aliases = HEADER_ALIASES[key]
  return headers.findIndex((h) => aliases.includes(normalizeHeader(h)))
}

function normalizeDbCode(raw) {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, '')
  const match = trimmed.match(/^([A-Z]*?)(\d+)$/)
  if (!match) return { code: trimmed, prefix: '' }
  const [, prefixRaw, digits] = match
  const prefix = prefixRaw || 'DB'
  return { code: `${prefix}${digits.padStart(4, '0')}`, prefix }
}

function sizeFromPrefix(prefix) {
  const p = prefix.toUpperCase()
  if (p === 'DBS') return '15/0'
  if (p === 'DBM') return '10/0'
  if (p === 'DBL') return '8/0'
  if (p === 'DB' || p === '') return '11/0'
  return undefined
}

function parseFile(filePath) {
  const text = readFileSync(filePath, 'utf-8')
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const headers = rows[0]
  const idx = {
    dbCode: findColumn(headers, 'dbCode'),
    colorName: findColumn(headers, 'colorName'),
    size: findColumn(headers, 'size'),
    finish: findColumn(headers, 'finish'),
  }
  if (idx.dbCode === -1 || idx.colorName === -1) {
    throw new Error(
      `Colonnes "dbCode" et/ou "colorName" introuvables dans ${filePath}. En-têtes lus : ${headers.join(', ')}`,
    )
  }

  const entries = []
  for (const cells of rows.slice(1)) {
    const rawCode = cells[idx.dbCode]?.trim()
    const colorName = cells[idx.colorName]?.trim()
    if (!rawCode || !colorName) continue

    const { code, prefix } = normalizeDbCode(rawCode)
    let size = idx.size !== -1 ? cells[idx.size]?.trim() : undefined
    if (!size || !VALID_SIZES.has(size)) {
      size = sizeFromPrefix(prefix)
    }
    if (!size || !VALID_SIZES.has(size)) {
      console.warn(`Ligne ignorée (taille indéterminée) : ${cells.join(',')}`)
      continue
    }
    const finish = idx.finish !== -1 ? cells[idx.finish]?.trim() || undefined : undefined

    entries.push({ dbCode: code, colorName, size, finish })
  }
  return entries
}

function main() {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    console.error('Usage : node scripts/import-catalog.mjs <fichier1.csv> [fichier2.csv ...]')
    process.exit(1)
  }

  const byKey = new Map()
  for (const file of files) {
    const entries = parseFile(file)
    for (const entry of entries) {
      byKey.set(`${entry.dbCode}__${entry.size}`, entry)
    }
    console.log(`${file} : ${entries.length} lignes lues`)
  }

  const colors = [...byKey.values()].sort((a, b) => a.dbCode.localeCompare(b.dbCode))

  const output = {
    meta: {
      source: 'imported',
      importedAt: new Date().toISOString(),
      rowCount: colors.length,
      sourceFiles: files.map((f) => path.basename(f)),
    },
    colors,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  console.log(`\n✔ ${colors.length} couleurs écrites dans ${path.relative(process.cwd(), OUTPUT_PATH)}`)
}

main()
