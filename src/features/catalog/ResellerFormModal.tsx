import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, Select, TextArea, TextInput } from '../../components/ui/Field'
import { useRepositories } from '../../data/RepositoriesContext'
import type { DeliverySwitzerland, Reseller } from '../../data/types'

export function ResellerFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Reseller
  onClose: () => void
  onSaved: () => void
}) {
  const { resellers } = useRepositories()
  const [name, setName] = useState(existing?.name ?? '')
  const [url, setUrl] = useState(existing?.url ?? '')
  const [country, setCountry] = useState(existing?.country ?? '')
  const [delivers, setDelivers] = useState<DeliverySwitzerland>(existing?.deliversToSwitzerland ?? 'à confirmer')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      setError('Le nom et le lien du site sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const payload = { name: name.trim(), url: url.trim(), country: country.trim(), deliversToSwitzerland: delivers, notes: notes.trim() || undefined }
      if (existing?.id) {
        await resellers.update(existing.id, payload)
      } else {
        await resellers.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={existing ? 'Modifier le revendeur' : 'Nouveau revendeur'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Site web" required>
          <TextInput type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pays">
            <TextInput value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
          <Field label="Livraison Suisse">
            <Select value={delivers} onChange={(e) => setDelivers(e.target.value as DeliverySwitzerland)}>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
              <option value="à confirmer">À confirmer</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes" hint="frais de port, délais, minimum de commande…">
          <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
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
