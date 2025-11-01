import { useAuthUser } from '@/store/authUser.store'
import projectsSchema from '@/store/projects/projects.schema'
import { projectsStoreOptions } from '@/store/projects/projects.store'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react/experimental'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/')({
  component: App,
})

function App() {
  const user = useAuthUser()!
  const projectsStore = useStore(projectsStoreOptions(user.token))
  const userProjects = projectsStore.useQuery(
    queryDb(
      projectsSchema.tables.projectsUsers
        .select('projectId')
        .where('userId', '=', user.id),
      { label: 'userProjects' },
    ),
  )

  const projects = projectsStore.useQuery(
    queryDb(
      projectsSchema.tables.projects.where(
        'id',
        'IN',
        userProjects as any, // IN operator requires string[] but types are not inferred correctly
      ),
      { label: 'visibleProjects', deps: userProjects },
    ),
  )

  return (
    <div>
      <Link to="/projects/new">New Project</Link>

      <h2 className="text-2xl font-bold mt-10">Projects</h2>
      <div className="flex flex-col gap-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            to="/projects/$projectId"
            params={{ projectId: project.id }}
          >
            {project.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
