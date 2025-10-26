import { events } from '@/livestore/schema'
import { useStore } from '@livestore/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { store } = useStore()
  const navigate = useNavigate()

  const onProjectCreated = (name: string) =>
    store.commit(
      events.projectCreated({
        id: crypto.randomUUID(),
        name: name,
      }),
    )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const name = formData.get('name') as string

    if (!name) {
      return
    }

    onProjectCreated(name)
    navigate({ to: '/' })
  }
  return (
    <div className="flex flex-col items-center mt-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="text" name="name" placeholder="Project Name" />
        <button type="submit">Create Project</button>
      </form>
    </div>
  )
}
