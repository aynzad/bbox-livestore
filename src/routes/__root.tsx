import { lazy } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { StoreRegistry } from '@livestore/react/experimental'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const TanStackDevtools = lazy(() =>
  import('@tanstack/react-devtools').then((mod) => ({
    default: mod.TanStackDevtools,
  })),
)

type RouterContext = {
  storeRegistry: StoreRegistry
}

const RootComponent = () => {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && (
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
      )}
    </>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
