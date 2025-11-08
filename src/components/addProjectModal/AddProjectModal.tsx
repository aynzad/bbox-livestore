import { useState } from 'react'
import projectsSchema from '@/store/projects/projects.schema'
import { useAuthUser } from '@/store/authUser.store'
import { useStore } from '@livestore/react/experimental'
import { projectsStoreOptions } from '@/store/projects/projects.store'
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

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const user = useAuthUser()!
  const projectsStore = useStore(projectsStoreOptions(user.token))
  const users = projectsStore.useQuery(
    projectsSchema.tables.users.where('id', '!=', user.id),
  )

  const [projectName, setProjectName] = useState('')
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    [],
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

    if (!projectName.trim()) {
      return
    }

    onProjectCreated(projectName.trim(), selectedCollaborators)
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
    label: `${user.name} (${user.email})`,
    value: user.id,
  }))

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle>Create New Project</ModalTitle>
          <ModalDescription>
            Enter a name for your project and select collaborators.
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
            <Button type="submit">Create Project</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
