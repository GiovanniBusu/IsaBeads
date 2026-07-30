import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 pt-safe backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        {action}
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  )
}
