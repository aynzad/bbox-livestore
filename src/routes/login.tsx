import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { CredentialResponse } from '@react-oauth/google'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { resetAuthUserStore, setAuthUser } from '@/store/authUser.store'
import { workspaceStoreOptions } from '@/store/workspace/workspace.store'
import workspaceSchema from '@/store/workspace/workspace.schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderKanban } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  beforeLoad: () => {
    resetAuthUserStore()
  },
})

function RouteComponent() {
  const { storeRegistry } = Route.useRouteContext()
  const navigate = useNavigate()

  const login = ({ token }: { token: string }) => {
    fetch(`${import.meta.env.VITE_LIVESTORE_SYNC_URL}/api/login`, {
      method: 'POST',
      body: JSON.stringify({ idToken: token }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setAuthUser({ ...data.user, token: data.token })
          const workspaceStore = await storeRegistry.getOrLoad(
            workspaceStoreOptions(data.token),
          )

          // TODO: should be done on server side
          workspaceStore.commit(
            workspaceSchema.events.createUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
            }),
          )

          navigate({ to: '/' })
        } else {
          console.error(data.error)
        }
      })
  }
  const handleSuccess = ({ credential }: CredentialResponse) => {
    if (credential) {
      login({ token: credential })
    } else {
      console.error("Couldn't obtain token, please try again")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Welcome to BBox LiveStore
            </CardTitle>
            <CardDescription className="text-base">
              Sign in with Google to get started
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              context="signin"
              size="large"
              locale="en-US"
              shape="pill"
              onSuccess={handleSuccess}
              width={100}
            />
          </GoogleOAuthProvider>
        </CardContent>
      </Card>
    </div>
  )
}
