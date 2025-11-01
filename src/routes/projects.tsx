import { adapter } from '@/livestore/adopter'
import { schema } from '@/livestore/schema'
import { isAuthUserAuthenticated, useAuthUser } from '@/store/authUser.store'
import { LiveStoreProvider } from '@livestore/react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

export const Route = createFileRoute('/projects')({
  beforeLoad: () => {
    if (!isAuthUserAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => {
    const authUser = useAuthUser()

    return (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        renderLoading={(_) => <div>Loading LiveStore ({_.stage})...</div>}
        batchUpdates={batchUpdates}
        syncPayload={authUser ? { authToken: authUser.token } : undefined}
        storeId="synced-bbox-livestore-3"
      >
        <Outlet />
      </LiveStoreProvider>
    )
  },
})
