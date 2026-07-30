import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select, TextInput } from '../../components/ui/Field'
import { BEAD_FINISHES, BEAD_SIZES } from '../../data/types'
import { sizeToSlug } from '../../utils/format'
import { useCatalogSearch } from './useCatalogSearch'

export function CatalogListPage() {
  const [text, setText] = useState('')
  const [size, setSize] = useState('')
  const [finish, setFinish] = useState('')
  const { colors, settings, loading } = useCatalogSearch({ text, size, finish })

  const isSample = settings?.catalogMeta.source === 'sample-demo'

  return (
    <AppShell
      title="Catalogue Delica"
      action={
        <Link to="/catalogue/revendeurs" className="text-sm font-medium text-brand-700 dark:text-brand-300">
          Revendeurs
        </Link>
      }
    >
      {isSample && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Catalogue d'exemple à but de démonstration — les codes et noms ne sont pas garantis conformes au
          référentiel officiel Miyuki. Importez la vraie charte via <code>scripts/import-catalog.mjs</code> (voir
          README).
        </div>
      )}

      <div className="mb-4 space-y-2">
        <TextInput
          placeholder="Rechercher une couleur ou un code…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={size} onChange={(e) => setSize(e.target.value)} className="flex-1">
            <option value="">Toutes les tailles</option>
            {BEAD_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={finish} onChange={(e) => setFinish(e.target.value)} className="flex-1">
            <option value="">Toutes les finitions</option>
            {BEAD_FINISHES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : colors.length === 0 ? (
        <EmptyState icon="🎨" title="Aucune couleur trouvée" description="Essayez une autre recherche." />
      ) : (
        <ul className="space-y-2">
          {colors.map((c) => (
            <li key={`${c.dbCode}-${c.size}`}>
              <Link to={`/catalogue/${c.dbCode}/${sizeToSlug(c.size)}`}>
                <Card className="flex items-center justify-between !py-3">
                  <div>
                    <p className="font-mono text-xs text-gray-400">
                      {c.dbCode} · {c.size}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{c.colorName}</p>
                    {c.finish && <p className="text-xs text-gray-500">{c.finish}</p>}
                  </div>
                  <span className="text-gray-300">›</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
