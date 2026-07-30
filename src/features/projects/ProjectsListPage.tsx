import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useRepositories } from '../../data/RepositoriesContext'
import type { Project } from '../../data/types'

export function ProjectsListPage() {
  const { projects } = useRepositories()
  const [list, setList] = useState<Project[] | null>(null)

  useEffect(() => {
    projects.list().then(setList)
  }, [projects])

  return (
    <AppShell
      title="Mes projets"
      action={
        <Link to="/projets/nouveau">
          <Button className="!min-h-9 !px-3">+ Créer</Button>
        </Link>
      }
    >
      {!list ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon="📿"
          title="Aucun projet"
          description="Créez une recette réutilisable (bracelet, collier…) avec sa liste de perles."
          action={
            <Link to="/projets/nouveau">
              <Button>+ Créer un projet</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link to={`/projets/${p.id}`}>
                <Card className="flex items-center gap-3 !py-3">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-2xl dark:bg-gray-800">
                      📿
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.lengthCm} cm · {p.beadLines.length} couleur{p.beadLines.length > 1 ? 's' : ''}
                    </p>
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
