import projectsSchema from '@/store/projects/projects.schema'
import { useAuthUser } from '@/store/authUser.store'
import { useStore } from '@livestore/react/experimental'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { projectsStoreOptions } from '@/store/projects/projects.store'

export const Route = createFileRoute('/projects/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const user = useAuthUser()!
  const projectsStore = useStore(projectsStoreOptions(user.token))
  const users = projectsStore.useQuery(
    projectsSchema.tables.users.where('id', '!=', user.id),
  )

  const onProjectCreated = (name: string, collaborators: string[]) => {
    projectsStore.commit(
      projectsSchema.events.createProject({
        id: crypto.randomUUID(),
        name: name,
        userId: user.id,
        collaborators: collaborators,
      }),
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const name = formData.get('name') as string
    const collaborators = formData.getAll('collaborators') as string[]

    if (!name) {
      return
    }

    onProjectCreated(name, collaborators)
    navigate({ to: '/projects' })
  }
  return (
    <div className="flex flex-col items-center mt-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="text" name="name" placeholder="Project Name" />
        {users.map((user) => (
          <div key={user.id}>
            <label>
              <input type="checkbox" name="collaborators" value={user.id} />
              {user.name} ({user.email})
            </label>
          </div>
        ))}
        <button type="submit">Create Project</button>
      </form>
    </div>
  )
}
