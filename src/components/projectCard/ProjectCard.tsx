import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Trash2,
  UserIcon,
  UserStarIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/authUser.store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import { useState } from 'react'

export interface ProjectWithCollaborators {
  id: string
  name: string
  collaborators: {
    userId: string
    isAdmin: boolean
    projectId: string
  }[]
}

interface ProjectCardProps {
  project: ProjectWithCollaborators
  className?: string
  onEdit?: (project: ProjectWithCollaborators) => void
  onDelete?: (projectId: string) => void
}

export function ProjectCard({
  project,
  className,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const user = useAuthUser()!
  const { id, name, collaborators } = project
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.(project)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    onDelete?.(id)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDropdownMenuOpenChange = () => {
    setIsConfirmingDelete(false)
  }

  const isAdmin = collaborators.some(
    (collaborator) => collaborator.userId === user.id && collaborator.isAdmin,
  )

  const canDelete = isAdmin && typeof onDelete !== 'undefined'
  const canEdit = typeof onEdit !== 'undefined'

  return (
    <div
      className={cn('block transition-transform hover:scale-[1.02]', className)}
    >
      <Card className="h-full cursor-pointer transition-all hover:border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Link
              to="/projects/$projectId"
              params={{ projectId: id }}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FolderKanban className="h-5 w-5" />
              </div>
              <CardTitle className="line-clamp-2 flex-1">{name}</CardTitle>
            </Link>
            {(canEdit || canDelete) && (
              <div onClick={handleMenuClick} className="shrink-0">
                <DropdownMenu onOpenChange={onDropdownMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleMenuClick}
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={handleMenuClick}>
                    {canEdit && (
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleDeleteClick}
                      >
                        <Trash2 className="size-4" />
                        {isConfirmingDelete ? 'Confirm Delete?' : 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Link
            to="/projects/$projectId"
            params={{ projectId: id }}
            className="block"
          >
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {isAdmin ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <UserStarIcon className="size-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      You are the admin of this project
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <UserIcon className="size-4 text-muted-foreground" />
              )}{' '}
              Click to open project
            </p>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
