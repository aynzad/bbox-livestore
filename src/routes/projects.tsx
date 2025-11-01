import { getAuthUser, isAuthUserAuthenticated } from '@/store/authUser.store'
import { projectsStoreOptions } from '@/store/projects/projects.store'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ErrorFallback } from '@/components/ErrorFallback'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { StoreRegistryProvider } from '@livestore/react/experimental'

export const Route = createFileRoute('/projects')({
  loader: ({ context }) => {
    const authUser = getAuthUser()
    if (!authUser || !authUser.token) {
      throw redirect({
        to: '/login',
      })
    }

    context.storeRegistry.preload(projectsStoreOptions(authUser.token))
  },
  beforeLoad: () => {
    if (!isAuthUserAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => {
    const { storeRegistry } = Route.useRouteContext()

    return (
      <StoreRegistryProvider storeRegistry={storeRegistry}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div className="loading">Loading store…</div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </StoreRegistryProvider>
    )
  },
})
