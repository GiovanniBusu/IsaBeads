import { useEffect, useRef, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useRepositories } from '../../data/RepositoriesContext'
import { BEAD_SIZES, type AppSettingsMap } from '../../data/types'
import type { BackupBundle } from '../../data/repositories/types'

export function SettingsPage() {
  const { settings, backup } = useRepositories()
  const [current, setCurrent] = useState<AppSettingsMap | null>(null)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    settings.getAll().then(setCurrent)
  }, [settings])

  async function persist(patch: Partial<AppSettingsMap>) {
    await settings.update(patch)
    const refreshed = await settings.getAll()
    setCurrent(refreshed)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const bundle = await backup.exportAll()
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `isabeads-sauvegarde-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleConfirmImport() {
    if (!importFile) return
    try {
      const text = await importFile.text()
      const bundle = JSON.parse(text) as BackupBundle
      await backup.importAll(bundle)
      window.location.reload()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Fichier de sauvegarde invalide.')
      setImportFile(null)
    }
  }

  if (!current) {
    return (
      <AppShell title="Réglages">
        <p className="text-sm text-gray-500">Chargement…</p>
      </AppShell>
    )
  }

  return (
    <AppShell title="Réglages">
      {importFile && (
        <ConfirmDialog
          title="Restaurer une sauvegarde"
          message="Cela remplace TOUTES les données actuelles (stock, catalogue, revendeurs, projets) par celles du fichier importé. Cette action est irréversible."
          confirmLabel="Restaurer"
          danger
          onCancel={() => setImportFile(null)}
          onConfirm={handleConfirmImport}
        />
      )}

      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Alerte de stock bas</h2>
      <Card className="mb-4">
        <Field label="Seuil par défaut (g)" hint="utilisé pour les nouvelles références">
          <TextInput
            type="number"
            min="0"
            step="0.5"
            value={current.lowStockThresholdDefaultGrams}
            onChange={(e) => persist({ lowStockThresholdDefaultGrams: Number(e.target.value) })}
          />
        </Field>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Conversion grammes ↔ perles
      </h2>
      <Card className="mb-4">
        <p className="mb-3 text-xs text-gray-500">
          Valeurs approximatives (nombre de perles par gramme), modifiables selon vos propres pesées.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {BEAD_SIZES.map((size) => (
            <Field key={size} label={size}>
              <TextInput
                type="number"
                min="1"
                step="1"
                value={current.beadsPerGram[size]}
                onChange={(e) =>
                  persist({ beadsPerGram: { ...current.beadsPerGram, [size]: Number(e.target.value) } })
                }
              />
            </Field>
          ))}
        </div>
      </Card>

      {saved && <p className="mb-4 text-xs font-medium text-green-700">Enregistré ✓</p>}

      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Sauvegarde des données</h2>
      <Card className="mb-4 space-y-3">
        <div>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? 'Export…' : '⬇️ Exporter toutes mes données (JSON)'}
          </Button>
          <p className="mt-1 text-xs text-gray-500">
            Téléchargez une sauvegarde complète (stock, catalogue, revendeurs, projets) pour changer de téléphone
            ou faire une copie de secours.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆️ Importer une sauvegarde
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              setImportError(null)
              setImportFile(e.target.files?.[0] ?? null)
            }}
          />
          <p className="mt-1 text-xs text-gray-500">Remplace toutes les données actuelles par celles du fichier.</p>
          {importError && <p className="mt-1 text-xs text-red-600">{importError}</p>}
        </div>
      </Card>

      <p className="text-center text-xs text-gray-400">
        IsaBeads · données stockées localement sur cet appareil (IndexedDB)
      </p>
    </AppShell>
  )
}
