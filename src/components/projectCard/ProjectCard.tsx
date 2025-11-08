import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  id: string
  name: string
  className?: string
}

export function ProjectCard({ id, name, className }: ProjectCardProps) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: id }}
      className={cn('block transition-transform hover:scale-[1.02]', className)}
    >
      <Card className="h-full cursor-pointer transition-colors hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <CardTitle className="line-clamp-2 flex-1">{name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Click to open project</p>
        </CardContent>
      </Card>
    </Link>
  )
}

