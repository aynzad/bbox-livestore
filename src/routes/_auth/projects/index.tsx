import { useState } from 'react'
import { useAuthUser } from '@/store/authUser.store'
import projectsSchema from '@/store/projects/projects.schema'
import { projectsStoreOptions } from '@/store/projects/projects.store'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react/experimental'
import { createFileRoute } from '@tanstack/react-router'
import {
  ProjectCard,
  type ProjectWithCollaborators,
} from '@/components/projectCard/ProjectCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UpsertProjectModal } from '@/components/addProjectModal/UpsertProjectModal'

export const Route = createFileRoute('/_auth/projects/')({
  component: App,
})

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<
    ProjectWithCollaborators | undefined
  >(undefined)
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
      projectsSchema.tables.projects
        .where(
          'id',
          'IN',
          userProjects as any, // IN operator requires string[] but types are not inferred correctly
        )
        .where('deletedAt', '=', null),
      { label: 'visibleProjects', deps: userProjects },
    ),
  )

  const collaborators = projectsStore.useQuery(
    queryDb(
      projectsSchema.tables.projectsUsers.where(
        'projectId',
        'IN',
        userProjects as any,
      ),
      { label: 'collaborators', deps: userProjects },
    ),
  )

  const projectWithCollaborators = projects.map((project) => ({
    ...project,
    collaborators: collaborators.filter(
      (collaborator) => collaborator.projectId === project.id,
    ),
  }))

  const handleCreateProject = () => {
    setEditingProject(undefined)
    setIsModalOpen(true)
  }

  const handleEditProject = (project: ProjectWithCollaborators) => {
    setEditingProject(project)
    setIsModalOpen(true)
  }

  const handleDeleteProject = (projectId: string) => {
    projectsStore.commit(
      projectsSchema.events.deleteProject({
        id: projectId,
        deletedAt: new Date(),
      }),
    )
  }

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingProject(undefined)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and collaborate
          </p>
        </div>
        <Button size="lg" onClick={handleCreateProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started by creating your first project to organize your work.
          </p>
          <Button onClick={handleCreateProject}>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projectWithCollaborators.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      <UpsertProjectModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        project={editingProject}
      />
    </div>
  )
}
