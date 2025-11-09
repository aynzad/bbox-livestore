import { getAuthUser, isAuthUserAuthenticated } from '@/store/authUser.store'
import { workspaceStoreOptions } from '@/store/workspace/workspace.store'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ErrorFallback } from '@/components/errorFallback/ErrorFallback'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { StoreRegistryProvider } from '@livestore/react/experimental'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_auth/projects')({
  loader: ({ context }) => {
    const authUser = getAuthUser()
    if (!authUser || !authUser.token) {
      throw redirect({
        to: '/login',
      })
    }

    context.storeRegistry.preload(workspaceStoreOptions(authUser.token))
  },
  beforeLoad: () => {
    if (!isAuthUserAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: ProjectsPage,
})

function ProjectsPage() {
  const { storeRegistry } = Route.useRouteContext()

  return (
    <StoreRegistryProvider storeRegistry={storeRegistry}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<ProjectsPageSkeleton />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </StoreRegistryProvider>
  )
}

function ProjectsPageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 flex-1" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
