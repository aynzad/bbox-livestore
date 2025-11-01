import { ErrorFallback } from '@/components/ErrorFallback'
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

export const Route = createFileRoute('/projects/$projectId')({
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
  const { projectId } = useParams({ from: '/projects/$projectId' })
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

  return (
    <div>
      <AddBboxForm />
      <h2 className="text-2xl font-bold mt-10">Bounding Boxes:</h2>
      <div className="flex flex-col gap-2">
        {bboxes.map((bbox) => (
          <div
            key={bbox.id}
            className="flex flex-row gap-2 items-center border-b border-gray-200 p-4 rounded-2xl"
          >
            <div>x: {bbox.x}</div>
            <div>y: {bbox.y}</div>
            <div>width: {bbox.width}</div>
            <div>height: {bbox.height}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddBboxForm() {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const user = useAuthUser()!

  const projectStore = useStore(projectStoreOptions(projectId, user.token))

  const onBboxCreated = (x: number, y: number, width: number, height: number) =>
    projectStore.commit(
      projectSchema.events.createBbox({
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      }),
    )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement

    const formData = new FormData(form)
    const x = formData.get('x') as string
    const y = formData.get('y') as string
    const width = formData.get('width') as string
    const height = formData.get('height') as string

    if (!x || !y || !width || !height) {
      return
    }

    onBboxCreated(Number(x), Number(y), Number(width), Number(height))

    form.reset()
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h3 className="text-2xl font-bold mt-10">Add Bounding Box:</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="text" name="x" placeholder="X" />
        <input type="text" name="y" placeholder="Y" />
        <input type="text" name="width" placeholder="Width" />
        <input type="text" name="height" placeholder="Height" />
        <button type="submit">Add Bounding Box</button>
      </form>
    </div>
  )
}
