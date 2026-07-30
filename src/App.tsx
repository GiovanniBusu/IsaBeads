import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ensureSeeded } from './data/seedLoader'
import { InventoryListPage } from './features/inventory/InventoryListPage'
import { CatalogListPage } from './features/catalog/CatalogListPage'
import { ColorDetailPage } from './features/catalog/ColorDetailPage'
import { ResellersPage } from './features/catalog/ResellersPage'
import { ProjectsListPage } from './features/projects/ProjectsListPage'
import { ProjectFormPage } from './features/projects/ProjectFormPage'
import { ProjectDetailPage } from './features/projects/ProjectDetailPage'
import { SettingsPage } from './features/settings/SettingsPage'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeeded().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50 text-gray-500 dark:bg-gray-950">
        Chargement…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<InventoryListPage />} />
      <Route path="/catalogue" element={<CatalogListPage />} />
      <Route path="/catalogue/revendeurs" element={<ResellersPage />} />
      <Route path="/catalogue/:dbCode/:sizeSlug" element={<ColorDetailPage />} />
      <Route path="/projets" element={<ProjectsListPage />} />
      <Route path="/projets/nouveau" element={<ProjectFormPage />} />
      <Route path="/projets/:id" element={<ProjectDetailPage />} />
      <Route path="/projets/:id/modifier" element={<ProjectFormPage />} />
      <Route path="/reglages" element={<SettingsPage />} />
    </Routes>
  )
}

export default App
