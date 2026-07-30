import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-xl sm:max-w-lg sm:rounded-3xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
