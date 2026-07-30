import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, TextArea, TextInput } from '../../components/ui/Field'
import { useRepositories } from '../../data/RepositoriesContext'
import { formatGrams, nowIso } from '../../utils/format'
import type { InventoryWithStock } from '../../data/repositories/types'

export function RestockModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryWithStock
  onClose: () => void
  onSaved: () => void
}) {
  const { inventory } = useRepositories()
  const [grams, setGrams] = useState('')
  const [price, setPrice] = useState('')
  const [supplier, setSupplier] = useState(item.supplier ?? '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const gramsNum = Number(grams)
    if (!gramsNum || gramsNum <= 0) {
      setError('Indiquez une quantité en grammes supérieure à 0.')
      return
    }
    setSaving(true)
    try {
      await inventory.addPurchase({
        inventoryItemId: item.id!,
        date: nowIso(),
        grams: gramsNum,
        price: price ? Number(price) : undefined,
        supplier: supplier.trim() || undefined,
        note: note.trim() || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Réapprovisionner ${item.dbCode}`} onClose={onClose}>
      <p className="mb-4 text-sm text-gray-500">
        {item.colorName} · {item.size} · stock actuel {formatGrams(item.remainingGrams)}
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grammes achetés" required>
            <TextInput
              type="number"
              min="0"
              step="0.1"
              autoFocus
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="5"
            />
          </Field>
          <Field label="Prix payé (CHF)" hint="optionnel">
            <TextInput type="number" min="0" step="0.05" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </div>
        <Field label="Fournisseur" hint="optionnel">
          <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Field>
        <Field label="Note" hint="optionnel">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Ajouter au stock'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
