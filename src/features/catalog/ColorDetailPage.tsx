import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useRepositories } from '../../data/RepositoriesContext'
import { slugToSize } from '../../utils/format'
import type { CatalogColor, Reseller } from '../../data/types'

export function ColorDetailPage() {
  const { dbCode = '', sizeSlug = '' } = useParams()
  const size = slugToSize(sizeSlug)
  const navigate = useNavigate()
  const { catalog, resellers } = useRepositories()
  const [color, setColor] = useState<CatalogColor | null | undefined>(undefined)
  const [resellerList, setResellerList] = useState<Reseller[]>([])

  useEffect(() => {
    catalog.list().then((all) => {
      setColor(all.find((c) => c.dbCode === dbCode && c.size === size) ?? null)
    })
    resellers.list().then(setResellerList)
  }, [catalog, resellers, dbCode, size])

  return (
    <AppShell title={dbCode}>
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-brand-700 dark:text-brand-300">
        ‹ Retour au catalogue
      </button>

      {color === undefined ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : color === null ? (
        <p className="text-sm text-gray-500">Couleur introuvable dans le catalogue.</p>
      ) : (
        <>
          <Card className="mb-4">
            <p className="font-mono text-xs text-gray-400">
              {color.dbCode} · {color.size}
            </p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{color.colorName}</p>
            {color.finish && <p className="text-sm text-gray-500">{color.finish}</p>}
            <Button
              className="mt-4 w-full"
              onClick={() =>
                navigate('/', {
                  state: {
                    prefill: {
                      dbCode: color.dbCode,
                      colorName: color.colorName,
                      size: color.size,
                      finish: color.finish,
                    },
                  },
                })
              }
            >
              + Ajouter à mon inventaire
            </Button>
          </Card>

          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Où l'acheter (vérifier prix &amp; disponibilité)
          </h2>
          <ul className="space-y-2">
            {resellerList.map((r) => (
              <li key={r.id}>
                <Card className="flex items-center justify-between !py-3">
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
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-800"
                  >
                    Voir ↗
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  )
}
