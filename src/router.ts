import { createRouter } from '@tanstack/react-router'
import { StoreRegistry } from '@livestore/react/experimental'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import { routeTree } from './routeTree.gen.ts'

const getRouter = () => {
  const storeRegistry = new StoreRegistry({
    defaultOptions: {
      batchUpdates,
      disableDevtools: false,
      confirmUnsavedChanges: true,
    },
  })

  return createRouter({
    routeTree,
    context: {
      storeRegistry,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
  })
}

export const router = getRouter()

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
