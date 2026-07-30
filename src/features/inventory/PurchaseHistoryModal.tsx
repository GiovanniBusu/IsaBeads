import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useRepositories } from '../../data/RepositoriesContext'
import { formatDate, formatGrams } from '../../utils/format'
import type { Purchase } from '../../data/types'
import type { InventoryWithStock } from '../../data/repositories/types'

export function PurchaseHistoryModal({ item, onClose }: { item: InventoryWithStock; onClose: () => void }) {
  const { inventory } = useRepositories()
  const [purchases, setPurchases] = useState<Purchase[] | null>(null)

  useEffect(() => {
    inventory.listPurchases(item.id!).then(setPurchases)
  }, [inventory, item.id])

  return (
    <Modal title={`Historique des achats — ${item.dbCode}`} onClose={onClose}>
      {!purchases ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun achat enregistré pour l'instant.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {purchases.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatGrams(p.grams)}</p>
                <p className="text-gray-500">
                  {formatDate(p.date)}
                  {p.supplier ? ` · ${p.supplier}` : ''}
                  {p.price ? ` · ${p.price.toLocaleString('fr-CH')} CHF` : ''}
                </p>
                {p.note && <p className="text-gray-400">{p.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
