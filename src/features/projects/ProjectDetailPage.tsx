import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useRepositories } from '../../data/RepositoriesContext'
import { formatDate, formatGrams } from '../../utils/format'
import type { Project, ProjectRealization, RealizationNeedLine } from '../../data/types'

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()
  const { projects } = useRepositories()

  const [project, setProject] = useState<Project | null | undefined>(undefined)
  const [realizations, setRealizations] = useState<ProjectRealization[]>([])
  const [targetLength, setTargetLength] = useState<number | null>(null)
  const [needs, setNeeds] = useState<RealizationNeedLine[] | null>(null)
  const [computing, setComputing] = useState(false)
  const [confirmRealize, setConfirmRealize] = useState(false)
  const [realizing, setRealizing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    projects.get(projectId).then((p) => {
      setProject(p ?? null)
      if (p) setTargetLength(p.lengthCm)
    })
    projects.listRealizations(projectId).then(setRealizations)
  }, [projects, projectId])

  useEffect(() => {
    if (!project || targetLength == null) return
    setComputing(true)
    projects.computeNeeds(project, targetLength).then((result) => {
      setNeeds(result)
      setComputing(false)
    })
  }, [project, targetLength, projects])

  async function handleRealize() {
    if (!project || targetLength == null) return
    setRealizing(true)
    try {
      await projects.realize(project, targetLength)
      setConfirmRealize(false)
      setSuccessMessage('Réalisation enregistrée : le stock a été déduit automatiquement.')
      projects.listRealizations(projectId).then(setRealizations)
      const refreshed = await projects.computeNeeds(project, targetLength)
      setNeeds(refreshed)
    } finally {
      setRealizing(false)
    }
  }

  if (project === undefined) {
    return (
      <AppShell title="Projet">
        <p className="text-sm text-gray-500">Chargement…</p>
      </AppShell>
    )
  }
  if (project === null) {
    return (
      <AppShell title="Projet introuvable">
        <p className="text-sm text-gray-500">Ce projet n'existe plus.</p>
      </AppShell>
    )
  }

  const hasMissing = (needs ?? []).some((n) => n.missingGrams > 0)

  return (
    <AppShell title={project.name}>
      <button onClick={() => navigate('/projets')} className="mb-3 text-sm text-brand-700 dark:text-brand-300">
        ‹ Retour aux projets
      </button>

      {deleteConfirm && (
        <ConfirmDialog
          title="Supprimer le projet"
          message={`Supprimer "${project.name}" et son historique de réalisations ? Le stock déjà déduit ne sera pas restauré.`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={async () => {
            await projects.remove(projectId)
            navigate('/projets')
          }}
        />
      )}

      {confirmRealize && (
        <ConfirmDialog
          title="Valider la réalisation"
          message={`Cela déduira automatiquement ${formatGrams(
            (needs ?? []).reduce((sum, n) => sum + Math.min(n.neededGrams, n.availableGrams), 0),
          )} de votre stock (pour les couleurs disponibles). Cette action est difficile à annuler.`}
          confirmLabel={realizing ? 'Validation…' : 'Valider'}
          onCancel={() => setConfirmRealize(false)}
          onConfirm={handleRealize}
        />
      )}

      <Card className="mb-4">
        {project.photo && <img src={project.photo} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
        {project.description && <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{project.description}</p>}
        <p className="text-xs text-gray-500">Longueur de référence : {project.lengthCm} cm</p>
        <div className="mt-3 flex gap-2">
          <Link to={`/projets/${projectId}/modifier`}>
            <Button variant="ghost" className="!min-h-9 !px-3 !text-xs">
              ✏️ Modifier
            </Button>
          </Link>
          <Button variant="ghost" className="!min-h-9 !px-3 !text-xs text-red-600" onClick={() => setDeleteConfirm(true)}>
            🗑️ Supprimer
          </Button>
        </div>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Refaire ce projet</h2>
      <Card className="mb-4">
        <Field label="Longueur souhaitée (cm)" hint="les quantités sont recalculées proportionnellement">
          <TextInput
            type="number"
            min="0"
            step="0.5"
            value={targetLength ?? ''}
            onChange={(e) => setTargetLength(Number(e.target.value))}
          />
        </Field>

        <div className="mt-4 space-y-2">
          {computing || !needs ? (
            <p className="text-sm text-gray-500">Calcul…</p>
          ) : (
            needs.map((n) => (
              <div key={n.id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {n.dbCode} {n.colorName && `· ${n.colorName}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {n.size} · besoin {formatGrams(n.neededGrams)} · disponible {formatGrams(n.availableGrams)}
                  </p>
                </div>
                {n.missingGrams > 0 ? (
                  <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    manque {formatGrams(n.missingGrams)}
                  </span>
                ) : (
                  <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">OK</span>
                )}
              </div>
            ))
          )}
        </div>

        {successMessage && <p className="mt-3 text-sm font-medium text-green-700">{successMessage}</p>}

        <Button
          className="mt-4 w-full"
          disabled={!needs || needs.length === 0}
          onClick={() => setConfirmRealize(true)}
        >
          ✅ Valider la réalisation {hasMissing && '(malgré le manque)'}
        </Button>
      </Card>

      {realizations.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Historique des réalisations</h2>
          <ul className="space-y-2">
            {realizations.map((r) => (
              <Card key={r.id} className="!py-3 text-sm">
                {formatDate(r.date)} · {r.lengthCm} cm
              </Card>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  )
}
