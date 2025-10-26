import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { LiveStoreProvider } from '@livestore/react'

import Header from '../components/Header'
import { schema } from '@/livestore/schema'
import { adapter } from '@/livestore/adopter'

export const Route = createRootRoute({
  component: () => (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <div>Loading LiveStore ({_.stage})...</div>}
      batchUpdates={batchUpdates}
      syncPayload={{ authToken: 'insecure-token-change-me' }}
      storeId="synced-bbox-livestore-2"
    >
      <Header />
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </LiveStoreProvider>
  ),
})
