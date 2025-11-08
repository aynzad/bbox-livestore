import { ErrorFallback } from '@/components/errorFallback/ErrorFallback'
import { Editor } from '@/components/editor'
import {
  getAuthUser,
  isAuthUserAuthenticated,
  useAuthUser,
} from '@/store/authUser.store'
import projectSchema from '@/store/project/project.schema'
import { projectStoreOptions } from '@/store/project/project.store'
import projectsSchema from '@/store/projects/projects.schema'
import { projectsStoreOptions } from '@/store/projects/projects.store'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react/experimental'
import { StoreRegistryProvider } from '@livestore/react/experimental'
import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
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

    await context.storeRegistry.preload(
      projectStoreOptions(params.projectId, authUser.token),
    )

    const projectsStore = await context.storeRegistry.getOrLoad(
      projectsStoreOptions(authUser.token),
    )

    const projectUser = projectsStore.query(
      projectsSchema.tables.projectsUsers.where({
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
  beforeLoad: () => {
    if (!isAuthUserAuthenticated()) {
      throw redirect({
        to: '/login',
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
        <Suspense fallback={<div className="loading">Loading store…</div>}>
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
