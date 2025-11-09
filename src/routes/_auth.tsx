import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { AuthSidebar } from '@/components/sidebar/authSidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { FolderKanban } from 'lucide-react'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AuthSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex flex-1 justify-start">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex flex-1 justify-center sm:hidden">
            <Link to="/">
              <FolderKanban className="size-8 text-primary" />
            </Link>
          </div>
          <div className="flex flex-1"></div>
        </header>
        <div className="flex flex-1 flex-col gap-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
