import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useRepositories } from '../../data/RepositoriesContext'
import { ResellerFormModal } from './ResellerFormModal'
import type { Reseller } from '../../data/types'

export function ResellersPage() {
  const navigate = useNavigate()
  const { resellers } = useRepositories()
  const [list, setList] = useState<Reseller[]>([])
  const [formTarget, setFormTarget] = useState<Reseller | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reseller | null>(null)

  function reload() {
    resellers.list().then(setList)
  }

  useEffect(reload, [resellers])

  return (
    <AppShell
      title="Revendeurs"
      action={
        <Button className="!min-h-9 !px-3" onClick={() => setFormTarget('new')}>
          + Ajouter
        </Button>
      }
    >
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-brand-700 dark:text-brand-300">
        ‹ Retour
      </button>

      {formTarget && (
        <ResellerFormModal
          existing={formTarget !== 'new' ? formTarget : undefined}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null)
            reload()
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer le revendeur"
          message={`Supprimer ${deleteTarget.name} ?`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await resellers.remove(deleteTarget.id!)
            setDeleteTarget(null)
            reload()
          }}
        />
      )}

      <ul className="space-y-3">
        {list.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{r.name}</p>
                <p className="text-xs text-gray-500">
                  {r.country} ·{' '}
                  {r.deliversToSwitzerland === 'oui'
                    ? 'livre en Suisse'
                    : r.deliversToSwitzerland === 'non'
                      ? 'ne livre pas en Suisse'
                      : 'livraison Suisse à confirmer'}
                </p>
                {r.notes && <p className="mt-1 text-xs text-gray-400">{r.notes}</p>}
              </div>
              <a href={r.url} target="_blank" rel="noreferrer noopener" className="text-sm text-brand-700 dark:text-brand-300">
                Voir ↗
              </a>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" className="!min-h-9 !px-3 !text-xs" onClick={() => setFormTarget(r)}>
                ✏️ Modifier
              </Button>
              <Button variant="ghost" className="!min-h-9 !px-3 !text-xs text-red-600" onClick={() => setDeleteTarget(r)}>
                🗑️ Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </ul>
    </AppShell>
  )
}
