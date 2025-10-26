import { events, tables } from '@/livestore/schema'
import { queryDb } from '@livestore/livestore'
import { useQuery, useStore } from '@livestore/react'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$projectId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = useParams({ from: '/$projectId' })

  const bboxes = useQuery(
    queryDb(
      () => {
        return tables.bboxes.where({
          projectId,
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
  const { projectId } = useParams({ from: '/$projectId' })
  const { store } = useStore()

  const onBboxCreated = (x: number, y: number, width: number, height: number) =>
    store.commit(
      events.bboxCreated({
        id: crypto.randomUUID(),
        projectId,
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
