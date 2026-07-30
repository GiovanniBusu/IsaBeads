import { createContext, useContext, type ReactNode } from 'react'
import { localRepositories } from './repositories/localRepositories'
import type { Repositories } from './repositories/types'

const RepositoriesContext = createContext<Repositories>(localRepositories)

export function RepositoriesProvider({
  repositories = localRepositories,
  children,
}: {
  repositories?: Repositories
  children: ReactNode
}) {
  return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
}

export function useRepositories(): Repositories {
  return useContext(RepositoriesContext)
}
