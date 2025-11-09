import { useState } from 'react'
import workspaceSchema from '@/store/workspace/workspace.schema'
import { useAuthUser } from '@/store/authUser.store'
import { useStore } from '@livestore/react/experimental'
import { workspaceStoreOptions } from '@/store/workspace/workspace.store'
import { queryDb } from '@livestore/livestore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multiSelect'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import type { ProjectWithCollaborators } from '../projectCard/ProjectCard'

interface UpsertProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectWithCollaborators
}

export function UpsertProjectModal({
  open,
  onOpenChange,
  project,
}: UpsertProjectModalProps) {
  if (!open) return null

  return (
    <UpsertProjectModalInner
      open
      onOpenChange={onOpenChange}
      project={project}
    />
  )
}

function UpsertProjectModalInner({
  open,
  onOpenChange,
  project,
}: UpsertProjectModalProps) {
  const user = useAuthUser()!
  const workspaceStore = useStore(workspaceStoreOptions(user.token))

  const isEditMode = !!project

  const adminId =
    project?.collaborators.find((collaborator) => collaborator.isAdmin)
      ?.userId || user.id
  const users = workspaceStore.useQuery(
    queryDb(
      isEditMode
        ? workspaceSchema.tables.users
        : workspaceSchema.tables.users.where('id', '!=', user.id),
      {
        deps: [user?.id, isEditMode ? 'edit' : 'create'],
      },
    ),
  )

  const [projectName, setProjectName] = useState(project?.name || '')
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    project?.collaborators.map((collaborator) => collaborator.userId) || [],
  )

  const onProjectCreated = (name: string, collaborators: string[]) => {
    workspaceStore.commit(
      workspaceSchema.events.createProject({
        id: crypto.randomUUID(),
        name: name,
        userId: user.id,
        collaborators: collaborators,
      }),
    )
  }

  const onProjectUpdated = (
    id: string,
    name: string,
    collaborators: string[],
  ) => {
    workspaceStore.commit(
      workspaceSchema.events.updateProject({
        id,
        name,
      }),
    )

    const allCollaborators =
      project?.collaborators.map((collaborator) => collaborator.userId) || []

    // Remove collaborators that are no longer selected and not the admin
    const toRemove = allCollaborators.filter(
      (id) => !collaborators.includes(id) && id !== adminId,
    )
    toRemove.forEach((userId) => {
      workspaceStore.commit(
        workspaceSchema.events.removeUserFromProject({
          userId,
          projectId: id,
        }),
      )
    })

    // Add new collaborators
    const toAdd = collaborators.filter((id) => !allCollaborators.includes(id))
    toAdd.forEach((userId) => {
      workspaceStore.commit(
        workspaceSchema.events.addUserToProject({
          userId,
          projectId: id,
          isAdmin: false,
        }),
      )
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!projectName.trim()) {
      return
    }

    if (isEditMode && project) {
      onProjectUpdated(project.id, projectName.trim(), selectedCollaborators)
    } else {
      onProjectCreated(projectName.trim(), selectedCollaborators)
    }

    // Reset form
    setProjectName('')
    setSelectedCollaborators([])
    // Close modal
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    // Reset form when closing
    if (!newOpen) {
      setProjectName('')
      setSelectedCollaborators([])
    }
  }

  const collaboratorOptions = users.map((user) => ({
    label: `${user.name} ${user.id === adminId ? '*' : ''}`,
    description: user.id === adminId ? 'Admin' : 'Collaborator',
    value: user.id,
  }))

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="sm:max-w-[500px] px-4">
        <ModalHeader>
          <ModalTitle>
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </ModalTitle>
          <ModalDescription>
            {isEditMode
              ? 'Update your project name and collaborators.'
              : 'Enter a name for your project and select collaborators.'}
          </ModalDescription>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              type="text"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collaborators">Collaborators</Label>
            <MultiSelect
              id="collaborators"
              options={collaboratorOptions}
              value={selectedCollaborators}
              onValueChange={setSelectedCollaborators}
              placeholder="Select collaborators (optional)"
              maxCount={5}
            />
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update Project' : 'Create Project'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
