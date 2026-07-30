import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Select, TextArea, TextInput } from '../../components/ui/Field'
import { useRepositories } from '../../data/RepositoriesContext'
import { BEAD_SIZES, type BeadSize, type BeadUnit, type ProjectBeadLine } from '../../data/types'
import { resizeImageToDataUrl } from '../../utils/image'

function newLine(): ProjectBeadLine {
  return { id: crypto.randomUUID(), dbCode: '', colorName: '', size: '11/0', unit: 'grammes', quantity: 0 }
}

export function ProjectFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { projects } = useRepositories()

  const [loading, setLoading] = useState(isEdit)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [lengthCm, setLengthCm] = useState(18)
  const [lines, setLines] = useState<ProjectBeadLine[]>([newLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    projects.get(Number(id)).then((p) => {
      if (!p) return
      setName(p.name)
      setDescription(p.description ?? '')
      setPhoto(p.photo)
      setLengthCm(p.lengthCm)
      setLines(p.beadLines.length > 0 ? p.beadLines : [newLine()])
      setLoading(false)
    })
  }, [id, projects])

  function updateLine(lineId: string, patch: Partial<ProjectBeadLine>) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)))
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhoto(await resizeImageToDataUrl(file))
    } catch {
      setError("Impossible de charger cette image.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire.')
      return
    }
    if (!lengthCm || lengthCm <= 0) {
      setError('La longueur doit être supérieure à 0.')
      return
    }
    const cleanLines = lines.filter((l) => l.dbCode.trim() && l.quantity > 0)
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        photo,
        lengthCm: Number(lengthCm),
        beadLines: cleanLines,
      }
      if (isEdit) {
        await projects.update(Number(id), payload)
        navigate(`/projets/${id}`)
      } else {
        const newId = await projects.create(payload)
        navigate(`/projets/${newId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Projet">
        <p className="text-sm text-gray-500">Chargement…</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Modifier le projet' : 'Nouveau projet'}>
      <form className="space-y-5 pb-6" onSubmit={handleSubmit}>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-2xl dark:bg-gray-800">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : '📷'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <p className="text-xs text-gray-500">Photo optionnelle, stockée localement sur cet appareil.</p>
          </div>
          <div className="space-y-4">
            <Field label="Nom du projet" required>
              <TextInput
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bracelet Rivière bleu"
              />
            </Field>
            <Field label="Description" hint="optionnel">
              <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Longueur (cm)" required hint="permet le recalcul proportionnel des quantités">
              <TextInput
                type="number"
                min="0"
                step="0.5"
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value))}
              />
            </Field>
          </div>
        </Card>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Perles nécessaires</h2>
            <Button
              type="button"
              variant="secondary"
              className="!min-h-9 !px-3 !text-xs"
              onClick={() => setLines((prev) => [...prev, newLine()])}
            >
              + Ligne
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => (
              <Card key={line.id}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Code Miyuki">
                    <TextInput
                      value={line.dbCode}
                      onChange={(e) => updateLine(line.id, { dbCode: e.target.value })}
                      placeholder="DB0010"
                    />
                  </Field>
                  <Field label="Taille">
                    <Select value={line.size} onChange={(e) => updateLine(line.id, { size: e.target.value as BeadSize })}>
                      {BEAD_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-2">
                  <Field label="Nom de couleur" hint="optionnel">
                    <TextInput
                      value={line.colorName ?? ''}
                      onChange={(e) => updateLine(line.id, { colorName: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Quantité">
                    <TextInput
                      type="number"
                      min="0"
                      step="0.1"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Unité">
                    <Select value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as BeadUnit })}>
                      <option value="grammes">Grammes</option>
                      <option value="perles">Nombre de perles</option>
                    </Select>
                  </Field>
                </div>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    🗑️ Retirer cette ligne
                  </button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer le projet'}
        </Button>
      </form>
    </AppShell>
  )
}
