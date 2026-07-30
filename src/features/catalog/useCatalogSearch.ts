import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoriesContext'
import type { AppSettingsMap, CatalogColor } from '../../data/types'

export function useCatalogSearch(query: { text: string; size: string; finish: string }) {
  const { catalog, settings } = useRepositories()
  const [colors, setColors] = useState<CatalogColor[]>([])
  const [appSettings, setAppSettings] = useState<AppSettingsMap | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settings.getAll().then(setAppSettings)
  }, [settings])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    catalog
      .search({ text: query.text, size: query.size || undefined, finish: query.finish || undefined })
      .then((result) => {
        if (!cancelled) {
          setColors(result)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [catalog, query.text, query.size, query.finish])

  return { colors, settings: appSettings, loading }
}
