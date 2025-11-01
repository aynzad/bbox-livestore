import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { CredentialResponse } from '@react-oauth/google'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { resetAuthUserStore, setAuthUser } from '@/store/authUser.store'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  beforeLoad: () => {
    resetAuthUserStore()
  },
})

function RouteComponent() {
  const navigate = useNavigate()

  const login = ({ token }: { token: string }) => {
    fetch(`${import.meta.env.VITE_LIVESTORE_SYNC_URL}/api/login`, {
      method: 'POST',
      body: JSON.stringify({ idToken: token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAuthUser({ ...data.user, token: data.token })
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
    <div className="flex justify-center items-center h-screen">
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
    </div>
  )
}
