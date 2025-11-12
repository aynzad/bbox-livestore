import { ErrorFallback } from '@/components/errorFallback/ErrorFallback'
import { Editor } from '@/components/editor'
import { getAuthUser, useAuthUser } from '@/store/authUser.store'
import projectSchema from '@/store/project/project.schema'
import { projectStoreOptions } from '@/store/project/project.store'
import workspaceSchema from '@/store/workspace/workspace.schema'
import { workspaceStoreOptions } from '@/store/workspace/workspace.store'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react/experimental'
import { StoreRegistryProvider } from '@livestore/react/experimental'
import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

export const Route = createFileRoute('/_auth/projects/$projectId')({
  loader: async ({ context, params }) => {
    const authUser = getAuthUser()
    if (!authUser || !authUser.token) {
      throw redirect({
        to: '/login',
      })
    }

    context.storeRegistry.preload(
      projectStoreOptions(params.projectId, authUser.token),
    )
  },
  beforeLoad: async ({ context, params }) => {
    const authUser = getAuthUser()

    if (!authUser || !authUser.token) {
      throw redirect({
        to: '/login',
      })
    }

    const workspaceStore = await context.storeRegistry.getOrLoad(
      workspaceStoreOptions(authUser.token),
    )

    const projectUser = workspaceStore.query(
      workspaceSchema.tables.projectsUsers.where({
        projectId: params.projectId,
        userId: authUser.id,
      }),
    )

    if (!projectUser || projectUser.length === 0) {
      throw redirect({
        to: '/projects',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { storeRegistry } = Route.useRouteContext()

  return (
    <StoreRegistryProvider storeRegistry={storeRegistry}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<ProjectEditorSkeleton />}>
          <InnerComponent />
        </Suspense>
      </ErrorBoundary>
    </StoreRegistryProvider>
  )
}

function InnerComponent() {
  const { projectId } = useParams({ from: '/_auth/projects/$projectId' })
  const user = useAuthUser()!
  const projectStore = useStore(projectStoreOptions(projectId, user.token))

  const bboxes = projectStore.useQuery(
    queryDb(
      () => {
        return projectSchema.tables.bboxes.where({
          deletedAt: null,
        })
      },
      { label: `visibleBboxes-${projectId}`, deps: [projectId] },
    ),
  )

  const handleAdd = (bbox: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    projectStore.commit(
      projectSchema.events.createBbox({
        id: crypto.randomUUID(),
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      }),
    )
  }

  const handleUpdate = (bbox: {
    id: string
    x: number
    y: number
    width: number
    height: number
  }) => {
    projectStore.commit(
      projectSchema.events.updateBbox({
        id: bbox.id,
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        updatedAt: new Date(Date.now()),
      }),
    )
  }

  const handleRemove = (id: string) => {
    projectStore.commit(
      projectSchema.events.deleteBbox({
        id,
        deletedAt: new Date(Date.now()),
      }),
    )
  }

  // Map readonly bboxes to mutable format for Editor
  const editorBboxes = bboxes.map((bbox) => ({
    id: bbox.id,
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
  }))

  return (
    <div className="h-screen flex flex-col">
      <Editor
        bboxes={editorBboxes}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />
    </div>
  )
}

function ProjectEditorSkeleton() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="w-px h-6 mx-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Canvas area skeleton */}
      <div className="flex-1 overflow-hidden bg-muted/20 w-full h-full">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}
