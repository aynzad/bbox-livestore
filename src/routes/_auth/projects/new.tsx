import { useState } from 'react'
import projectsSchema from '@/store/projects/projects.schema'
import { useAuthUser } from '@/store/authUser.store'
import { useStore } from '@livestore/react/experimental'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { projectsStoreOptions } from '@/store/projects/projects.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multiSelect'

export const Route = createFileRoute('/_auth/projects/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const user = useAuthUser()!
  const projectsStore = useStore(projectsStoreOptions(user.token))
  const users = projectsStore.useQuery(
    projectsSchema.tables.users.where('id', '!=', user.id),
  )

  const [projectName, setProjectName] = useState('')
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([])

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
    navigate({ to: '/projects' })
  }

  const collaboratorOptions = users.map((user) => ({
    label: `${user.name} (${user.email})`,
    value: user.id,
  }))

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Enter a name for your project and select collaborators.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/projects' })}
              >
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
