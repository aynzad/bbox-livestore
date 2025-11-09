import { useState } from 'react'
import { useAuthUser } from '@/store/authUser.store'
import workspaceSchema from '@/store/workspace/workspace.schema'
import { workspaceStoreOptions } from '@/store/workspace/workspace.store'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react/experimental'
import { createFileRoute } from '@tanstack/react-router'
import {
  ProjectCard,
  type ProjectWithCollaborators,
} from '@/components/projectCard/ProjectCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, X } from 'lucide-react'
import { UpsertProjectModal } from '@/components/addProjectModal/UpsertProjectModal'

export const Route = createFileRoute('/_auth/projects/')({
  component: App,
})

export const uiStateQuery = queryDb(workspaceSchema.tables.uiState.get(), {
  label: 'uiState',
})

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<
    ProjectWithCollaborators | undefined
  >(undefined)
  const user = useAuthUser()!

  const workspaceStore = useStore(workspaceStoreOptions(user.token))
  const { searchQuery } = workspaceStore.useQuery(uiStateQuery)
  const userProjects = workspaceStore.useQuery(
    queryDb(
      workspaceSchema.tables.projectsUsers
        .select('projectId')
        .where('userId', '=', user.id),
      { label: 'userProjects' },
    ),
  )

  const projects = workspaceStore.useQuery(
    queryDb(
      (get) => {
        const { searchQuery } = get(uiStateQuery)
        return workspaceSchema.tables.projects
          .where(
            'id',
            'IN',
            userProjects as any, // IN operator requires string[] but types are not inferred correctly
          )
          .where('deletedAt', '=', null)
          .where('name', 'LIKE', `%${searchQuery}%`)
      },
      { label: 'visibleProjects', deps: userProjects },
    ),
  )

  const collaborators = workspaceStore.useQuery(
    queryDb(
      workspaceSchema.tables.projectsUsers.where(
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
    workspaceStore.commit(
      workspaceSchema.events.deleteProject({
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value.trim().toLowerCase() || ''

    workspaceStore.commit(workspaceSchema.events.uiStateSet({ searchQuery }))
  }

  const handleClearSearch = () => {
    workspaceStore.commit(
      workspaceSchema.events.uiStateSet({ searchQuery: '' }),
    )
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
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {(projectWithCollaborators.length > 0 || searchQuery !== '') && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
      )}

      {projectWithCollaborators.length === 0 && searchQuery === '' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started by creating your first project to organize your work.
          </p>
          <Button onClick={handleCreateProject}>
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : projectWithCollaborators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            No projects match your search query. Try adjusting your search
            terms.
          </p>
          <Button variant="outline" size="sm" onClick={handleClearSearch}>
            <X className="size-4" />
            Clear Search
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
