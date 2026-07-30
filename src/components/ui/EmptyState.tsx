import type { ReactNode } from 'react'

export function EmptyState({
  icon = '📦',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
      <span className="text-4xl">{icon}</span>
      <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
      {description && <p className="max-w-xs text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  )
}
