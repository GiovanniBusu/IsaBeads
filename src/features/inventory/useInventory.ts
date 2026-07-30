import { useCallback, useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoriesContext'
import type { AppSettingsMap } from '../../data/types'
import type { InventoryWithStock } from '../../data/repositories/types'

export function useInventory() {
  const { inventory, settings } = useRepositories()
  const [items, setItems] = useState<InventoryWithStock[]>([])
  const [appSettings, setAppSettings] = useState<AppSettingsMap | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const [list, s] = await Promise.all([inventory.list(), settings.getAll()])
    setItems(list.sort((a, b) => a.dbCode.localeCompare(b.dbCode) || a.size.localeCompare(b.size)))
    setAppSettings(s)
    setLoading(false)
  }, [inventory, settings])

  useEffect(() => {
    reload()
  }, [reload])

  return { items, settings: appSettings, loading, reload }
}
