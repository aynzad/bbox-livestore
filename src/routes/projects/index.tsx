import { tables } from '@/livestore/schema'
import { queryDb } from '@livestore/livestore'
import { useQuery } from '@livestore/react'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/')({
  component: App,
})

const visibleProjects$ = queryDb(
  () => {
    return tables.projects.where({
      deletedAt: null,
    })
  },
  { label: 'visibleProjects' },
)

function App() {
  const projects = useQuery(visibleProjects$)

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
