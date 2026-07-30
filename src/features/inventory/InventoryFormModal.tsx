import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Select, TextArea, TextInput } from '../../components/ui/Field'
import { BEAD_FINISHES, BEAD_SIZES, type BeadSize } from '../../data/types'
import { useRepositories } from '../../data/RepositoriesContext'
import { normalizeDbCode } from '../../utils/format'
import type { InventoryWithStock } from '../../data/repositories/types'

export interface InventoryPrefill {
  dbCode?: string
  colorName?: string
  size?: BeadSize
  finish?: string
}

export function InventoryFormModal({
  existing,
  prefill,
  defaultThreshold,
  onClose,
  onSaved,
}: {
  existing?: InventoryWithStock
  prefill?: InventoryPrefill
  defaultThreshold: number
  onClose: () => void
  onSaved: () => void
}) {
  const { inventory } = useRepositories()
  const [dbCode, setDbCode] = useState(existing?.dbCode ?? prefill?.dbCode ?? '')
  const [colorName, setColorName] = useState(existing?.colorName ?? prefill?.colorName ?? '')
  const [size, setSize] = useState<BeadSize>(existing?.size ?? prefill?.size ?? '11/0')
  const [finish, setFinish] = useState(existing?.finish ?? prefill?.finish ?? '')
  const [supplier, setSupplier] = useState(existing?.supplier ?? '')
  const [productUrl, setProductUrl] = useState(existing?.productUrl ?? '')
  const [threshold, setThreshold] = useState(existing?.lowStockThresholdGrams ?? defaultThreshold)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [initialGrams, setInitialGrams] = useState('')
  const [initialPrice, setInitialPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dbCode.trim() || !colorName.trim()) {
      setError('Le code Miyuki et le nom de couleur sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        dbCode: normalizeDbCode(dbCode),
        colorName: colorName.trim(),
        size,
        finish: finish || undefined,
        supplier: supplier.trim() || undefined,
        productUrl: productUrl.trim() || undefined,
        lowStockThresholdGrams: Number(threshold) || 0,
        notes: notes.trim() || undefined,
      }
      if (existing?.id) {
        await inventory.update(existing.id, payload)
      } else {
        const grams = Number(initialGrams)
        await inventory.create(
          payload,
          grams > 0 ? { grams, price: initialPrice ? Number(initialPrice) : undefined } : undefined,
        )
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={existing ? 'Modifier la référence' : 'Nouvelle référence'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code Miyuki" required>
            <TextInput
              value={dbCode}
              onChange={(e) => setDbCode(e.target.value)}
              placeholder="DB0010"
              autoFocus
            />
          </Field>
          <Field label="Taille" required>
            <Select value={size} onChange={(e) => setSize(e.target.value as BeadSize)}>
              {BEAD_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Nom de la couleur" required>
          <TextInput value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="Noir opaque" />
        </Field>
        <Field label="Finition">
          <Select value={finish} onChange={(e) => setFinish(e.target.value)}>
            <option value="">—</option>
            {BEAD_FINISHES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fournisseur" hint="optionnel">
            <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Perles & Co" />
          </Field>
          <Field label="Seuil d'alerte (g)" hint="stock bas">
            <TextInput
              type="number"
              min="0"
              step="0.5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Lien produit" hint="optionnel">
          <TextInput
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Notes" hint="optionnel">
          <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {!existing && (
          <div className="rounded-xl bg-brand-50 p-3 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Achat initial (optionnel)</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Grammes achetés">
                <TextInput
                  type="number"
                  min="0"
                  step="0.1"
                  value={initialGrams}
                  onChange={(e) => setInitialGrams(e.target.value)}
                  placeholder="5"
                />
              </Field>
              <Field label="Prix payé (CHF)" hint="optionnel">
                <TextInput
                  type="number"
                  min="0"
                  step="0.05"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
