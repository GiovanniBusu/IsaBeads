import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select, TextInput } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useInventory } from './useInventory'
import { InventoryFormModal, type InventoryPrefill } from './InventoryFormModal'
import { RestockModal } from './RestockModal'
import { PurchaseHistoryModal } from './PurchaseHistoryModal'
import { BEAD_SIZES } from '../../data/types'
import { useRepositories } from '../../data/RepositoriesContext'
import { formatGrams } from '../../utils/format'
import type { InventoryWithStock } from '../../data/repositories/types'

type SortKey = 'colorName' | 'size' | 'remainingGrams'

type FormState = { existing?: InventoryWithStock; prefill?: InventoryPrefill } | null

export function InventoryListPage() {
  const location = useLocation()
  const { items, settings, loading, reload } = useInventory()
  const { inventory } = useRepositories()

  const [search, setSearch] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('colorName')

  const incomingPrefill = (location.state as { prefill?: InventoryPrefill } | null)?.prefill
  const [formState, setFormState] = useState<FormState>(incomingPrefill ? { prefill: incomingPrefill } : null)
  const [restockTarget, setRestockTarget] = useState<InventoryWithStock | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InventoryWithStock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryWithStock | null>(null)

  const filtered = useMemo(() => {
    let list = items
    if (search.trim()) {
      const needle = search.trim().toLowerCase()
      list = list.filter(
        (i) => i.colorName.toLowerCase().includes(needle) || i.dbCode.toLowerCase().includes(needle),
      )
    }
    if (sizeFilter) list = list.filter((i) => i.size === sizeFilter)
    if (lowOnly) list = list.filter((i) => i.remainingGrams <= i.lowStockThresholdGrams)
    return [...list].sort((a, b) => {
      if (sortKey === 'remainingGrams') return a.remainingGrams - b.remainingGrams
      if (sortKey === 'size') return a.size.localeCompare(b.size)
      return a.colorName.localeCompare(b.colorName)
    })
  }, [items, search, sizeFilter, lowOnly, sortKey])

  const lowStockCount = items.filter((i) => i.remainingGrams <= i.lowStockThresholdGrams).length

  return (
    <AppShell
      title="Mon stock"
      action={
        <Button onClick={() => setFormState({})} className="!min-h-9 !px-3">
          + Ajouter
        </Button>
      }
    >
      {formState && (
        <InventoryFormModal
          existing={formState.existing}
          prefill={formState.prefill}
          defaultThreshold={settings?.lowStockThresholdDefaultGrams ?? 5}
          onClose={() => {
            setFormState(null)
            window.history.replaceState({}, '')
          }}
          onSaved={() => {
            setFormState(null)
            window.history.replaceState({}, '')
            reload()
          }}
        />
      )}
      {restockTarget && (
        <RestockModal
          item={restockTarget}
          onClose={() => setRestockTarget(null)}
          onSaved={() => {
            setRestockTarget(null)
            reload()
          }}
        />
      )}
      {historyTarget && <PurchaseHistoryModal item={historyTarget} onClose={() => setHistoryTarget(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer la référence"
          message={`Supprimer ${deleteTarget.dbCode} — ${deleteTarget.colorName} et tout son historique d'achats ?`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await inventory.remove(deleteTarget.id!)
            setDeleteTarget(null)
            reload()
          }}
        />
      )}

      <div className="mb-4 space-y-2">
        <TextInput
          placeholder="Rechercher une couleur ou un code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="flex-1">
            <option value="">Toutes les tailles</option>
            {BEAD_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="flex-1">
            <option value="colorName">Trier : couleur</option>
            <option value="size">Trier : taille</option>
            <option value="remainingGrams">Trier : stock restant</option>
          </Select>
        </div>
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${
            lowOnly ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
          }`}
        >
          ⚠️ Stock bas uniquement {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧵"
          title={items.length === 0 ? 'Aucune perle en stock' : 'Aucun résultat'}
          description={
            items.length === 0
              ? "Ajoutez votre première référence Miyuki Delica pour commencer à suivre votre stock."
              : 'Essayez une autre recherche ou réinitialisez les filtres.'
          }
          action={
            items.length === 0 ? <Button onClick={() => setFormState({})}>+ Ajouter une référence</Button> : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const isLow = item.remainingGrams <= item.lowStockThresholdGrams
            return (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-gray-400">
                      {item.dbCode} · {item.size}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.colorName}</p>
                    {item.finish && <p className="text-xs text-gray-500">{item.finish}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatGrams(item.remainingGrams)}
                    </p>
                    {isLow && <p className="text-xs font-medium text-red-500">Stock bas</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="!min-h-9 !px-3 !text-xs" onClick={() => setRestockTarget(item)}>
                    ➕ Réapprovisionner
                  </Button>
                  <Button variant="ghost" className="!min-h-9 !px-3 !text-xs" onClick={() => setHistoryTarget(item)}>
                    🧾 Historique
                  </Button>
                  <Button variant="ghost" className="!min-h-9 !px-3 !text-xs" onClick={() => setFormState({ existing: item })}>
                    ✏️ Modifier
                  </Button>
                  <Button variant="ghost" className="!min-h-9 !px-3 !text-xs text-red-600" onClick={() => setDeleteTarget(item)}>
                    🗑️
                  </Button>
                </div>
              </Card>
            )
          })}
        </ul>
      )}
    </AppShell>
  )
}
